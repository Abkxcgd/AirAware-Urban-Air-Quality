import React from 'react';
import { motion } from 'motion/react';
import type { AqiScale } from '../types/airQuality';
import { getAqiCategory } from '../utils/aqi';

interface AqiGaugeProps {
  value: number | null;
  scale: AqiScale;
  dominantPollutant: { code: string; valueText: string } | null;
  loading?: boolean;
}

export const AqiGauge: React.FC<AqiGaugeProps> = ({
  value,
  scale,
  dominantPollutant,
  loading = false,
}) => {
  const category = getAqiCategory(value, scale);
  const maxVal = scale === 'european_aqi' ? 120 : 300;
  const clamped = value !== null ? Math.max(0, Math.min(value, maxVal)) : 0;
  const ratio = value !== null ? clamped / maxVal : 0;

  // 260-degree arc SVG math
  const size = 224;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 260 / 360;
  const arcLength = circumference * arcFraction;
  const filledLength = arcLength * ratio;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-56 h-52 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
          role="img"
          aria-label={
            value !== null
              ? `Air Quality Index ${Math.round(value)}, ${category.label}`
              : 'Air Quality Index unavailable'
          }
        >
          {/* Background track arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(140 ${size / 2} ${size / 2})`}
            className="stroke-slate-200 dark:stroke-slate-800"
          />

          {/* Animated active AQI arc */}
          {value !== null && !loading && (
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={category.strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              initial={{ strokeDashoffset: arcLength }}
              animate={{ strokeDashoffset: arcLength - filledLength }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              transform={`rotate(140 ${size / 2} ${size / 2})`}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center pt-3 text-center">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-tight">
            {scale === 'european_aqi' ? 'European EAQI' : 'US EPA AQI'}
          </span>

          {loading ? (
            <div className="my-2 h-12 w-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ) : (
            <span className="font-display text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white tabular-nums mt-0.5">
              {value !== null ? Math.round(value) : '—'}
            </span>
          )}

          <span className={`text-sm font-semibold mt-1 px-2 text-center leading-tight ${category.textColorClass}`}>
            {loading ? 'Updating...' : category.shortLabel}
          </span>
        </div>
      </div>

      {/* Clean unboxed metadata row */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-400 -mt-1">
        <span className="font-medium text-slate-800 dark:text-slate-200">{category.label}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{category.rangeText}</span>
        {dominantPollutant && (
          <>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Primary: {dominantPollutant.code} ({dominantPollutant.valueText})
            </span>
          </>
        )}
      </div>
    </div>
  );
};
