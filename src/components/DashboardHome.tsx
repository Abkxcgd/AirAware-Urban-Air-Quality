import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Compass,
  Droplets,
  Home,
  Info,
  MapPin,
  RefreshCw,
  Share2,
  ShieldAlert,
  Train,
  Wind,
} from 'lucide-react';
import type {
  AirQualityDataset,
  AqiScale,
  SavedLocation,
  SensitivityProfile,
} from '../types/airQuality';
import {
  buildHealthAdvisory,
  formatReadableTimestamp,
  getAqiCategory,
  getAqiValue,
  getDominantPollutant,
  SENSITIVITY_PROFILE_LABELS,
} from '../utils/aqi';
import { INDOOR_AIR_GUIDES } from '../data/guides';
import { AqiGauge } from './AqiGauge';

interface DashboardHomeProps {
  location: SavedLocation;
  dataset: AirQualityDataset | null;
  loading: boolean;
  error: string | null;
  aqiScale: AqiScale;
  sensitivityProfile: SensitivityProfile;
  onChangeScale: (scale: AqiScale) => void;
  onRefresh: () => void;
  onOpenLocationPicker: () => void;
  onOpenScaleModal: () => void;
  onShareSummary: () => void;
  onNavigateTab: (tab: 'insights' | 'plan' | 'assistant') => void;
}

interface PollutantMeta {
  key: 'pm2_5' | 'pm10' | 'nitrogen_dioxide' | 'ozone' | 'sulphur_dioxide' | 'carbon_monoxide' | 'dust' | 'uv_index';
  code: string;
  name: string;
  unit: string;
  whoGuide: number | null;
  summary: string;
}

