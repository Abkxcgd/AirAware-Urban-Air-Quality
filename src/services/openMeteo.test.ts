import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAirQuality,
  reverseGeocode,
  searchCities,
  validateCoordinates,
} from './openMeteo';

describe('validateCoordinates', () => {
  it('accepts valid latitude and longitude boundary values', () => {
    expect(() => validateCoordinates(0, 0)).not.toThrow();
    expect(() => validateCoordinates(-90, -180)).not.toThrow();
    expect(() => validateCoordinates(90, 180)).not.toThrow();
  });

  it('rejects out-of-range and non-finite coordinates', () => {
    expect(() => validateCoordinates(91, 0)).toThrow('Invalid geographic coordinates');
    expect(() => validateCoordinates(-90.5, 0)).toThrow('Invalid geographic coordinates');
    expect(() => validateCoordinates(0, 181)).toThrow('Invalid geographic coordinates');
    expect(() => validateCoordinates(Number.NaN, 0)).toThrow('Invalid geographic coordinates');
    expect(() => validateCoordinates(51.5, Number.POSITIVE_INFINITY)).toThrow(
      'Invalid geographic coordinates'
    );
  });
});

describe('searchCities', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty array without network call when query is shorter than 2 characters', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    expect(await searchCities(' ')).toEqual([]);
    expect(await searchCities('a')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('parses matching cities from Open-Meteo Geocoding response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 1850147,
            name: 'Tokyo',
            admin1: 'Tokyo',
            country: 'Japan',
            latitude: 35.6895,
            longitude: 139.6917,
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchCities('  Tokyo  ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get('name')).toBe('Tokyo');
    expect(results).toEqual([
      {
        id: 'city-1850147',
        name: 'Tokyo',
        admin1: 'Tokyo',
        country: 'Japan',
        latitude: 35.6895,
        longitude: 139.6917,
        source: 'search',
      },
    ]);
  });

  it('returns empty array when no results match and throws on HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({}) }).mockResolvedValueOnce({
        ok: false,
        status: 503,
      })
    );

    expect(await searchCities('NoSuchCityXYZ')).toEqual([]);
    await expect(searchCities('London')).rejects.toThrow('City search failed (HTTP 503)');
  });
});

describe('reverseGeocode', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('resolves city metadata and falls back to coordinates when reverse geocoding fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            address: { town: 'Greenwich', state: 'England', country: 'United Kingdom' },
          }),
        })
        .mockRejectedValueOnce(new Error('Network down'))
    );

    const resolved = await reverseGeocode(51.48, 0.0);
    expect(resolved.name).toBe('Greenwich');
    expect(resolved.country).toBe('United Kingdom');
    expect(resolved.source).toBe('geolocation');

    const fallback = await reverseGeocode(35.6762, 139.6503);
    expect(fallback.name).toBe('Current Location');
    expect(fallback.country).toContain('35.68°');
  });
});

describe('fetchAirQuality', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses current pollutants, hourly forecast, and preserves null for missing values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: 51.5,
          longitude: -0.1,
          timezone: 'Europe/London',
          timezone_abbreviation: 'GMT',
          elevation: 16,
          current: {
            time: '2026-11-21T10:00',
            us_aqi: 48,
            european_aqi: 22,
            pm2_5: 11.4,
            pm10: 19.8,
            carbon_monoxide: 245,
            nitrogen_dioxide: 18.2,
            sulphur_dioxide: null,
            ozone: 58.1,
            dust: 2.0,
            uv_index: 1.5,
          },
          hourly: {
            time: ['2026-11-21T10:00', '2026-11-21T11:00'],
            us_aqi: [48, 52],
            european_aqi: [22, 24],
            pm2_5: [11.4, 12.1],
            pm10: [19.8, 21.0],
            nitrogen_dioxide: [18.2, 19.0],
            ozone: [58.1, 61.0],
            sulphur_dioxide: [null, 3.2],
            carbon_monoxide: [245, 260],
          },
        }),
      })
    );

    const dataset = await fetchAirQuality(51.5074, -0.1278);
    expect(dataset.current.us_aqi).toBe(48);
    expect(dataset.current.pm2_5).toBe(11.4);
    expect(dataset.current.sulphur_dioxide).toBeNull();
    expect(dataset.hourly).toHaveLength(2);
    expect(dataset.hourly[0].sulphur_dioxide).toBeNull();
    expect(dataset.hourly[1].sulphur_dioxide).toBe(3.2);
  });

  it('throws clear errors on Open-Meteo error payloads, HTTP errors, and network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ error: true, reason: 'Coordinate out of range' }),
        })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockRejectedValueOnce(new Error('Failed to fetch'))
    );

    await expect(fetchAirQuality(51.5, -0.1)).rejects.toThrow('Coordinate out of range');
    await expect(fetchAirQuality(51.5, -0.1)).rejects.toThrow(
      'Open-Meteo Air Quality API error (HTTP 500)'
    );
    await expect(fetchAirQuality(51.5, -0.1)).rejects.toThrow('Failed to fetch');
  });
});
