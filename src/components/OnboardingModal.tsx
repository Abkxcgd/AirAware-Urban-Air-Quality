import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, LocateFixed, ShieldCheck, Wind, Loader2 } from 'lucide-react';
import type { SavedLocation, SensitivityProfile } from '../types/airQuality';
import { POPULAR_CITIES, reverseGeocode } from '../services/openMeteo';
import { SENSITIVITY_PROFILES } from '../utils/aqi';
import { Logo } from './Logo';

interface OnboardingModalProps {
  open: boolean;
  sensitivityProfile: SensitivityProfile;
  onChangeSensitivity: (profile: SensitivityProfile) => void;
  onSelectLocation: (loc: SavedLocation) => void;
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  open,
  sensitivityProfile,
  onChangeSensitivity,
  onSelectLocation,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onComplete]);

  if (!open) return null;

  const handleGeolocate = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is unavailable in this browser. Pick a city below instead.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        onSelectLocation(loc);
        setGeoLoading(false);
        onComplete();
      },
      () => {
        setGeoLoading(false);
        setGeoError('Location permission declined. Select a starting city below to begin.');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-heading"
    >
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <Logo />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
              Step {step} of 3
            </span>
          </div>

          {step === 1 && (
            <div className="mt-6">
              <h2
                id="onboarding-heading"
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight"
              >
                Breathe smarter in every neighborhood.
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                AirAware translates live Open-Meteo atmospheric measurements into practical daily
                health guidance, cleaner exercise windows, and sustainable urban habits.
              </p>

              <div className="mt-6 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <Wind className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Transparent Live Readings
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Real PM2.5, PM10, NO₂, and O₃ data with clear US EPA and European EAQI scales.
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Private &amp; Local-First
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Your saved cities, sensitivity profile, and clean-air progress stay on your device.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onComplete}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Skip setup
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6">
              <h2
                id="onboarding-heading"
                className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Tailor your health guidance
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Choose the profile that best matches how you use outdoor air quality data.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SENSITIVITY_PROFILES.map((item) => {
                  const active = sensitivityProfile === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onChangeSensitivity(item.id)}
                      className={`p-4 rounded-2xl border text-left transition-colors ${
                        active
                          ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 dark:border-teal-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        {active && (
                          <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-7 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="min-h-[48px] px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <span>Choose Location</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mt-6">
              <h2
                id="onboarding-heading"
                className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
              >
                Set your starting city
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Detect your current coordinates automatically or start with a city benchmark.
              </p>

              <button
                type="button"
                onClick={handleGeolocate}
                disabled={geoLoading}
                className="mt-5 w-full min-h-[48px] px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                {geoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LocateFixed className="w-4 h-4" />
                )}
                <span>{geoLoading ? 'Requesting GPS...' : 'Allow Location & Load Local AQI'}</span>
              </button>

              {geoError && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
                  {geoError}
                </p>
              )}

              <div className="mt-5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
                  Or start with a city:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        onSelectLocation(city);
                        onComplete();
                      }}
                      className="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-teal-600 dark:hover:border-teal-500 text-left transition-colors"
                    >
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {city.name}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                        {city.country}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onComplete}
                  className="min-h-[44px] px-4 py-2 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:underline"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