const POLLUTANT_DEFS: PollutantMeta[] = [
  {
    key: 'pm2_5',
    code: 'PM2.5',
    name: 'Fine Particles',
    unit: 'µg/m³',
    whoGuide: 15,
    summary: 'Microscopic particles from vehicle exhaust, smoke, and industry that penetrate deep into lung tissue.',
  },
  {
    key: 'pm10',
    code: 'PM10',
    name: 'Coarse Particles',
    unit: 'µg/m³',
    whoGuide: 45,
    summary: 'Inhalable road dust, construction grit, and pollen that irritate eyes, nose, and upper airways.',
  },
  {
    key: 'nitrogen_dioxide',
    code: 'NO₂',
    name: 'Nitrogen Dioxide',
    unit: 'µg/m³',
    whoGuide: 25,
    summary: 'Traffic-related gas from combustion engines and gas stoves; triggers bronchial inflammation.',
  },
  {
    key: 'ozone',
    code: 'O₃',
    name: 'Ground-Level Ozone',
    unit: 'µg/m³',
    whoGuide: 100,
    summary: 'Formed when sunlight reacts with vehicle and solvent emissions; peaks on warm, sunny afternoons.',
  },
  {
    key: 'sulphur_dioxide',
    code: 'SO₂',
    name: 'Sulphur Dioxide',
    unit: 'µg/m³',
    whoGuide: 40,
    summary: 'Gas released by fossil-fuel power generation and shipping; irritates sensitive airways quickly.',
  },
  {
    key: 'carbon_monoxide',
    code: 'CO',
    name: 'Carbon Monoxide',
    unit: 'µg/m³',
    whoGuide: 4000,
    summary: 'Colorless gas from incomplete combustion in congested traffic and poorly vented heaters.',
  },
  {
    key: 'dust',
    code: 'Dust',
    name: 'Mineral Dust',
    unit: 'µg/m³',
    whoGuide: 50,
    summary: 'Windblown desert or urban soil aerosol tracked separately by atmospheric composition models.',
  },
  {
    key: 'uv_index',
    code: 'UV',
    name: 'UV Index',
    unit: 'index',
    whoGuide: 6,
    summary: 'Solar ultraviolet intensity—high UV accelerates photochemical ground-level ozone formation.',
  },
];

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  location,
  dataset,
  loading,
  error,
  aqiScale,
  sensitivityProfile,
  onChangeScale,
  onRefresh,
  onOpenLocationPicker,
  onOpenScaleModal,
  onShareSummary,
  onNavigateTab,
}) => {
  const [expandedPollutant, setExpandedPollutant] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>('ventilation-timing');

  const aqiValue = dataset ? getAqiValue(dataset.current, aqiScale) : null;
  const category = getAqiCategory(aqiValue, aqiScale);
  const dominant = dataset ? getDominantPollutant(dataset.current) : null;
  const advisory = dataset ? buildHealthAdvisory(dataset.current, aqiScale, sensitivityProfile) : null;

  return (
    <div className="space-y-6">
      {/* Location & Control Toolbar */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Open-Meteo Current Analysis</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
              </span>
              {dataset?.current.time && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    Updated {formatReadableTimestamp(dataset.current.time)}
                  </span>
                </>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenLocationPicker}
                className="min-h-[44px] -ml-2 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-2 text-left transition-colors group"
              >
                <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-md">
                  {location.name}
                  {location.country ? `, ${location.country}` : ''}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* AQI Scale Segmented Control */}
            <div
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800"
              role="group"
              aria-label="AQI Scale"
            >
              <button
                type="button"
                onClick={() => onChangeScale('us_aqi')}
                aria-pressed={aqiScale === 'us_aqi'}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  aqiScale === 'us_aqi'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                US AQI
              </button>
              <button
                type="button"
                onClick={() => onChangeScale('european_aqi')}
                aria-pressed={aqiScale === 'european_aqi'}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  aqiScale === 'european_aqi'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                EU EAQI
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenScaleModal}
              aria-label="AQI Scale Reference"
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Scale Info</span>
            </button>

            <button
              type="button"
              onClick={onShareSummary}
              disabled={!dataset}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing' : 'Refresh AQI'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Error State Banner */}
      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                Unable to load live air quality data
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shrink-0 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Primary Hero Row: Circular AQI Gauge + Smart Health Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Current AQI Gauge Card */}
        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                Current Air Quality
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {dataset ? `Fetched ${formatReadableTimestamp(dataset.fetchedAtIso)}` : 'Awaiting data'}
              </span>
            </div>

            <div className="my-5">
              <AqiGauge
                value={aqiValue}
                scale={aqiScale}
                dominantPollutant={dominant}
                loading={loading && !dataset}
              />
            </div>
          </div>

          <div className={`p-4 rounded-2xl border ${category.surfaceTintClass} ${category.borderTintClass}`}>
            <p className={`text-sm font-semibold ${category.textColorClass}`}>
              {category.label}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
              {category.summary}
            </p>
          </div>
        </section>

        {/* Right: Feature 1 – Smart Health Advisor */}
        <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Smart Health Advisor
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Profile: {SENSITIVITY_PROFILE_LABELS[sensitivityProfile]} · Tailored to live conditions
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('plan')}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap"
              >
                View Daily Windows
              </button>
            </div>

            {loading && !advisory ? (
              <div className="mt-5 space-y-3">
                <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            ) : advisory ? (
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <h3 className="text-xs font-bold tracking-tight">Outdoor Exercise</h3>
                  </div>
                  <p className="text-sm font-semibold text-teal-700 dark:text-teal-300 mt-1.5">
                    {advisory.exerciseVerdict}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {advisory.exerciseDetail}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <h3 className="text-xs font-bold tracking-tight">Sensitive Groups</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {advisory.sensitiveGroupsDetail}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <h3 className="text-xs font-bold tracking-tight">Prolonged Outdoor Activity</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {advisory.prolongedActivityDetail}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <Train className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <h3 className="text-xs font-bold tracking-tight">Commuting Exposure</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {advisory.commutingDetail}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                Select a city or refresh readings to generate tailored health advice.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Informational environmental guidance only — not a medical diagnosis.
            </p>
            <button
              type="button"
              onClick={() => onNavigateTab('assistant')}
              className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap"
            >
              Ask AI Assistant about today&apos;s air
            </button>
          </div>
        </section>
      </div>

      {/* Pollutant Breakdown Section */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Live Pollutant Readings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tap any pollutant card to learn its urban sources and health impact.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('insights')}
            className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto whitespace-nowrap"
          >
            View Hourly Trends
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {POLLUTANT_DEFS.map((item) => {
            const rawVal = dataset ? dataset.current[item.key] : null;
            const unit =
              item.key === 'uv_index'
                ? 'index'
                : dataset?.units[item.key as keyof AirQualityDataset['units']] || item.unit;
            const ratio =
              rawVal !== null && item.whoGuide ? Math.min(100, Math.round((rawVal / (item.whoGuide * 2)) * 100)) : 0;
            const elevated = rawVal !== null && item.whoGuide !== null && rawVal > item.whoGuide;
            const isExpanded = expandedPollutant === item.key;

            return (
              <button
                key={item.key}
                type="button"
                aria-expanded={isExpanded}
                onClick={() => setExpandedPollutant(isExpanded ? null : item.key)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-teal-500/60 dark:hover:border-teal-500/60 text-left transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                      {item.code}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {elevated ? 'Elevated' : rawVal !== null ? 'Normal' : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.name}
                  </p>
                </div>

                <div className="mt-3">
                  {loading && !dataset ? (
                    <div className="h-7 w-16 rounded-md bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                        {rawVal !== null ? (item.key === 'uv_index' ? rawVal.toFixed(1) : Math.round(rawVal * 10) / 10) : '—'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {rawVal !== null ? unit : 'Unavailable'}
                      </span>
                    </div>
                  )}

                  {/* Subtle progress track */}
                  <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        elevated ? 'bg-amber-500' : 'bg-teal-600 dark:bg-teal-400'
                      }`}
                      style={{ width: `${rawVal !== null ? Math.max(8, ratio) : 0}%` }}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <p className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Feature 3: Indoor Air Quality Guide */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Indoor Air Quality Guide
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Practical household habits to keep indoor PM2.5, VOCs, and cooking fumes low.
            </p>
          </div>

          {advisory && (
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center gap-2.5 max-w-md">
              <Wind className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">
                <strong className="font-semibold">Live Window Tip:</strong> {advisory.ventilationDetail}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDOOR_AIR_GUIDES.map((guide) => {
            const isOpen = expandedGuide === guide.id;
            return (
              <div
                key={guide.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 flex flex-col justify-between"
              >
                <div>
                  <span className="text-[11px] font-medium text-teal-700 dark:text-teal-400">
                    {guide.category}
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900 dark:text-white mt-1">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpandedGuide(isOpen ? null : guide.id)}
                    className="min-h-[40px] w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between hover:border-teal-500 transition-colors"
                  >
                    <span>{isOpen ? 'Hide Action Steps' : 'View Action Steps'}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isOpen && (
                    <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {guide.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 leading-relaxed">
                          <Droplets className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
