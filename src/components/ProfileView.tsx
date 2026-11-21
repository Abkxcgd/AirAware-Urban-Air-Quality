import React from 'react';
import {
  BookOpen,
  Check,
  Compass,
  MapPin,
  Moon,
  RotateCcw,
  Shield,
  Sun,
  Trash2,
} from 'lucide-react';
import type {
  AqiScale,
  CommunityTrackerState,
  SavedLocation,
  SensitivityProfile,
} from '../types/airQuality';
import { COMMUNITY_ACTIONS } from '../data/guides';
import { SENSITIVITY_PROFILES } from '../utils/aqi';

interface ProfileViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  aqiScale: AqiScale;
  onChangeScale: (scale: AqiScale) => void;
  sensitivityProfile: SensitivityProfile;
  onChangeSensitivity: (profile: SensitivityProfile) => void;
  currentLocation: SavedLocation;
  savedLocations: SavedLocation[];
  onSelectLocation: (loc: SavedLocation) => void;
  onRemoveSavedLocation: (id: string) => void;
  onOpenLocationPicker: () => void;
  onOpenScaleModal: () => void;
  onOpenOnboarding: () => void;
  trackerState: CommunityTrackerState;
  onResetTracker: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  darkMode,
  onToggleDarkMode,
  aqiScale,
  onChangeScale,
  sensitivityProfile,
  onChangeSensitivity,
  currentLocation,
  savedLocations,
  onSelectLocation,
  onRemoveSavedLocation,
  onOpenLocationPicker,
  onOpenScaleModal,
  onOpenOnboarding,
  trackerState,
  onResetTracker,
}) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = (trackerState.dailyLogs[todayKey] || []).length;
  const activeDaysCount = Object.values(trackerState.dailyLogs).filter((arr) => arr.length > 0).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Preferences &amp; Saved Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          All preferences, saved cities, and daily clean-air progress are stored locally on your device.
        </p>

        {/* Appearance & Scale */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Appearance Theme
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {darkMode ? 'Dark mode enabled' : 'Light mode enabled'}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 inline-flex items-center gap-2 hover:border-teal-500 transition-colors shrink-0"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Default AQI Scale
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {aqiScale === 'european_aqi' ? 'European EAQI (0–100+)' : 'US EPA AQI (0–500)'}
              </p>
            </div>
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => onChangeScale('us_aqi')}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  aqiScale === 'us_aqi'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                US
              </button>
              <button
                type="button"
                onClick={() => onChangeScale('european_aqi')}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  aqiScale === 'european_aqi'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                EU
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sensitivity Profile */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            Health Sensitivity Profile
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Personalizes Smart Health Advisor alerts, activity plans, and Clean Air Assistant guidance.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SENSITIVITY_PROFILES.map((opt) => {
            const active = sensitivityProfile === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChangeSensitivity(opt.id)}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  active
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 dark:border-teal-500'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {opt.title}
                  </span>
                  {active && <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Saved Locations & Local Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Saved Locations
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenLocationPicker}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Add City
            </button>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {savedLocations.map((loc) => {
              const isActive = loc.id === currentLocation.id;
              return (
                <div
                  key={loc.id}
                  className="flex items-center justify-between px-2 py-1 bg-white dark:bg-slate-900"
                >
                  <button
                    type="button"
                    onClick={() => onSelectLocation(loc)}
                    className="flex-1 min-h-[52px] px-2 py-2 text-left min-w-0"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {loc.name}
                      {isActive ? ' · Active' : ''}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                    </p>
                  </button>
                  {savedLocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveSavedLocation(loc.id)}
                      aria-label={`Remove ${loc.name}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Clean-Air Progress &amp; Resources
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Today&apos;s Actions</span>
                <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {todayCount} / {COMMUNITY_ACTIONS.length}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400">Active Days Logged</span>
                <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {activeDaysCount}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onOpenScaleModal}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>AQI Scale Documentation</span>
            </button>
            <button
              type="button"
              onClick={onOpenOnboarding}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-2 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>View Onboarding Guide</span>
            </button>
            <button
              type="button"
              onClick={onResetTracker}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-800 inline-flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Habit History</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
