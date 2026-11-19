import React, { useState } from 'react';
import { LocateFixed, MapPin, Search, Trash2, X, Loader2 } from 'lucide-react';
import type { SavedLocation } from '../types/airQuality';
import { POPULAR_CITIES, reverseGeocode, searchCities } from '../services/openMeteo';

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  currentLocation: SavedLocation;
  savedLocations: SavedLocation[];
  onSelectLocation: (loc: SavedLocation) => void;
  onRemoveSavedLocation: (id: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  open,
  onClose,
  currentLocation,
  savedLocations,
  onSelectLocation,
  onRemoveSavedLocation,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SavedLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  if (!open) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchError('Enter at least 2 characters to search for a city.');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const found = await searchCities(trimmed);
      setResults(found);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Unable to search cities right now.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported by this browser. Please search by city name.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const loc = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          onSelectLocation(loc);
          onClose();
        } catch {
          setGeoError('Could not resolve your coordinates. Please try searching manually.');
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. Search for your city below instead.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Location request timed out. Please search for your city manually.');
        } else {
          setGeoError('Unable to determine your position. Search for a city below.');
        }
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 }
    );
  };

  const pick = (loc: SavedLocation) => {
    onSelectLocation(loc);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-title"
    >
      <div className="w-full sm:max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="location-picker-title"
              className="font-display text-xl font-bold text-slate-900 dark:text-white"
            >
              Select Location
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Use GPS coordinates or search any city worldwide via Open-Meteo Geocoding.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close location selector"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Geolocation button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="w-full min-h-[48px] px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            {geoLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LocateFixed className="w-4 h-4" />
            )}
            <span>{geoLoading ? 'Detecting Current Location...' : 'Use My Current Location'}</span>
          </button>
          {geoError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
              {geoError}
            </p>
          )}
        </div>

        {/* City Search Form */}
        <form onSubmit={handleSearch} className="mt-5">
          <label htmlFor="city-search-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Search City or Neighborhood
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="city-search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., Tokyo, London, Chicago, Nairobi..."
                className="w-full min-h-[44px] pl-10 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-600 dark:focus:border-teal-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-60 transition-colors shrink-0 whitespace-nowrap"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
              {searchError}
            </p>
          )}
        </form>

        {/* Search Results */}
        {hasSearched && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Search Results
            </h3>
            {searching ? (
              <div className="py-4 text-xs text-slate-500 dark:text-slate-400">Searching Open-Meteo cities...</div>
            ) : results.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                No matching cities found for &ldquo;{query.trim()}&rdquo;. Try checking the spelling or searching a nearby major city.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {results.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => pick(loc)}
                    className="w-full min-h-[52px] px-4 py-3 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {loc.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {[loc.admin1, loc.country].filter(Boolean).join(', ') || 'Coordinates'}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                      {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Saved Locations */}
        {savedLocations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Saved Locations
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {savedLocations.map((loc) => {
                const isSelected = loc.id === currentLocation.id;
                return (
                  <div
                    key={loc.id}
                    className="flex items-center justify-between bg-white dark:bg-slate-900 px-2 py-1"
                  >
                    <button
                      type="button"
                      onClick={() => pick(loc)}
                      className="flex-1 min-h-[48px] px-2 py-2 text-left flex items-center gap-3 min-w-0"
                    >
                      <MapPin
                        className={`w-4 h-4 shrink-0 ${
                          isSelected
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {loc.name}
                          {isSelected ? ' (Active)' : ''}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </button>
                    {savedLocations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveSavedLocation(loc.id)}
                        aria-label={`Remove ${loc.name}`}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Select Global Cities */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            Quick City Benchmarks
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_CITIES.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => pick(city)}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-left transition-colors ${
                  currentLocation.id === city.id
                    ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 dark:border-teal-500 text-teal-900 dark:text-teal-200'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="block text-xs font-semibold truncate">{city.name}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {city.country}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
