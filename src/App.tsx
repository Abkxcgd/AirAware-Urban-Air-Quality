import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Bot,
  CalendarClock,
  Home,
  MapPin,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import type {
  AqiScale,
  CommunityTrackerState,
  NavTab,
  SavedLocation,
  SensitivityProfile,
} from './types/airQuality';
import { POPULAR_CITIES } from './services/openMeteo';
import { formatReadableTimestamp, getAqiCategory, getAqiValue } from './utils/aqi';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAirQuality } from './hooks/useAirQuality';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Logo } from './components/Logo';
import { DashboardHome } from './components/DashboardHome';
import { PollutionInsights } from './components/PollutionInsights';
import { DailyPlanView } from './components/DailyPlanView';
import { AssistantView } from './components/AssistantView';
import { ProfileView } from './components/ProfileView';
import { LocationPickerModal } from './components/LocationPickerModal';
import { AqiScaleModal } from './components/AqiScaleModal';
import { OnboardingModal } from './components/OnboardingModal';

const STORAGE_KEYS = {
  DARK_MODE: 'airaware_dark_mode',
  AQI_SCALE: 'airaware_aqi_scale',
  SENSITIVITY: 'airaware_sensitivity',
  LOCATION: 'airaware_location',
  SAVED_LOCATIONS: 'airaware_saved_locations',
  ONBOARDING_DONE: 'airaware_onboarding_done',
  COMMUNITY_TRACKER: 'airaware_community_tracker',
} as const;

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'plan', label: 'Daily Plan', icon: CalendarClock },
  { id: 'assistant', label: 'AI Assistant', icon: Bot },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  const [darkMode, setDarkMode] = useLocalStorage<boolean>(STORAGE_KEYS.DARK_MODE, false);
  const [aqiScale, setAqiScale] = useLocalStorage<AqiScale>(STORAGE_KEYS.AQI_SCALE, 'us_aqi');
  const [sensitivityProfile, setSensitivityProfile] = useLocalStorage<SensitivityProfile>(
    STORAGE_KEYS.SENSITIVITY,
    'standard'
  );
  const [savedLocations, setSavedLocations] = useLocalStorage<SavedLocation[]>(
    STORAGE_KEYS.SAVED_LOCATIONS,
    [POPULAR_CITIES[0], POPULAR_CITIES[1], POPULAR_CITIES[2]]
  );
  const [currentLocation, setCurrentLocation] = useLocalStorage<SavedLocation>(
    STORAGE_KEYS.LOCATION,
    POPULAR_CITIES[0]
  );
  const [onboardingDone, setOnboardingDone] = useLocalStorage<boolean>(
    STORAGE_KEYS.ONBOARDING_DONE,
    false
  );
  const [trackerState, setTrackerState] = useLocalStorage<CommunityTrackerState>(
    STORAGE_KEYS.COMMUNITY_TRACKER,
    { completedIds: [], dailyLogs: {} }
  );

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [scaleModalOpen, setScaleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { dataset, loading, error, refresh } = useAirQuality(currentLocation);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSelectLocation = (loc: SavedLocation) => {
    setCurrentLocation(loc);
    setSavedLocations((prev) => {
      const exists = prev.some((item) => item.id === loc.id);
      if (exists) return prev;
      return [loc, ...prev].slice(0, 8);
    });
  };

  const handleRemoveSavedLocation = (id: string) => {
    setSavedLocations((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length === 0) return prev;
      if (currentLocation.id === id) {
        setCurrentLocation(next[0]);
      }
      return next;
    });
  };

  const handleCompleteOnboarding = () => {
    setOnboardingOpen(false);
    setOnboardingDone(true);
  };

  const handleToggleCommunityAction = (actionId: string) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setTrackerState((prev) => {
      const currentDay = prev.dailyLogs[todayKey] || [];
      const exists = currentDay.includes(actionId);
      const updatedDay = exists
        ? currentDay.filter((id) => id !== actionId)
        : [...currentDay, actionId];
      return {
        ...prev,
        dailyLogs: {
          ...prev.dailyLogs,
          [todayKey]: updatedDay,
        },
      };
    });
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard.`);
    } catch {
      showToast('Copy unavailable in this browser context.');
    }
  };

  const handleShareAqiSummary = async () => {
    if (!dataset) return;
    const val = getAqiValue(dataset.current, aqiScale);
    const cat = getAqiCategory(val, aqiScale);
    const scaleText = aqiScale === 'european_aqi' ? 'EU EAQI' : 'US AQI';
    const summary = `AirAware Report — ${currentLocation.name}${
      currentLocation.country ? `, ${currentLocation.country}` : ''
    }\nAQI: ${val !== null ? Math.round(val) : 'Unavailable'} ${scaleText} (${cat.label})\nPM2.5: ${
      dataset.current.pm2_5 !== null ? `${dataset.current.pm2_5.toFixed(1)} µg/m³` : 'N/A'
    } | PM10: ${
      dataset.current.pm10 !== null ? `${dataset.current.pm10.toFixed(1)} µg/m³` : 'N/A'
    }\nUpdated: ${formatReadableTimestamp(dataset.current.time)}\nGuidance: ${cat.summary}`;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `AirAware AQI: ${currentLocation.name}`,
          text: summary,
        });
        return;
      } catch {
        // Fall through to clipboard copy if user cancels or share fails
      }
    }
    await handleCopyText(summary, 'AQI summary');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-xl focus:bg-teal-600 focus:text-white focus:text-xs focus:font-semibold"
      >
        Skip to main content
      </a>

      {/* Desktop Top Bar (3-zone contract; static on mobile to keep sticky elements <15% of viewport) */}
      <header className="lg:sticky lg:top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            aria-label="Go to AirAware Home"
            className="text-left whitespace-nowrap shrink-0 rounded-xl focus-visible:outline-none"
          >
            <Logo />
          </button>

          {/* Zone 2: Desktop Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-[40px] px-1 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                    active
                      ? 'border-teal-600 text-slate-900 dark:border-teal-400 dark:text-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action + Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={darkMode}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              aria-label={`Change location, currently ${currentLocation.name}`}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="max-w-[110px] sm:max-w-[150px] truncate">{currentLocation.name}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main id="main-content" className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-24 lg:pb-12">
        <ErrorBoundary>
          {!onboardingDone && activeTab === 'home' && (
            <section
              aria-label="Quick onboarding setup"
              className="mb-6 rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight">
                  Welcome to AirAware
                </h1>
                <p className="text-xs sm:text-sm text-teal-50 mt-1 max-w-2xl leading-relaxed">
                  Set your health sensitivity profile and local city in 30 seconds to personalize outdoor exercise windows and clean-air alerts.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-teal-100 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardingOpen(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-white text-teal-900 text-xs font-bold hover:bg-teal-50 transition-colors whitespace-nowrap"
                >
                  Start Quick Setup
                </button>
              </div>
            </section>
          )}

          {activeTab === 'home' && (
            <DashboardHome
              location={currentLocation}
              dataset={dataset}
              loading={loading}
              error={error}
              aqiScale={aqiScale}
              sensitivityProfile={sensitivityProfile}
              onChangeScale={setAqiScale}
              onRefresh={refresh}
              onOpenLocationPicker={() => setLocationModalOpen(true)}
              onOpenScaleModal={() => setScaleModalOpen(true)}
              onShareSummary={handleShareAqiSummary}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}

          {activeTab === 'insights' && (
            <PollutionInsights
              dataset={dataset}
              locationName={currentLocation.name}
              aqiScale={aqiScale}
              loading={loading}
              onRefresh={refresh}
            />
          )}

          {activeTab === 'plan' && (
            <DailyPlanView
              dataset={dataset}
              locationName={currentLocation.name}
              aqiScale={aqiScale}
              sensitivityProfile={sensitivityProfile}
              trackerState={trackerState}
              onToggleAction={handleToggleCommunityAction}
              onCopyText={handleCopyText}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantView
              dataset={dataset}
              location={currentLocation}
              aqiScale={aqiScale}
              sensitivityProfile={sensitivityProfile}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode((d) => !d)}
              aqiScale={aqiScale}
              onChangeScale={setAqiScale}
              sensitivityProfile={sensitivityProfile}
              onChangeSensitivity={setSensitivityProfile}
              currentLocation={currentLocation}
              savedLocations={savedLocations}
              onSelectLocation={handleSelectLocation}
              onRemoveSavedLocation={handleRemoveSavedLocation}
              onOpenLocationPicker={() => setLocationModalOpen(true)}
              onOpenScaleModal={() => setScaleModalOpen(true)}
              onOpenOnboarding={() => setOnboardingOpen(true)}
              trackerState={trackerState}
              onResetTracker={() => {
                setTrackerState({ completedIds: [], dailyLogs: {} });
                showToast('Daily habit history cleared.');
              }}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Desktop Footer Attribution */}
      <footer className="hidden lg:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>AirAware – Urban Air Quality Assistant</span>
          <span>Live environmental data by Open-Meteo Air Quality &amp; Geocoding APIs</span>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] px-1 transition-colors ${
                  active
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[10px] font-semibold tracking-tight mt-1 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-lg whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      <LocationPickerModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={currentLocation}
        savedLocations={savedLocations}
        onSelectLocation={handleSelectLocation}
        onRemoveSavedLocation={handleRemoveSavedLocation}
      />

      <AqiScaleModal
        open={scaleModalOpen}
        onClose={() => setScaleModalOpen(false)}
        initialScale={aqiScale}
      />

      <OnboardingModal
        open={onboardingOpen}
        sensitivityProfile={sensitivityProfile}
        onChangeSensitivity={setSensitivityProfile}
        onSelectLocation={handleSelectLocation}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}
