import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Copy,
  Dumbbell,
  Leaf,
  Megaphone,
  Share2,
  Train,
  Users,
} from 'lucide-react';
import type {
  AirQualityDataset,
  AqiScale,
  CommunityTrackerState,
  SensitivityProfile,
} from '../types/airQuality';
import { analyzeForecastWindows, buildHealthAdvisory, getAqiValue } from '../utils/aqi';
import {
  AWARENESS_CAMPAIGNS,
  COMMUNITY_ACTIONS,
  SHAREABLE_MESSAGES,
  SUSTAINABLE_PRACTICES,
} from '../data/guides';

interface DailyPlanViewProps {
  dataset: AirQualityDataset | null;
  locationName: string;
  aqiScale: AqiScale;
  sensitivityProfile: SensitivityProfile;
  trackerState: CommunityTrackerState;
  onToggleAction: (actionId: string) => void;
  onCopyText: (text: string, label: string) => void;
}

type PlanSection = 'schedule' | 'lifestyle' | 'community';

export const DailyPlanView: React.FC<DailyPlanViewProps> = ({
  dataset,
  locationName,
  aqiScale,
  sensitivityProfile,
  trackerState,
  onToggleAction,
  onCopyText,
}) => {
  const [section, setSection] = useState<PlanSection>('schedule');

  const forecast = analyzeForecastWindows(dataset, aqiScale);
  const advisory = dataset ? buildHealthAdvisory(dataset.current, aqiScale, sensitivityProfile) : null;
  const currentAqi = dataset ? getAqiValue(dataset.current, aqiScale) : null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCompleted = trackerState.dailyLogs[todayKey] || [];
  const todayPoints = COMMUNITY_ACTIONS.filter((a) => todayCompleted.includes(a.id)).reduce(
    (sum, a) => sum + a.points,
    0
  );
  const maxDailyPoints = COMMUNITY_ACTIONS.reduce((sum, a) => sum + a.points, 0);
  const progressPct = maxDailyPoints > 0 ? Math.round((todayPoints / maxDailyPoints) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Section Header & Sub-Navigation */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Daily Plan &amp; Clean-Air Action
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Forecast-backed activity timing, sustainable routines, and local community impact for {locationName}.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
            <button
              type="button"
              onClick={() => setSection('schedule')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                section === 'schedule'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daily Planner
            </button>
            <button
              type="button"
              onClick={() => setSection('lifestyle')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                section === 'lifestyle'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sustainable Habits
            </button>
            <button
              type="button"
              onClick={() => setSection('community')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                section === 'community'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Community Tracker
            </button>
          </div>
        </div>
      </section>

      {/* Feature 2: Smart Daily Activity Planner */}
      {section === 'schedule' && (
        <div className="space-y-6">
          <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Lower-Pollution Activity Windows (Next 24h)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Computed exclusively from live Open-Meteo hourly forecast points.
            </p>

            {!forecast.hasForecast ? (
              <div className="mt-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">
                Hourly forecast data is currently unavailable for {locationName}. Wait for forecast
                refresh before scheduling time-specific outdoor windows, and rely on current indoor
                or low-exertion alternatives below.
              </div>
            ) : forecast.bestWindows.length === 0 ? (
              <div className="mt-4 p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  No low-pollution outdoor windows forecasted in the next 24 hours
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                  Forecasted AQI remains elevated across upcoming hours. Shift vigorous workouts indoors
                  and prioritize clean indoor air.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {forecast.bestWindows.map((win, idx) => (
                  <div
                    key={`${win.startLabel}-${idx}`}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                          Window {idx + 1}
                        </span>
                        <span className={`text-xs font-semibold ${win.category.textColorClass}`}>
                          {win.category.shortLabel}
                        </span>
                      </div>
                      <p className="font-display text-lg font-bold text-slate-900 dark:text-white mt-1.5 tabular-nums">
                        {win.startLabel} – {win.endLabel}
                      </p>
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        Avg {win.avgAqi} {aqiScale === 'european_aqi' ? 'EU EAQI' : 'US AQI'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                      {win.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
                <Dumbbell className="w-5 h-5" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Outdoor Exercise Plan
                </h3>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-3">
                {advisory ? advisory.exerciseVerdict : 'Load live data to plan'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {advisory
                  ? advisory.exerciseDetail
                  : 'Refresh your selected city to get intensity guidance tailored to your sensitivity profile.'}
              </p>
            </section>

            <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Leaf className="w-5 h-5" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Indoor Alternatives
                </h3>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>
                  • Bodyweight circuit, yoga flow, or stationary cycling in a HEPA-filtered room.
                </li>
                <li>
                  • Mobility stretching and core stability sessions when outdoor PM2.5 spikes.
                </li>
                <li>
                  • Indoor mall or community center walking loops during peak afternoon haze.
                </li>
              </ul>
            </section>

            <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
                <Train className="w-5 h-5" />
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Safer Commuting
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                {advisory
                  ? advisory.commutingDetail
                  : 'Prefer greenway side streets away from idling intersections and switch cabin airflow to recirculate in heavy traffic.'}
              </p>
              {currentAqi !== null && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 tabular-nums">
                  Based on current {Math.round(currentAqi)}{' '}
                  {aqiScale === 'european_aqi' ? 'EU EAQI' : 'US AQI'} reading.
                </p>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Feature 5: Sustainable Lifestyle */}
      {section === 'lifestyle' && (
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Sustainable Clean-Air Lifestyle
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
            Practical everyday shifts that directly cut urban PM2.5, NO₂, and carbon emissions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SUSTAINABLE_PRACTICES.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {item.area}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {item.impact}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    Try this: <span className="font-normal text-slate-600 dark:text-slate-300">{item.actionTip}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Feature 6: Community Clean Air */}
      {section === 'community' && (
        <div className="space-y-6">
          {/* Personal Action Tracker & Daily Progress */}
          <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                    Personal &amp; Community Action Tracker
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Today ({todayKey}) · Saved automatically in your browser&apos;s local storage.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="font-mono text-2xl font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                  {todayPoints} / {maxDailyPoints} pts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  {todayCompleted.length} of {COMMUNITY_ACTIONS.length} daily habits completed ({progressPct}%)
                </p>
              </div>
            </div>

            <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-600 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {COMMUNITY_ACTIONS.map((action) => {
                const checked = todayCompleted.includes(action.id);
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onToggleAction(action.id)}
                    className="w-full min-h-[60px] px-4 py-3 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-start justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            checked
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {action.category} · {action.description}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-semibold text-teal-700 dark:text-teal-400 tabular-nums shrink-0 pt-0.5">
                      +{action.points}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Awareness Campaigns & Shareable Messages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Megaphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Neighborhood Awareness Campaigns
                </h2>
              </div>
              <div className="space-y-3">
                {AWARENESS_CAMPAIGNS.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400">
                      {camp.audience}
                    </span>
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {camp.summary}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Shareable Clean-Air Messages
                </h2>
              </div>
              <div className="space-y-3">
                {SHAREABLE_MESSAGES.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {msg.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => onCopyText(msg.text, msg.label)}
                        className="min-h-[36px] px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      &ldquo;{msg.text}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
