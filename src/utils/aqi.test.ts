import { describe, expect, it } from 'vitest';
import type { AirQualityDataset, CurrentReadings } from '../types/airQuality';
import {
  analyzeForecastWindows,
  buildHealthAdvisory,
  calculateCompositeUsAqi,
  calculatePollutantSubIndex,
  formatDayHourLabel,
  formatHourLabel,
  formatReadableTimestamp,
  generateRuleBasedReply,
  getAqiCategory,
  getAqiValue,
  getDominantPollutant,
  getNormalizedSeverity,
} from './aqi';

function makeCurrentReadings(overrides: Partial<CurrentReadings> = {}): CurrentReadings {
  return {
    time: '2026-11-21T10:00',
    us_aqi: 42,
    european_aqi: 24,
    pm2_5: 8.5,
    pm10: 18.0,
    nitrogen_dioxide: 16.0,
    ozone: 52.0,
    sulphur_dioxide: 4.0,
    carbon_monoxide: 260.0,
    dust: 3.0,
    uv_index: 2.5,
    ...overrides,
  };
}

function makeDataset(overrides: Partial<AirQualityDataset> = {}): AirQualityDataset {
  return {
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    timezoneAbbreviation: 'GMT',
    elevation: 16,
    fetchedAtIso: '2026-11-21T10:05:00.000Z',
    current: makeCurrentReadings(),
    hourly: [],
    units: {
      pm2_5: 'µg/m³',
      pm10: 'µg/m³',
      nitrogen_dioxide: 'µg/m³',
      ozone: 'µg/m³',
      sulphur_dioxide: 'µg/m³',
      carbon_monoxide: 'µg/m³',
      dust: 'µg/m³',
    },
    ...overrides,
  };
}

describe('EPA Pollutant Sub-Index & Composite AQI Calculations', () => {
  it('calculates PM2.5 sub-index accurately across boundary breakpoints', () => {
    expect(calculatePollutantSubIndex('pm2_5', 0)).toBe(0);
    expect(calculatePollutantSubIndex('pm2_5', 9.0)).toBe(50);
    expect(calculatePollutantSubIndex('pm2_5', 9.1)).toBe(51);
    expect(calculatePollutantSubIndex('pm2_5', 35.4)).toBe(100);
    expect(calculatePollutantSubIndex('pm2_5', 35.5)).toBe(101);
    expect(calculatePollutantSubIndex('pm2_5', 55.4)).toBe(150);
    expect(calculatePollutantSubIndex('pm2_5', 125.4)).toBe(200);
    expect(calculatePollutantSubIndex('pm2_5', 225.4)).toBe(300);
    expect(calculatePollutantSubIndex('pm2_5', 500.4)).toBe(500);
    expect(calculatePollutantSubIndex('pm2_5', 650)).toBe(500);
  });

  it('calculates sub-indices for PM10, O3, NO2, SO2, and CO', () => {
    expect(calculatePollutantSubIndex('pm10', 54)).toBe(50);
    expect(calculatePollutantSubIndex('pm10', 154)).toBe(100);
    expect(calculatePollutantSubIndex('ozone', 100)).toBe(46); // ~50 ppb -> Good
    expect(calculatePollutantSubIndex('ozone', 140)).toBe(100); // ~70 ppb -> Moderate upper
    expect(calculatePollutantSubIndex('nitrogen_dioxide', 100)).toBe(50); // ~53 ppb
    expect(calculatePollutantSubIndex('sulphur_dioxide', 90)).toBe(49); // ~34 ppb
    expect(calculatePollutantSubIndex('carbon_monoxide', 5000)).toBe(49); // ~4.3 ppm
    expect(calculatePollutantSubIndex('carbon_monoxide', 5050)).toBe(50); // ~4.4 ppm (Good upper)
    expect(calculatePollutantSubIndex('carbon_monoxide', 10700)).toBe(99); // ~9.3 ppm
  });

  it('returns null for missing, negative, or non-finite pollutant values', () => {
    expect(calculatePollutantSubIndex('pm2_5', null)).toBeNull();
    expect(calculatePollutantSubIndex('pm2_5', undefined)).toBeNull();
    expect(calculatePollutantSubIndex('pm10', -5)).toBeNull();
    expect(calculatePollutantSubIndex('ozone', Number.NaN)).toBeNull();
    expect(calculatePollutantSubIndex('carbon_monoxide', Number.POSITIVE_INFINITY)).toBeNull();
  });

  it('computes composite US AQI as the maximum sub-index across available pollutants', () => {
    const composite = calculateCompositeUsAqi({
      pm2_5: 8.0, // ~44
      pm10: 154, // 100 (dominant)
      nitrogen_dioxide: 40, // ~20
      ozone: 80, // ~37
      sulphur_dioxide: 20, // ~7
      carbon_monoxide: 500, // ~5
    });
    expect(composite).toBe(100);
    expect(calculateCompositeUsAqi({})).toBeNull();
  });
});

