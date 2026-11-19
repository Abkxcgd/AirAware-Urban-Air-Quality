import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return key;
}

interface AirQualityAssistantContext {
  locationName?: string;
  country?: string;
  aqiScale?: string;
  aqiValue?: number | null;
  category?: string;
  dominantPollutant?: string | null;
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  o3?: number | null;
  so2?: number | null;
  co?: number | null;
  dust?: number | null;
  uvIndex?: number | null;
  measuredAt?: string | null;
  bestWindowSummary?: string | null;
}

interface AssistantRequestBody {
  message?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  airQualityContext?: AirQualityAssistantContext;
  sensitivityProfile?: string;
}

async function generateWithRetry(
  ai: GoogleGenAI,
  prompt: string,
  systemInstruction: string
) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : '';
      const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
      if (!isTransient || attempt === 1) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/assistant/status', (_req, res) => {
    const apiKey = getConfiguredApiKey();
    res.json({
      aiConfigured: Boolean(apiKey),
      provider: apiKey ? 'gemini' : 'rule-based',
    });
  });

  app.post('/api/assistant', async (req, res) => {
    const apiKey = getConfiguredApiKey();
    if (!apiKey) {
      return res.status(503).json({
        configured: false,
        error: 'No server-side AI API key is configured. Use the rule-based clean air assistant.',
      });
    }

    const body = (req.body || {}) as AssistantRequestBody;
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const ctx = body.airQualityContext || {};
      const contextLines = [
        `Location: ${ctx.locationName || 'Unknown'}${ctx.country ? `, ${ctx.country}` : ''}`,
        `AQI Scale: ${ctx.aqiScale === 'european_aqi' ? 'European EAQI' : 'US EPA AQI'}`,
        `Current AQI: ${ctx.aqiValue ?? 'Unavailable'} (${ctx.category || 'Unknown'})`,
        `Dominant Pollutant: ${ctx.dominantPollutant || 'Unavailable'}`,
        `PM2.5: ${ctx.pm25 != null ? `${ctx.pm25} µg/m³` : 'Unavailable'}`,
        `PM10: ${ctx.pm10 != null ? `${ctx.pm10} µg/m³` : 'Unavailable'}`,
        `NO2: ${ctx.no2 != null ? `${ctx.no2} µg/m³` : 'Unavailable'}`,
        `Ozone (O3): ${ctx.o3 != null ? `${ctx.o3} µg/m³` : 'Unavailable'}`,
        `SO2: ${ctx.so2 != null ? `${ctx.so2} µg/m³` : 'Unavailable'}`,
        `CO: ${ctx.co != null ? `${ctx.co} µg/m³` : 'Unavailable'}`,
        `Dust: ${ctx.dust != null ? `${ctx.dust} µg/m³` : 'Unavailable'}`,
        `UV Index: ${ctx.uvIndex ?? 'Unavailable'}`,
        `Data timestamp: ${ctx.measuredAt || 'Unavailable'}`,
        `Forecast window insight: ${ctx.bestWindowSummary || 'Not available'}`,
        `User health sensitivity profile: ${body.sensitivityProfile || 'standard'}`,
      ].join('\n');

      const recentHistory = Array.isArray(body.history)
        ? body.history
            .slice(-6)
            .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`)
            .join('\n')
        : '';

      const systemInstruction = `You are the AirAware Clean Air Assistant.
Your mission is to help users understand urban air pollution, protect their health, plan safer daily activities, and adopt sustainable clean-air habits.

STRICT RULES:
1. Base all air quality statements strictly on the live Open-Meteo data provided below. If a reading is "Unavailable", explicitly say it is unavailable—never invent numbers.
2. Tailor advice to the user's health sensitivity profile (standard, sensitive, children_elderly, athlete).
3. Never provide medical diagnoses or prescribe medication. Encourage consulting a healthcare professional for respiratory or cardiac symptoms.
4. Keep responses clear, practical, structured with concise bullet points when helpful, and under 220 words unless asked for deeper detail.
5. Distinguish clearly between current model analysis and hourly forecast windows.`;

      const prompt = `LIVE AIR QUALITY CONTEXT:\n${contextLines}\n\n${
        recentHistory ? `RECENT CONVERSATION:\n${recentHistory}\n\n` : ''
      }USER QUESTION: ${message}`;

      const response = await generateWithRetry(ai, prompt, systemInstruction);

      const replyText = response.text?.trim();
      if (!replyText) {
        return res.status(502).json({
          configured: true,
          error: 'The AI model returned an empty response. You can retry or switch to the rule-based assistant.',
        });
      }

      return res.json({
        configured: true,
        mode: 'gemini',
        reply: replyText,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unexpected upstream AI error.';
      return res.status(502).json({
        configured: true,
        error: `Live AI service unavailable: ${errorMessage}`,
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AirAware server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
