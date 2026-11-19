import React, { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send, AlertCircle, Loader2, User } from 'lucide-react';
import type {
  AirQualityDataset,
  AqiScale,
  ChatMessage,
  SavedLocation,
  SensitivityProfile,
} from '../types/airQuality';
import {
  analyzeForecastWindows,
  formatReadableTimestamp,
  generateRuleBasedReply,
  getAqiCategory,
  getAqiValue,
  getDominantPollutant,
} from '../utils/aqi';

interface AssistantViewProps {
  dataset: AirQualityDataset | null;
  location: SavedLocation;
  aqiScale: AqiScale;
  sensitivityProfile: SensitivityProfile;
}

const SUGGESTED_QUESTIONS = [
  'Is it safe to run today?',
  'What does PM2.5 mean?',
  'How can I protect my family during smog?',
  'How can I improve indoor air quality?',
  'What should I do when AQI becomes hazardous?',
];

function renderFormattedText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return (
              <strong key={partIdx} className="font-semibold text-slate-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={partIdx}>{part}</React.Fragment>;
        })}
      </p>
    );
  });
}

export const AssistantView: React.FC<AssistantViewProps> = ({
  dataset,
  location,
  aqiScale,
  sensitivityProfile,
}) => {
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [preferRuleBased, setPreferRuleBased] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/assistant/status')
      .then((res) => (res.ok ? res.json() : { aiConfigured: false }))
      .then((data: { aiConfigured?: boolean }) => {
        if (active) {
          setAiConfigured(Boolean(data.aiConfigured));
        }
      })
      .catch(() => {
        if (active) {
          setAiConfigured(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const aqiVal = dataset ? getAqiValue(dataset.current, aqiScale) : null;
  const cat = getAqiCategory(aqiVal, aqiScale);
  const dominant = dataset ? getDominantPollutant(dataset.current) : null;
  const forecast = analyzeForecastWindows(dataset, aqiScale);

  const effectiveEngine: 'gemini' | 'rule-based' =
    aiConfigured && !preferRuleBased ? 'gemini' : 'rule-based';

  const sendMessage = async (questionText: string, forceRuleBased = false) => {
    const trimmed = questionText.trim();
    if (!trimmed || sending) return;

    setApiError(null);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      engine: forceRuleBased ? 'rule-based' : effectiveEngine,
    };

    const nextHistory = [...messages, userMsg];
    if (!forceRuleBased) {
      setMessages(nextHistory);
      setInput('');
    }

    if (forceRuleBased || effectiveEngine === 'rule-based') {
      const reply = generateRuleBasedReply(
        trimmed,
        dataset,
        location.name,
        aqiScale,
        sensitivityProfile
      );
      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
        engine: 'rule-based',
      };
      setMessages((prev) => [...prev, botMsg]);
      return;
    }

    setSending(true);
    try {
      const bestWindowSummary =
        forecast.bestWindows.length > 0
          ? `Best window: ${forecast.bestWindows[0].startLabel}–${forecast.bestWindows[0].endLabel} (avg ${forecast.bestWindows[0].avgAqi})`
          : forecast.trendSummary;

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          sensitivityProfile,
          airQualityContext: {
            locationName: location.name,
            country: location.country,
            aqiScale,
            aqiValue: aqiVal !== null ? Math.round(aqiVal) : null,
            category: cat.label,
            dominantPollutant: dominant ? `${dominant.code} (${dominant.valueText})` : null,
            pm25: dataset?.current.pm2_5 ?? null,
            pm10: dataset?.current.pm10 ?? null,
            no2: dataset?.current.nitrogen_dioxide ?? null,
            o3: dataset?.current.ozone ?? null,
            so2: dataset?.current.sulphur_dioxide ?? null,
            co: dataset?.current.carbon_monoxide ?? null,
            dust: dataset?.current.dust ?? null,
            uvIndex: dataset?.current.uv_index ?? null,
            measuredAt: dataset?.current.time ?? null,
            bestWindowSummary,
          },
        }),
      });

      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        configured?: boolean;
      };

      if (!res.ok || !data.reply) {
        if (data.configured === false) {
          setAiConfigured(false);
          const fallbackReply = generateRuleBasedReply(
            trimmed,
            dataset,
            location.name,
            aqiScale,
            sensitivityProfile
          );
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: 'assistant',
              content: fallbackReply,
              timestamp: new Date().toISOString(),
              engine: 'rule-based',
            },
          ]);
          return;
        }
        throw new Error(data.error || 'AI service returned an error.');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: data.reply!,
          timestamp: new Date().toISOString(),
          engine: 'gemini',
        },
      ]);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'Could not reach the live AI assistant.'
      );
    } finally {
      setSending(false);
    }
  };

  const lastUserQuestion = [...messages].reverse().find((m) => m.role === 'user')?.content;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                Clean Air Assistant
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>
                {aiConfigured === null
                  ? 'Checking assistant engine...'
                  : effectiveEngine === 'gemini'
                  ? 'Live Gemini AI · Context-aware'
                  : 'Rule-Based Clean Air Engine · Local mode'}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {location.name}:{' '}
                {aqiVal !== null
                  ? `${Math.round(aqiVal)} ${aqiScale === 'european_aqi' ? 'EU EAQI' : 'US AQI'} (${cat.shortLabel})`
                  : 'Readings unavailable'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {aiConfigured && (
              <button
                type="button"
                onClick={() => setPreferRuleBased((v) => !v)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {preferRuleBased ? 'Switch to Live AI' : 'Use Rule-Based Mode'}
              </button>
            )}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setApiError(null);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Suggested prompts */}
        <div className="py-3.5 border-b border-slate-100 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Suggested questions:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                disabled={sending}
                className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-500 dark:hover:border-teal-400 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Message Feed */}
        <div
          ref={scrollRef}
          className="h-[360px] sm:h-[420px] overflow-y-auto py-4 space-y-4 pr-1"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Bot className="w-10 h-10 text-teal-600 dark:text-teal-400 mb-3" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Ask anything about today&apos;s air quality
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
                Answers incorporate your current {location.name} readings
                {dominant ? ` (${dominant.code}: ${dominant.valueText})` : ''} and your selected
                health sensitivity profile.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 dark:bg-teal-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="text-xs sm:text-sm">
                      {isUser ? msg.content : renderFormattedText(msg.content)}
                    </div>
                    <div
                      className={`mt-2 text-[10px] tabular-nums ${
                        isUser
                          ? 'text-slate-300 dark:text-teal-100'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {formatReadableTimestamp(msg.timestamp)}
                      {!isUser && (
                        <>
                          {' · '}
                          {msg.engine === 'gemini' ? 'Live Gemini AI' : 'Rule-Based Engine'}
                        </>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-teal-600 dark:text-teal-400" />
              <span>Analyzing {location.name} air quality context...</span>
            </div>
          )}
        </div>

        {/* Upstream API Error with explicit rule-based option */}
        {apiError && (
          <div
            role="alert"
            className="mb-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 text-xs text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
            {lastUserQuestion && (
              <button
                type="button"
                onClick={() => sendMessage(lastUserQuestion, true)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shrink-0 whitespace-nowrap"
              >
                Answer with Rule-Based Engine
              </button>
            )}
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2"
        >
          <label htmlFor="assistant-input" className="sr-only">
            Ask a question about air quality
          </label>
          <input
            id="assistant-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about outdoor exercise, PM2.5, commuting, or indoor air..."
            className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 dark:focus:border-teal-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || input.trim().length === 0}
            aria-label="Send message"
            className="min-h-[46px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
      </section>
    </div>
  );
};
