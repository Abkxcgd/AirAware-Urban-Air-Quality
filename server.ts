import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const ALLOWED_PROFILES = new Set(['standard', 'sensitive', 'children_elderly', 'athlete']);

export function getConfiguredApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return key;
}

function sanitizeText(value: unknown, maxLength = 120): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function sanitizeNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export interface AirQualityAssistantContext {
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

export interface AssistantRequestBody {
  message?: unknown;
  history?: unknown;
  airQualityContext?: unknown;
  sensitivityProfile?: unknown;
}

function createRateLimiter() {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const existing = hits.get(ip);

    if (!existing || now > existing.resetAt) {
      hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return next();
    }

    if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many assistant requests. Please wait a moment before trying again.',
      });
    }

    existing.count += 1;
    return next();
  };
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

export async function createApp(options: { enableVite?: boolean } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '256kb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  const rateLimitAssistant = createRateLimiter();

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

  app.post('/api/assistant', rateLimitAssistant, async (req, res) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as AssistantRequestBody;
    const message = sanitizeText(body.message, MAX_MESSAGE_LENGTH);

    if (!message) {
      return res.status(400).json({ error: 'A valid non-empty message is required.' });
    }

    if (typeof body.message === 'string' && body.message.trim().length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
      });
    }

    const apiKey = getConfiguredApiKey();
    if (!apiKey) {
      return res.status(503).json({
        configured: false,
        error: 'No server-side AI API key is configured. Use the rule-based clean air assistant.',
      });
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

      const rawCtx =
        body.airQualityContext && typeof body.airQualityContext === 'object'
          ? (body.airQualityContext as Record<string, unknown>)
          : {};

      const locationName = sanitizeText(rawCtx.locationName, 80) || 'Unknown';
      const country = sanitizeText(rawCtx.country, 80);
      const aqiScale = rawCtx.aqiScale === 'european_aqi' ? 'European EAQI' : 'US EPA AQI';
      const aqiValue = sanitizeNumber(rawCtx.aqiValue);
      const category = sanitizeText(rawCtx.category, 60) || 'Unknown';
      const dominantPollutant = sanitizeText(rawCtx.dominantPollutant, 60) || 'Unavailable';
      const pm25 = sanitizeNumber(rawCtx.pm25);
      const pm10 = sanitizeNumber(rawCtx.pm10);
      const no2 = sanitizeNumber(rawCtx.no2);
      const o3 = sanitizeNumber(rawCtx.o3);
      const so2 = sanitizeNumber(rawCtx.so2);
      const co = sanitizeNumber(rawCtx.co);
      const dust = sanitizeNumber(rawCtx.dust);
      const uvIndex = sanitizeNumber(rawCtx.uvIndex);
      const measuredAt = sanitizeText(rawCtx.measuredAt, 64) || 'Unavailable';
      const bestWindowSummary = sanitizeText(rawCtx.bestWindowSummary, 220) || 'Not available';
      const profile =
        typeof body.sensitivityProfile === 'string' && ALLOWED_PROFILES.has(body.sensitivityProfile)
          ? body.sensitivityProfile
          : 'standard';

      const contextLines = [
        `Location: ${locationName}${country ? `, ${country}` : ''}`,
        `AQI Scale: ${aqiScale}`,
        `Current AQI: ${aqiValue ?? 'Unavailable'} (${category})`,
        `Dominant Pollutant: ${dominantPollutant}`,
        `PM2.5: ${pm25 !== null ? `${pm25} µg/m³` : 'Unavailable'}`,
        `PM10: ${pm10 !== null ? `${pm10} µg/m³` : 'Unavailable'}`,
        `NO2: ${no2 !== null ? `${no2} µg/m³` : 'Unavailable'}`,
        `Ozone (O3): ${o3 !== null ? `${o3} µg/m³` : 'Unavailable'}`,
        `SO2: ${so2 !== null ? `${so2} µg/m³` : 'Unavailable'}`,
        `CO: ${co !== null ? `${co} µg/m³` : 'Unavailable'}`,
        `Dust: ${dust !== null ? `${dust} µg/m³` : 'Unavailable'}`,
        `UV Index: ${uvIndex ?? 'Unavailable'}`,
        `Data timestamp: ${measuredAt}`,
        `Forecast window insight: ${bestWindowSummary}`,
        `User health sensitivity profile: ${profile}`,
      ].join('\n');

      const recentHistory = Array.isArray(body.history)
        ? body.history
            .slice(-MAX_HISTORY_ITEMS)
            .map((entry) => {
              if (!entry || typeof entry !== 'object') return null;
              const rec = entry as Record<string, unknown>;
              const role = rec.role === 'user' ? 'User' : rec.role === 'assistant' ? 'Assistant' : null;
              const content = sanitizeText(rec.content, MAX_MESSAGE_LENGTH);
              return role && content ? `${role}: ${content}` : null;
            })
            .filter((line): line is string => line !== null)
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

  if (options.enableVite !== false) {
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
  }

  return app;
}

if (process.env.VITEST !== 'true') {
  createApp().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`AirAware server running on http://0.0.0.0:${PORT}`);
    });
  });
}
