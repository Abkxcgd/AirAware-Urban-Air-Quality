import React, { useMemo, useState } from 'react';
import { BarChart3, Clock, Info, TrendingDown, TrendingUp } from 'lucide-react';
import type { AirQualityDataset, AqiScale, HourlyPoint } from '../types/airQuality';
import {
  analyzeForecastWindows,
  EU_AQI_SCALE_TABLE,
  formatDayHourLabel,
  formatHourLabel,
  getAqiCategory,
  US_AQI_SCALE_TABLE,
} from '../utils/aqi';

interface PollutionInsightsProps {
  dataset: AirQualityDataset | null;
  locationName: string;
  aqiScale: AqiScale;
  loading: boolean;
  onRefresh: () => void;
}

type MetricKey = 'aqi' | 'pm2_5' | 'pm10' | 'nitrogen_dioxide' | 'ozone';
type RangeMode = 'forecast_24h' | 'full_window';

const METRICS: Array<{
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  description: string;
}> = [
  {
    key: 'aqi',
    label: 'AQI Index',
    unit: 'AQI',
    color: '#0D9488',
    description: 'Composite air quality index combining key particulate and gaseous pollutants.',
  },
  {
    key: 'pm2_5',
    label: 'PM2.5',
    unit: 'µg/m³',
    color: '#059669',
    description: 'Fine inhalable particulate matter (≤ 2.5 µm) linked closely to haze and traffic.',
  },
  {
    key: 'pm10',
    label: 'PM10',
    unit: 'µg/m³',
    color: '#0284C7',
    description: 'Coarse dust, pollen, and road resuspension particles (≤ 10 µm).',
  },
  {
    key: 'nitrogen_dioxide',
    label: 'NO₂',
    unit: 'µg/m³',
    color: '#D97706',
    description: 'Combustion gas peaking during morning and evening commuter rush hours.',
  },
  {
    key: 'ozone',
    label: 'O₃',
    unit: 'µg/m³',
    color: '#7C3AED',
    description: 'Photochemical ozone that typically rises with midday sunlight.',
  },
];