describe('AQI Classification & Boundary Conditions', () => {
  it('classifies all 6 US EPA AQI categories at exact boundaries', () => {
    expect(getAqiCategory(0, 'us_aqi')).toMatchObject({ level: 1, label: 'Good' });
    expect(getAqiCategory(50, 'us_aqi')).toMatchObject({ level: 1, label: 'Good' });
    expect(getAqiCategory(51, 'us_aqi')).toMatchObject({ level: 2, label: 'Moderate' });
    expect(getAqiCategory(100, 'us_aqi')).toMatchObject({ level: 2, label: 'Moderate' });
    expect(getAqiCategory(101, 'us_aqi')).toMatchObject({
      level: 3,
      label: 'Unhealthy for Sensitive Groups',
    });
    expect(getAqiCategory(150, 'us_aqi')).toMatchObject({
      level: 3,
      label: 'Unhealthy for Sensitive Groups',
    });
    expect(getAqiCategory(151, 'us_aqi')).toMatchObject({ level: 4, label: 'Unhealthy' });
    expect(getAqiCategory(200, 'us_aqi')).toMatchObject({ level: 4, label: 'Unhealthy' });
    expect(getAqiCategory(201, 'us_aqi')).toMatchObject({ level: 5, label: 'Very Unhealthy' });
    expect(getAqiCategory(300, 'us_aqi')).toMatchObject({ level: 5, label: 'Very Unhealthy' });
    expect(getAqiCategory(301, 'us_aqi')).toMatchObject({ level: 6, label: 'Hazardous' });
    expect(getAqiCategory(480, 'us_aqi')).toMatchObject({ level: 6, label: 'Hazardous' });
  });

  it('classifies all 6 European EAQI categories at exact boundaries', () => {
    expect(getAqiCategory(20, 'european_aqi')).toMatchObject({ level: 1, label: 'Good' });
    expect(getAqiCategory(21, 'european_aqi')).toMatchObject({ level: 2, label: 'Fair' });
    expect(getAqiCategory(40, 'european_aqi')).toMatchObject({ level: 2, label: 'Fair' });
    expect(getAqiCategory(41, 'european_aqi')).toMatchObject({ level: 3, label: 'Moderate' });
    expect(getAqiCategory(60, 'european_aqi')).toMatchObject({ level: 3, label: 'Moderate' });
    expect(getAqiCategory(61, 'european_aqi')).toMatchObject({ level: 4, label: 'Poor' });
    expect(getAqiCategory(80, 'european_aqi')).toMatchObject({ level: 4, label: 'Poor' });
    expect(getAqiCategory(81, 'european_aqi')).toMatchObject({ level: 5, label: 'Very Poor' });
    expect(getAqiCategory(100, 'european_aqi')).toMatchObject({ level: 5, label: 'Very Poor' });
    expect(getAqiCategory(101, 'european_aqi')).toMatchObject({
      level: 6,
      label: 'Extremely Poor',
    });
  });

  it('handles missing, negative, and NaN AQI values safely', () => {
    expect(getAqiCategory(null, 'us_aqi').label).toBe('Data Unavailable');
    expect(getAqiCategory(-10, 'us_aqi').label).toBe('Data Unavailable');
    expect(getAqiCategory(Number.NaN, 'european_aqi').label).toBe('Data Unavailable');

    const badReadings = makeCurrentReadings({ us_aqi: -1, european_aqi: Number.NaN });
    expect(getAqiValue(badReadings, 'us_aqi')).toBeNull();
    expect(getAqiValue(badReadings, 'european_aqi')).toBeNull();
    expect(getNormalizedSeverity(badReadings, 'us_aqi')).toBe(1);
  });
});

