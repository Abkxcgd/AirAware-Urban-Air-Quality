import type { AirQualityDataset, HourlyPoint, SavedLocation } from '../types/airQuality';

interface OpenMeteoGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

interface OpenMeteoAirQualityResponse {
  latitude: number;
  longitude: number;
  elevation?: number;
  timezone?: string;
  timezone_abbreviation?: string;
  current?: Record<string, number | string | null | undefined>;
  current_units?: Record<string, string | undefined>;
  hourly?: {
    time?: string[];
    us_aqi?: Array<number | null>;
    european_aqi?: Array<number | null>;
    pm2_5?: Array<number | null>;
    pm10?: Array<number | null>;
    nitrogen_dioxide?: Array<number | null>;
    ozone?: Array<number | null>;
    sulphur_dioxide?: Array<number | null>;
    carbon_monoxide?: Array<number | null>;
  };
  hourly_units?: Record<string, string | undefined>;
  error?: boolean;
  reason?: string;
}

function toNumberOrNull(val: unknown): number | null {
  return typeof val === 'number' && Number.isFinite(val) ? val : null;
}

export const POPULAR_CITIES: SavedLocation[] = [
  {
    id: 'preset-london',
    name: 'London',
    admin1: 'England',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    source: 'preset',
  },
  {
    id: 'preset-new-york',
    name: 'New York',
    admin1: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.006,
    source: 'preset',
  },
  {
    id: 'preset-tokyo',
    name: 'Tokyo',
    admin1: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503,
    source: 'preset',
  },
  {
    id: 'preset-new-delhi',
    name: 'New Delhi',
    admin1: 'Delhi',
    country: 'India',
    latitude: 28.6139,
    longitude: 77.209,
    source: 'preset',
  },
  {
    id: 'preset-singapore',
    name: 'Singapore',
    country: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    source: 'preset',
  },
  {
    id: 'preset-san-francisco',
    name: 'San Francisco',
    admin1: 'California',
    country: 'United States',
    latitude: 37.7749,
    longitude: -122.4194,
    source: 'preset',
  },
];

export async function searchCities(query: string): Promise<SavedLocation[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', trimmed);
    url.searchParams.set('count', '6');
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`City search failed (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as { results?: OpenMeteoGeoResult[] };
    if (!Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item) => ({
      id: `city-${item.id}`,
      name: item.name,
      admin1: item.admin1,
      country: item.country,
      latitude: item.latitude,
      longitude: item.longitude,
      source: 'search' as const,
    }));
  } finally {
    clearTimeout(timeout);
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<SavedLocation> {
  const fallback: SavedLocation = {
    id: `geo-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
    name: 'Current Location',
    country: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
    latitude,
    longitude,
    source: 'geolocation',
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      latitude
    )}&lon=${encodeURIComponent(longitude)}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      address?: {
        city?: string;
        town?: string;
        village?: string;
        municipality?: string;
        state?: string;
        country?: string;
      };
    };

    const city =
      data.address?.city ||
      data.address?.town ||
      data.address?.village ||
      data.address?.municipality;

    if (!city) return fallback;

    return {
      id: `geo-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
      name: city,
      admin1: data.address?.state,
      country: data.address?.country,
      latitude,
      longitude,
      source: 'geolocation',
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number
): Promise<AirQualityDataset> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Invalid geographic coordinates provided.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set(
      'current',
      [
        'us_aqi',
        'european_aqi',
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
        'dust',
        'uv_index',
      ].join(',')
    );
    url.searchParams.set(
      'hourly',
      [
        'pm10',
        'pm2_5',
        'carbon_monoxide',
        'nitrogen_dioxide',
        'sulphur_dioxide',
        'ozone',
        'us_aqi',
        'european_aqi',
      ].join(',')
    );
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('past_days', '1');
    url.searchParams.set('forecast_days', '2');

    const res = await fetch(url.toString(), { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Open-Meteo Air Quality API error (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as OpenMeteoAirQualityResponse;
    if (data.error) {
      throw new Error(data.reason || 'Open-Meteo returned an error for this location.');
    }

    const currentObj = data.current || {};
    const hourlyObj = data.hourly || {};
    const times = Array.isArray(hourlyObj.time) ? hourlyObj.time : [];

    const hourly: HourlyPoint[] = times.map((time, idx) => ({
      time,
      us_aqi: toNumberOrNull(hourlyObj.us_aqi?.[idx]),
      european_aqi: toNumberOrNull(hourlyObj.european_aqi?.[idx]),
      pm2_5: toNumberOrNull(hourlyObj.pm2_5?.[idx]),
      pm10: toNumberOrNull(hourlyObj.pm10?.[idx]),
      nitrogen_dioxide: toNumberOrNull(hourlyObj.nitrogen_dioxide?.[idx]),
      ozone: toNumberOrNull(hourlyObj.ozone?.[idx]),
      sulphur_dioxide: toNumberOrNull(hourlyObj.sulphur_dioxide?.[idx]),
      carbon_monoxide: toNumberOrNull(hourlyObj.carbon_monoxide?.[idx]),
    }));

    const unitsSource = data.current_units || data.hourly_units || {};

    return {
      latitude: data.latitude ?? latitude,
      longitude: data.longitude ?? longitude,
      timezone: data.timezone || 'UTC',
      timezoneAbbreviation: data.timezone_abbreviation || '',
      elevation: toNumberOrNull(data.elevation),
      fetchedAtIso: new Date().toISOString(),
      current: {
        time: typeof currentObj.time === 'string' ? currentObj.time : null,
        us_aqi: toNumberOrNull(currentObj.us_aqi),
        european_aqi: toNumberOrNull(currentObj.european_aqi),
        pm2_5: toNumberOrNull(currentObj.pm2_5),
        pm10: toNumberOrNull(currentObj.pm10),
        nitrogen_dioxide: toNumberOrNull(currentObj.nitrogen_dioxide),
        ozone: toNumberOrNull(currentObj.ozone),
        sulphur_dioxide: toNumberOrNull(currentObj.sulphur_dioxide),
        carbon_monoxide: toNumberOrNull(currentObj.carbon_monoxide),
        dust: toNumberOrNull(currentObj.dust),
        uv_index: toNumberOrNull(currentObj.uv_index),
      },
      hourly,
      units: {
        pm2_5: unitsSource.pm2_5 || 'µg/m³',
        pm10: unitsSource.pm10 || 'µg/m³',
        nitrogen_dioxide: unitsSource.nitrogen_dioxide || 'µg/m³',
        ozone: unitsSource.ozone || 'µg/m³',
        sulphur_dioxide: unitsSource.sulphur_dioxide || 'µg/m³',
        carbon_monoxide: unitsSource.carbon_monoxide || 'µg/m³',
        dust: unitsSource.dust || 'µg/m³',
      },
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request to Open-Meteo timed out. Please check your connection and try again.');
    }
    throw err instanceof Error ? err : new Error('Failed to fetch air quality data.');
  } finally {
    clearTimeout(timeout);
  }
}
