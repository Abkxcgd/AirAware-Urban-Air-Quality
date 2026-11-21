import React, { useEffect, useState } from 'react';
import { X, Info } from 'lucide-react';
import type { AqiScale } from '../types/airQuality';
import { EU_AQI_SCALE_TABLE, US_AQI_SCALE_TABLE } from '../utils/aqi';

interface AqiScaleModalProps {
  open: boolean;
  onClose: () => void;
  initialScale: AqiScale;
}

export const AqiScaleModal: React.FC<AqiScaleModalProps> = ({
  open,
  onClose,
  initialScale,
}) => {
  const [tab, setTab] = useState<AqiScale>(initialScale);

  useEffect(() => {
    setTab(initialScale);
  }, [initialScale]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const rows = tab === 'european_aqi' ? EU_AQI_SCALE_TABLE : US_AQI_SCALE_TABLE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aqi-scale-title"
    >
      <div className="w-full sm:max-w-xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="aqi-scale-title"
              className="font-display text-xl font-bold text-slate-900 dark:text-white"
            >
              AQI Scales &amp; Data Methodology
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              How AirAware classifies air pollution and distinguishes live model analysis from forecasts.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AQI scale guide"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scale switcher */}
        <div className="mt-5 inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            aria-pressed={tab === 'us_aqi'}
            onClick={() => setTab('us_aqi')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tab === 'us_aqi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            US EPA AQI (0–500)
          </button>
          <button
            type="button"
            aria-pressed={tab === 'european_aqi'}
            onClick={() => setTab('european_aqi')}
            className={`min-h-[40px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tab === 'european_aqi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            European EAQI (0–100+)
          </button>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          {rows.map((row) => (
            <div key={row.range} className="p-3.5 flex items-start gap-3.5 bg-white dark:bg-slate-900">
              <span
                className="w-3 h-3 rounded-sm mt-1.5 shrink-0"
                style={{ backgroundColor: row.color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-xs font-semibold text-slate-900 dark:text-white tabular-nums">
                    {row.range}
                  </span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
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

        <div className="mt-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-white">Current Readings vs. Forecasts:</strong>{' '}
                Data is retrieved live from the Open-Meteo Air Quality API (CAMS global &amp; European
                atmospheric composition models at ~11–40 km grid resolution).
              </p>
              <p>
                Current values reflect the latest hourly assimilated analysis, while future hours in Insights
                and Daily Plan reflect atmospheric model forecasts rather than local street-level hardware
                sensors. Missing fields are never interpolated or fabricated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