describe('Dominant Pollutant & Smart Health Advisor', () => {
  it('identifies the dominant pollutant normalized to WHO benchmarks', () => {
    const pm25Lead = makeCurrentReadings({ pm2_5: 45, pm10: 50, nitrogen_dioxide: 20, ozone: 60 });
    expect(getDominantPollutant(pm25Lead)).toEqual({
      name: 'Fine Particulate Matter',
      code: 'PM2.5',
      valueText: '45.0 µg/m³',
    });

    const no2Lead = makeCurrentReadings({ pm2_5: 5, pm10: 10, nitrogen_dioxide: 90, ozone: 30 });
    expect(getDominantPollutant(no2Lead)).toEqual({
      name: 'Nitrogen Dioxide',
      code: 'NO₂',
      valueText: '90.0 µg/m³',
    });

    const allNull = makeCurrentReadings({
      pm2_5: null,
      pm10: null,
      nitrogen_dioxide: null,
      ozone: null,
      sulphur_dioxide: null,
    });
    expect(getDominantPollutant(allNull)).toBeNull();
  });

  it('tailors Smart Health Advisor guidance by severity and user sensitivity profile', () => {
    const clean = makeCurrentReadings({ us_aqi: 28 });
    expect(buildHealthAdvisory(clean, 'us_aqi', 'athlete').exerciseVerdict).toBe(
      'Ideal for Outdoor Exercise'
    );
    expect(buildHealthAdvisory(clean, 'us_aqi', 'athlete').ventilationStatus).toBe('open');

    const sensitiveRisk = makeCurrentReadings({ us_aqi: 125 });
    expect(buildHealthAdvisory(sensitiveRisk, 'us_aqi', 'sensitive').exerciseVerdict).toBe(
      'Move Exercise Indoors'
    );
    expect(buildHealthAdvisory(sensitiveRisk, 'us_aqi', 'standard').exerciseVerdict).toBe(
      'Reduce High-Intensity Duration'
    );

    const unhealthy = makeCurrentReadings({ us_aqi: 185 });
    expect(buildHealthAdvisory(unhealthy, 'us_aqi', 'standard').ventilationStatus).toBe(
      'keep_closed'
    );

    const hazardous = makeCurrentReadings({ us_aqi: 340 });
    expect(buildHealthAdvisory(hazardous, 'us_aqi', 'children_elderly').exerciseVerdict).toContain(
      'Stay Indoors'
    );

    const unavailable = makeCurrentReadings({ us_aqi: null });
    expect(buildHealthAdvisory(unavailable, 'us_aqi', 'standard').exerciseVerdict).toBe(
      'Check Local Conditions'
    );
  });
});