export const PollutionInsights: React.FC<PollutionInsightsProps> = ({
  dataset,
  locationName,
  aqiScale,
  loading,
  onRefresh,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('aqi');
  const [rangeMode, setRangeMode] = useState<RangeMode>('forecast_24h');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const forecast = useMemo(() => analyzeForecastWindows(dataset, aqiScale), [dataset, aqiScale]);

  const points: HourlyPoint[] = useMemo(() => {
    if (!dataset) return [];
    if (rangeMode === 'forecast_24h') {
      return forecast.hasForecast ? forecast.forecastPoints : [];
    }
    return [...forecast.pastPoints, ...forecast.forecastPoints];
  }, [dataset, forecast, rangeMode]);

  const metricMeta = METRICS.find((m) => m.key === selectedMetric) || METRICS[0];

  const seriesValues = useMemo(() => {
    return points.map((pt) => {
      if (selectedMetric === 'aqi') {
        return aqiScale === 'european_aqi' ? pt.european_aqi : pt.us_aqi;
      }
      return pt[selectedMetric];
    });
  }, [points, selectedMetric, aqiScale]);

  const validValues = seriesValues.filter((v): v is number => v !== null && Number.isFinite(v));
  const minVal = validValues.length > 0 ? Math.min(...validValues) : 0;
  const maxVal = validValues.length > 0 ? Math.max(...validValues) : 100;
  const avgVal =
    validValues.length > 0
      ? validValues.reduce((sum, v) => sum + v, 0) / validValues.length
      : null;

  // Chart SVG dimensions
  const width = 760;
  const height = 240;
  const padLeft = 42;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const yMin = Math.max(0, Math.floor(minVal * 0.85));
  const yMax = Math.max(yMin + 10, Math.ceil(maxVal * 1.12));

  const coords = points.map((pt, i) => {
    const val = seriesValues[i];
    const x =
      points.length <= 1 ? padLeft + plotW / 2 : padLeft + (i / (points.length - 1)) * plotW;
    const y =
      val !== null
        ? padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH
        : null;
    return { x, y, val, time: pt.time };
  });

  const validCoords = coords.filter(
    (c): c is { x: number; y: number; val: number; time: string } => c.y !== null && c.val !== null
  );

  const linePath =
    validCoords.length > 1
      ? validCoords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
      : '';

  const areaPath =
    validCoords.length > 1
      ? `${linePath} L ${validCoords[validCoords.length - 1].x.toFixed(1)} ${(
          padTop + plotH
        ).toFixed(1)} L ${validCoords[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const inspectedIdx =
    activeIndex !== null && activeIndex >= 0 && activeIndex < coords.length
      ? activeIndex
      : validCoords.length > 0
      ? coords.findIndex((c) => c.val !== null)
      : null;
  const inspected = inspectedIdx !== null && inspectedIdx >= 0 ? coords[inspectedIdx] : null;

  const scaleTable = aqiScale === 'european_aqi' ? EU_AQI_SCALE_TABLE : US_AQI_SCALE_TABLE;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Pollution Insights &amp; Hourly Trends
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Hourly model timeline for {locationName} · Hover or tap data points to inspect exact values.
            </p>
          </div>

          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 self-start">
            <button
              type="button"
              onClick={() => {
                setRangeMode('forecast_24h');
                setActiveIndex(null);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                rangeMode === 'forecast_24h'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Next 24h Forecast
            </button>
            <button
              type="button"
              onClick={() => {
                setRangeMode('full_window');
                setActiveIndex(null);
              }}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                rangeMode === 'full_window'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Past 12h + Next 24h
            </button>
          </div>
        </div>

        {/* Metric selector tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          {METRICS.map((m) => {
            const active = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMetric(m.key)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap border ${
                  active
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {m.key === 'aqi' ? (aqiScale === 'european_aqi' ? 'EU EAQI' : 'US AQI') : m.label}
              </button>
            );
          })}
        </div>

        {/* Chart Area */}
        <div className="mt-6">
          {loading && !dataset ? (
            <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ) : rangeMode === 'forecast_24h' && !forecast.hasForecast ? (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white mt-3">
                24-Hour Forecast Unavailable
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Open-Meteo did not return enough future hourly forecast points for this location.
                Try refreshing or switching to another city.
              </p>
              <button
                type="button"
                onClick={onRefresh}
                className="mt-4 min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
              >
                Refresh Forecast
              </button>
            </div>
          ) : validCoords.length < 2 ? (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center text-sm text-slate-500 dark:text-slate-400">
              No hourly {metricMeta.label} readings were returned for this time range.
            </div>
          ) : (
            <div>
              {/* Inspected Data Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {inspected?.val !== null && inspected?.val !== undefined
                      ? selectedMetric === 'aqi'
                        ? Math.round(inspected.val)
                        : inspected.val.toFixed(1)
                      : '—'}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {selectedMetric === 'aqi'
                      ? aqiScale === 'european_aqi'
                        ? 'EU EAQI'
                        : 'US AQI'
                      : metricMeta.unit}
                  </span>
                  {inspected?.time && (
                    <>
                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                        ·
                      </span>
                      <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 tabular-nums">
                        {formatDayHourLabel(inspected.time)}
                      </span>
                      {selectedMetric === 'aqi' && inspected.val !== null && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {getAqiCategory(inspected.val, aqiScale).label}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                  <span>Min: {minVal.toFixed(selectedMetric === 'aqi' ? 0 : 1)}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Avg: {avgVal !== null ? avgVal.toFixed(selectedMetric === 'aqi' ? 0 : 1) : '—'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Max: {maxVal.toFixed(selectedMetric === 'aqi' ? 0 : 1)}</span>
                </div>
              </div>

              {/* Responsive SVG Line + Area Chart */}
              <div className="w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${width} ${height}`}
                  className="w-full h-auto select-none touch-pan-y"
                  role="img"
                  aria-label={`Hourly ${metricMeta.label} chart`}
                >
                  <defs>
                    <linearGradient id="airaware-chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={metricMeta.color} stopOpacity="0.28" />
                      <stop offset="100%" stopColor={metricMeta.color} stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                    const y = padTop + plotH * (1 - t);
                    const tickVal = yMin + (yMax - yMin) * t;
                    return (
                      <g key={t}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={width - padRight}
                          y2={y}
                          className="stroke-slate-200 dark:stroke-slate-800"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                        >
                          {Math.round(tickVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area & Line */}
                  {areaPath && <path d={areaPath} fill="url(#airaware-chart-grad)" />}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke={metricMeta.color}
                      strokeWidth="2.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* X-axis tick labels */}
                  {coords.map((c, idx) => {
                    const step = Math.max(1, Math.floor(coords.length / 6));
                    if (idx % step !== 0 && idx !== coords.length - 1) return null;
                    return (
                      <text
                        key={c.time}
                        x={c.x}
                        y={height - 10}
                        textAnchor="middle"
                        className="fill-slate-500 dark:fill-slate-400 text-[10px] font-mono"
                      >
                        {formatHourLabel(c.time)}
                      </text>
                    );
                  })}

                  {/* Active inspection marker */}
                  {inspected && inspected.y !== null && (
                    <g>
                      <line
                        x1={inspected.x}
                        y1={padTop}
                        x2={inspected.x}
                        y2={padTop + plotH}
                        stroke={metricMeta.color}
                        strokeWidth="1.25"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={inspected.x}
                        cy={inspected.y}
                        r="5.5"
                        fill={metricMeta.color}
                        className="stroke-white dark:stroke-slate-900"
                        strokeWidth="2.5"
                      />
                    </g>
                  )}

                  {/* Invisible interactive hover/tap columns */}
                  {coords.map((c, idx) => {
                    const sliceW = plotW / Math.max(1, coords.length);
                    return (
                      <rect
                        key={c.time}
                        x={c.x - sliceW / 2}
                        y={padTop}
                        width={Math.max(8, sliceW)}
                        height={plotH}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => setActiveIndex(idx)}
                      />
                    );
                  })}
                </svg>
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {metricMeta.description}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Automated Trend Explanation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <TrendingDown className="w-4 h-4 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Cleanest Window</h2>
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {forecast.lowestHour ? forecast.lowestHour.label : 'Unavailable'}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
            {forecast.lowestHour
              ? `Lowest projected index at ${forecast.lowestHour.aqi} ${
                  aqiScale === 'european_aqi' ? 'EU EAQI' : 'US AQI'
                }`
              : 'Forecast points needed to compute minimum.'}
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-4 h-4 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider">Projected Peak</h2>
          </div>
          <p className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
            {forecast.peakHour ? forecast.peakHour.label : 'Unavailable'}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
            {forecast.peakHour
              ? `Highest projected index at ${forecast.peakHour.aqi} ${
                  aqiScale === 'european_aqi' ? 'EU EAQI' : 'US AQI'
                }`
              : 'Forecast points needed to compute peak.'}
          </p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Info className="w-4 h-4 shrink-0" />
            <h2 className="text-xs font-bold uppercase tracking-wider">24h Trend Summary</h2>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">
            {forecast.trendSummary}
          </p>
        </div>
      </section>

      {/* Documented AQI Scale Table */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
          {aqiScale === 'european_aqi' ? 'European EAQI Reference Scale' : 'US EPA AQI Reference Scale'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Transparent thresholds used across AirAware ratings, alerts, and daily forecasts.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scaleTable.map((row) => (
            <div
              key={row.range}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start gap-3"
            >
              <span
                className="w-3 h-3 rounded-sm mt-1 shrink-0"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                    {row.range}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {row.label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {row.meaning}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