describe('Hourly Forecast Window Analysis', () => {
  it('reports unavailable forecast when dataset is null or has fewer than 3 valid points', () => {
    expect(analyzeForecastWindows(null, 'us_aqi').hasForecast).toBe(false);

    const sparse = makeDataset({
      hourly: [
        {
          time: '2026-11-21T10:00',
          us_aqi: 40,
          european_aqi: 20,
          pm2_5: 8,
          pm10: 15,
          nitrogen_dioxide: 12,
          ozone: 40,
          sulphur_dioxide: 3,
          carbon_monoxide: 200,
        },
        {
          time: '2026-11-21T11:00',
          us_aqi: null,
          european_aqi: null,
          pm2_5: null,
          pm10: null,
          nitrogen_dioxide: null,
          ozone: null,
          sulphur_dioxide: null,
          carbon_monoxide: null,
        },
      ],
    });
    expect(analyzeForecastWindows(sparse, 'us_aqi').hasForecast).toBe(false);
  });

  it('identifies lowest hour, peak hour, best 3h windows, and trend direction', () => {
    const hourly = Array.from({ length: 12 }, (_, idx) => {
      const hour = String(10 + idx).padStart(2, '0');
      const aqi = idx < 4 ? 30 + idx * 2 : 95 + idx * 4;
      return {
        time: `2026-11-21T${hour}:00`,
        us_aqi: aqi,
        european_aqi: Math.round(aqi * 0.6),
        pm2_5: 10 + idx,
        pm10: 20 + idx,
        nitrogen_dioxide: 15,
        ozone: 45,
        sulphur_dioxide: 4,
        carbon_monoxide: 250,
      };
    });

    const result = analyzeForecastWindows(makeDataset({ hourly }), 'us_aqi');
    expect(result.hasForecast).toBe(true);
    expect(result.lowestHour).toEqual({ label: '10:00 AM', aqi: 30 });
    expect(result.peakHour).toEqual({ label: '9:00 PM', aqi: 139 });
    expect(result.bestWindows.length).toBeGreaterThan(0);
    expect(result.bestWindows[0].avgAqi).toBeLessThanOrEqual(40);
    expect(result.trendSummary).toContain('trending higher in pollution');
  });

  it('omits outdoor activity windows when all forecasted hours are unhealthy', () => {
    const hourly = Array.from({ length: 8 }, (_, idx) => ({
      time: `2026-11-21T${String(10 + idx).padStart(2, '0')}:00`,
      us_aqi: 190 + idx * 5,
      european_aqi: 95,
      pm2_5: 120,
      pm10: 180,
      nitrogen_dioxide: 80,
      ozone: 110,
      sulphur_dioxide: 20,
      carbon_monoxide: 900,
    }));

    const result = analyzeForecastWindows(makeDataset({ hourly }), 'us_aqi');
    expect(result.hasForecast).toBe(true);
    expect(result.bestWindows).toEqual([]);
  });
});

describe('Rule-Based Clean Air Assistant & Time Formatters', () => {
  it('provides accurate context-aware replies for common air quality questions', () => {
    const dataset = makeDataset({ current: makeCurrentReadings({ us_aqi: 68, pm2_5: 21.4 }) });

    const pmReply = generateRuleBasedReply('What does PM2.5 mean?', dataset, 'London', 'us_aqi', 'standard');
    expect(pmReply).toContain('21.4 µg/m³');
    expect(pmReply).toContain('2.5 micrometers');

    const runReply = generateRuleBasedReply('Is it safe to run today?', dataset, 'London', 'us_aqi', 'athlete');
    expect(runReply).toContain('68 US AQI');
    expect(runReply).toContain('not a medical diagnosis');

    const hazardReply = generateRuleBasedReply(
      'What should I do when AQI becomes hazardous?',
      dataset,
      'London',
      'us_aqi',
      'standard'
    );
    expect(hazardReply).toContain('N95 or FFP2');

    const noDataReply = generateRuleBasedReply('Is it safe to run today?', null, 'London', 'us_aqi', 'standard');
    expect(noDataReply).toContain("don't have live air quality readings");
  });

  it('formats timestamps gracefully including malformed inputs', () => {
    expect(formatHourLabel('2026-11-21T00:00')).toBe('12:00 AM');
    expect(formatHourLabel('2026-11-21T15:30')).toBe('3:30 PM');
    expect(formatHourLabel('invalid')).toBe('invalid');
    expect(formatDayHourLabel('2026-11-21T09:00')).toBe('11/21 9:00 AM');
    expect(formatReadableTimestamp(null)).toBe('Unavailable');
    expect(formatReadableTimestamp('not-a-date')).toBe('not-a-date');
  });
});
