import type {
  AirQualityDataset,
  AqiCategoryInfo,
  AqiScale,
  CurrentReadings,
  HourlyPoint,
  SensitivityProfile,
} from '../types/airQuality';

export const US_AQI_SCALE_TABLE: Array<{
  range: string;
  label: string;
  color: string;
  meaning: string;
}> = [
  {
    range: '0 – 50',
    label: 'Good',
    color: '#059669',
    meaning: 'Air quality is satisfactory, and air pollution poses little or no risk.',
  },
  {
    range: '51 – 100',
    label: 'Moderate',
    color: '#D97706',
    meaning:
      'Acceptable air quality; unusually sensitive individuals may experience mild respiratory irritation.',
  },
  {
    range: '101 – 150',
    label: 'Unhealthy for Sensitive Groups',
    color: '#EA580C',
    meaning:
      'People with asthma, heart or lung disease, children, and older adults may experience symptoms.',
  },
  {
    range: '151 – 200',
    label: 'Unhealthy',
    color: '#DC2626',
    meaning:
      'Everyone may begin to experience health effects; sensitive groups face more serious risk.',
  },
  {
    range: '201 – 300',
    label: 'Very Unhealthy',
    color: '#9333EA',
    meaning: 'Health alert: increased risk of respiratory and cardiovascular effects for everyone.',
  },
  {
    range: '301+',
    label: 'Hazardous',
    color: '#881337',
    meaning: 'Emergency conditions; the entire population is likely to be affected.',
  },
];

export const EU_AQI_SCALE_TABLE: Array<{
  range: string;
  label: string;
  color: string;
  meaning: string;
}> = [
  {
    range: '0 – 20',
    label: 'Good',
    color: '#059669',
    meaning: 'Clean urban air; ideal for outdoor exercise and natural home ventilation.',
  },
  {
    range: '21 – 40',
    label: 'Fair',
    color: '#0D9488',
    meaning: 'Generally favorable air quality for daily outdoor activities.',
  },
  {
    range: '41 – 60',
    label: 'Moderate',
    color: '#D97706',
    meaning: 'Sensitive individuals should monitor symptoms during prolonged outdoor exertion.',
  },
  {
    range: '61 – 80',
    label: 'Poor',
    color: '#EA580C',
    meaning: 'Consider reducing intense outdoor exercise, especially near busy roadways.',
  },
  {
    range: '81 – 100',
    label: 'Very Poor',
    color: '#DC2626',
    meaning: 'Avoid strenuous outdoor activity and keep indoor air filtered.',
  },
  {
    range: '101+',
    label: 'Extremely Poor',
    color: '#881337',
    meaning: 'Stay indoors with windows closed and use clean indoor air filtration.',
  },
];

export function getAqiValue(
  readings: Pick<CurrentReadings, 'us_aqi' | 'european_aqi'>,
  scale: AqiScale
): number | null {
  return scale === 'european_aqi' ? readings.european_aqi : readings.us_aqi;
}

export function getAqiCategory(value: number | null, scale: AqiScale): AqiCategoryInfo {
  if (value === null || !Number.isFinite(value)) {
    return {
      level: 1,
      label: 'Data Unavailable',
      shortLabel: 'Unavailable',
      rangeText: '—',
      summary: 'Air quality index data was not returned for this location.',
      strokeColor: '#64748B',
      textColorClass: 'text-slate-600 dark:text-slate-300',
      surfaceTintClass: 'bg-slate-100 dark:bg-slate-800/60',
      borderTintClass: 'border-slate-200 dark:border-slate-700',
    };
  }

  if (scale === 'european_aqi') {
    if (value <= 20) {
      return {
        level: 1,
        label: 'Good',
        shortLabel: 'Good',
        rangeText: '0–20 EAQI',
        summary: 'Clean atmospheric conditions suitable for all outdoor routines.',
        strokeColor: '#059669',
        textColorClass: 'text-emerald-700 dark:text-emerald-400',
        surfaceTintClass: 'bg-emerald-50/80 dark:bg-emerald-950/40',
        borderTintClass: 'border-emerald-200 dark:border-emerald-800/70',
      };
    }
    if (value <= 40) {
      return {
        level: 2,
        label: 'Fair',
        shortLabel: 'Fair',
        rangeText: '21–40 EAQI',
        summary: 'Favorable urban air quality with minimal short-term health concern.',
        strokeColor: '#0D9488',
        textColorClass: 'text-teal-700 dark:text-teal-400',
        surfaceTintClass: 'bg-teal-50/80 dark:bg-teal-950/40',
        borderTintClass: 'border-teal-200 dark:border-teal-800/70',
      };
    }
    if (value <= 60) {
      return {
        level: 3,
        label: 'Moderate',
        shortLabel: 'Moderate',
        rangeText: '41–60 EAQI',
        summary: 'Moderate pollution; sensitive individuals should pace prolonged outdoor exertion.',
        strokeColor: '#D97706',
        textColorClass: 'text-amber-700 dark:text-amber-400',
        surfaceTintClass: 'bg-amber-50/80 dark:bg-amber-950/40',
        borderTintClass: 'border-amber-200 dark:border-amber-800/70',
      };
    }
    if (value <= 80) {
      return {
        level: 4,
        label: 'Poor',
        shortLabel: 'Poor',
        rangeText: '61–80 EAQI',
        summary: 'Elevated pollutant load; shorten vigorous outdoor exercise and commute away from traffic.',
        strokeColor: '#EA580C',
        textColorClass: 'text-orange-700 dark:text-orange-400',
        surfaceTintClass: 'bg-orange-50/80 dark:bg-orange-950/40',
        borderTintClass: 'border-orange-200 dark:border-orange-800/70',
      };
    }
    if (value <= 100) {
      return {
        level: 5,
        label: 'Very Poor',
        shortLabel: 'Very Poor',
        rangeText: '81–100 EAQI',
        summary: 'High pollution risk; move workouts indoors and close street-facing windows.',
        strokeColor: '#DC2626',
        textColorClass: 'text-red-700 dark:text-red-400',
        surfaceTintClass: 'bg-red-50/80 dark:bg-red-950/40',
        borderTintClass: 'border-red-200 dark:border-red-800/70',
      };
    }
    return {
      level: 6,
      label: 'Extremely Poor',
      shortLabel: 'Extreme',
      rangeText: '101+ EAQI',
      summary: 'Severe pollution levels; avoid outdoor exertion and run indoor HEPA filtration.',
      strokeColor: '#881337',
      textColorClass: 'text-rose-800 dark:text-rose-300',
      surfaceTintClass: 'bg-rose-50/80 dark:bg-rose-950/40',
      borderTintClass: 'border-rose-200 dark:border-rose-800/70',
    };
  }

  // US EPA AQI (0-500)
  if (value <= 50) {
    return {
      level: 1,
      label: 'Good',
      shortLabel: 'Good',
      rangeText: '0–50 US AQI',
      summary: 'Air quality is clean and poses little or no health risk for daily activities.',
      strokeColor: '#059669',
      textColorClass: 'text-emerald-700 dark:text-emerald-400',
      surfaceTintClass: 'bg-emerald-50/80 dark:bg-emerald-950/40',
      borderTintClass: 'border-emerald-200 dark:border-emerald-800/70',
    };
  }
  if (value <= 100) {
    return {
      level: 2,
      label: 'Moderate',
      shortLabel: 'Moderate',
      rangeText: '51–100 US AQI',
      summary:
        'Air quality is acceptable overall; people unusually sensitive to fine particles or ozone should take light precautions.',
      strokeColor: '#D97706',
      textColorClass: 'text-amber-700 dark:text-amber-400',
      surfaceTintClass: 'bg-amber-50/80 dark:bg-amber-950/40',
      borderTintClass: 'border-amber-200 dark:border-amber-800/70',
    };
  }
  if (value <= 150) {
    return {
      level: 3,
      label: 'Unhealthy for Sensitive Groups',
      shortLabel: 'Sensitive Risk',
      rangeText: '101–150 US AQI',
      summary:
        'Children, older adults, and people with asthma or cardiovascular conditions may feel effects during outdoor exertion.',
      strokeColor: '#EA580C',
      textColorClass: 'text-orange-700 dark:text-orange-400',
      surfaceTintClass: 'bg-orange-50/80 dark:bg-orange-950/40',
      borderTintClass: 'border-orange-200 dark:border-orange-800/70',
    };
  }
  if (value <= 200) {
    return {
      level: 4,
      label: 'Unhealthy',
      shortLabel: 'Unhealthy',
      rangeText: '151–200 US AQI',
      summary:
        'Everyone may experience respiratory irritation or fatigue outdoors; limit prolonged physical exertion.',
      strokeColor: '#DC2626',
      textColorClass: 'text-red-700 dark:text-red-400',
      surfaceTintClass: 'bg-red-50/80 dark:bg-red-950/40',
      borderTintClass: 'border-red-200 dark:border-red-800/70',
    };
  }
  if (value <= 300) {
    return {
      level: 5,
      label: 'Very Unhealthy',
      shortLabel: 'Very Unhealthy',
      rangeText: '201–300 US AQI',
      summary:
        'Health alert: high risk of airway inflammation across all groups. Move activities indoors and filter indoor air.',
      strokeColor: '#9333EA',
      textColorClass: 'text-purple-700 dark:text-purple-400',
      surfaceTintClass: 'bg-purple-50/80 dark:bg-purple-950/40',
      borderTintClass: 'border-purple-200 dark:border-purple-800/70',
    };
  }
  return {
    level: 6,
    label: 'Hazardous',
    shortLabel: 'Hazardous',
    rangeText: '301+ US AQI',
    summary:
      'Emergency air quality conditions. Remain indoors with sealed windows, run HEPA filtration, and wear N95/FFP2 if travel is unavoidable.',
    strokeColor: '#881337',
    textColorClass: 'text-rose-800 dark:text-rose-300',
    surfaceTintClass: 'bg-rose-50/80 dark:bg-rose-950/40',
    borderTintClass: 'border-rose-200 dark:border-rose-800/70',
  };
}

/**
 * Normalize to a 1..6 severity level regardless of US vs European scale.
 */
export function getNormalizedSeverity(readings: CurrentReadings, scale: AqiScale): 1 | 2 | 3 | 4 | 5 | 6 {
  const val = getAqiValue(readings, scale);
  return getAqiCategory(val, scale).level;
}

export function getDominantPollutant(readings: CurrentReadings): {
  name: string;
  code: string;
  valueText: string;
} | null {
  // Compare relative to WHO 24h/8h guideline benchmarks to surface the primary driver
  const candidates: Array<{ name: string; code: string; value: number | null; benchmark: number; unit: string }> = [
    { name: 'Fine Particulate Matter', code: 'PM2.5', value: readings.pm2_5, benchmark: 15, unit: 'µg/m³' },
    { name: 'Coarse Particles', code: 'PM10', value: readings.pm10, benchmark: 45, unit: 'µg/m³' },
    { name: 'Nitrogen Dioxide', code: 'NO₂', value: readings.nitrogen_dioxide, benchmark: 25, unit: 'µg/m³' },
    { name: 'Ground-Level Ozone', code: 'O₃', value: readings.ozone, benchmark: 100, unit: 'µg/m³' },
    { name: 'Sulphur Dioxide', code: 'SO₂', value: readings.sulphur_dioxide, benchmark: 40, unit: 'µg/m³' },
  ];

  let top: (typeof candidates)[number] | null = null;
  let topRatio = -1;

  for (const c of candidates) {
    if (c.value !== null && Number.isFinite(c.value)) {
      const ratio = c.value / c.benchmark;
      if (ratio > topRatio) {
        topRatio = ratio;
        top = c;
      }
    }
  }

  if (!top || top.value === null) return null;
  return {
    name: top.name,
    code: top.code,
    valueText: `${top.value.toFixed(1)} ${top.unit}`,
  };
}

export interface HealthAdvisory {
  exerciseVerdict: string;
  exerciseDetail: string;
  sensitiveGroupsDetail: string;
  prolongedActivityDetail: string;
  commutingDetail: string;
  ventilationStatus: 'open' | 'brief' | 'keep_closed';
  ventilationDetail: string;
}

export function buildHealthAdvisory(
  readings: CurrentReadings,
  scale: AqiScale,
  profile: SensitivityProfile
): HealthAdvisory {
  const aqi = getAqiValue(readings, scale);
  if (aqi === null) {
    return {
      exerciseVerdict: 'Check Local Conditions',
      exerciseDetail:
        'Live AQI is currently unavailable for this coordinate. Refresh or choose a nearby city before planning intense outdoor exertion.',
      sensitiveGroupsDetail:
        'Sensitive groups should keep rescue inhalers accessible and monitor visible haze or traffic density.',
      prolongedActivityDetail:
        'Avoid prolonged exertion near congested roads when real-time air quality readings are unavailable.',
      commutingDetail:
        'Use main ventilation recirculation mode in heavy traffic and choose low-traffic side streets when walking.',
      ventilationStatus: 'brief',
      ventilationDetail: 'Ventilate briefly during low-traffic hours if outdoor air appears clear.',
    };
  }

  const level = getNormalizedSeverity(readings, scale);
  const dominant = getDominantPollutant(readings);
  const dominantHint = dominant ? ` (${dominant.code} is currently the leading contributor at ${dominant.valueText})` : '';
  const isSensitiveUser = profile === 'sensitive' || profile === 'children_elderly';
  const isAthlete = profile === 'athlete';

  if (level === 1) {
    return {
      exerciseVerdict: 'Ideal for Outdoor Exercise',
      exerciseDetail: isAthlete
        ? `Great breathing conditions for tempo runs, cycling, or endurance intervals${dominantHint}.`
        : `Air quality is clean${dominantHint}. Outdoor walking, jogging, and park activities are safe for everyone.`,
      sensitiveGroupsDetail:
        profile === 'sensitive'
          ? 'Low pollution burden right now, though keeping routine asthma or allergy medication on hand is always wise.'
          : 'No special restrictions needed for children, older adults, or people with respiratory sensitivities.',
      prolongedActivityDetail:
        'Prolonged outdoor work or recreation carries minimal air-pollution risk under current readings.',
      commutingDetail:
        'Walking, cycling, or taking public transit is a comfortable, low-exposure choice today.',
      ventilationStatus: 'open',
      ventilationDetail:
        'Good window for cross-ventilation: open windows on opposite sides for 15–30 minutes to refresh indoor air.',
    };
  }

  if (level === 2) {
    return {
      exerciseVerdict: isSensitiveUser ? 'Light to Moderate Outdoors' : 'Safe for Most Outdoor Exercise',
      exerciseDetail: isSensitiveUser
        ? `Moderate air quality${dominantHint}. Prefer light walks or shorter sessions and pause if you notice coughing or throat tightness.`
        : isAthlete
        ? `Generally safe for training${dominantHint}, though high-ventilation intervals may feel slightly drier near busy roads.`
        : `Outdoor exercise is fine for most people${dominantHint}. Choose parks or residential streets over major highways.`,
      sensitiveGroupsDetail:
        'Individuals with asthma, COPD, or pollen/particle sensitivities should watch for mild symptoms and keep quick-relief inhalers accessible.',
      prolongedActivityDetail: isSensitiveUser
        ? 'Break long outdoor sessions into shorter blocks with indoor rest periods.'
        : 'Prolonged outdoor activity is acceptable; hydrate well and avoid idling traffic corridors.',
      commutingDetail:
        'Choose greenways or side streets when cycling/walking. On busy arterial roads, consider switching vehicle AC to recirculate.',
      ventilationStatus: 'open',
      ventilationDetail:
        'Brief natural ventilation is helpful, especially during lower-traffic hours rather than peak rush hour.',
    };
  }

  if (level === 3) {
    return {
      exerciseVerdict: isSensitiveUser ? 'Move Exercise Indoors' : 'Reduce High-Intensity Duration',
      exerciseDetail: isSensitiveUser
        ? `Current levels pose elevated risk for your profile${dominantHint}. Switch to indoor workouts instead of outdoor cardio.`
        : isAthlete
        ? `Scale back high-intensity outdoor intervals${dominantHint}. Swap long threshold efforts for indoor training or shorter low-zone sessions.`
        : `Moderate-to-high pollution${dominantHint}. Shorten vigorous outdoor workouts and move cardio indoors if breathing feels labored.`,
      sensitiveGroupsDetail:
        'Children, older adults, pregnant individuals, and people with heart or lung disease should limit outdoor exertion and stay indoors when possible.',
      prolongedActivityDetail:
        'Reduce prolonged outdoor stays (over 60 minutes), particularly between midday and evening traffic peaks.',
      commutingDetail:
        'Keep car windows closed with cabin recirculation enabled, take transit where possible, or wear a snug N95/FFP2 respirator along busy streets.',
      ventilationStatus: 'brief',
      ventilationDetail:
        'Limit open-window ventilation to brief 5–10 minute intervals away from traffic, and run a HEPA purifier indoors.',
    };
  }

  if (level === 4) {
    return {
      exerciseVerdict: 'Avoid Outdoor Cardio',
      exerciseDetail: `Air quality is Unhealthy${dominantHint}. Replace outdoor runs and cycling with indoor mobility, strength, or gym workouts.`,
      sensitiveGroupsDetail:
        'Sensitive groups should remain indoors in filtered air, avoid all outdoor physical effort, and follow their clinician-approved action plan if symptoms appear.',
      prolongedActivityDetail:
        'Avoid prolonged outdoor activity for all ages. Deep breathing during exertion draws fine particles deeper into the airways.',
      commutingDetail:
        'Wear a well-fitted N95/KN95/FFP2 mask for outdoor walks or transit waits, keep car vents on recirculate, and minimize roadside waiting time.',
      ventilationStatus: 'keep_closed',
      ventilationDetail:
        'Keep windows and exterior doors closed. Run HEPA air purifiers on medium-high and avoid indoor smoke or frying without exhaust.',
    };
  }

  return {
    exerciseVerdict: 'Stay Indoors — Avoid Outdoor Exertion',
    exerciseDetail: `Severe pollution alert${dominantHint}. All outdoor exercise should be cancelled and moved to an indoor, filtered space.`,
    sensitiveGroupsDetail:
      'High risk for sensitive groups: remain indoors with windows sealed, run air filtration continuously, and seek medical care promptly if breathing difficulty or chest discomfort develops.',
    prolongedActivityDetail:
      'Eliminate non-essential outdoor exposure. Even brief heavy exertion can trigger airway irritation.',
    commutingDetail:
      'Defer non-essential trips. If travel is mandatory, wear a properly sealed N95/FFP2 respirator outdoors and keep vehicle cabin filtration on recirculate.',
    ventilationStatus: 'keep_closed',
    ventilationDetail:
      'Seal window drafts, keep doors closed, and run HEPA filtration continuously. Avoid candles, incense, or unvented gas cooking.',
  };
}

export interface ForecastWindowAnalysis {
  hasForecast: boolean;
  forecastPoints: HourlyPoint[];
  pastPoints: HourlyPoint[];
  bestWindows: Array<{
    startLabel: string;
    endLabel: string;
    avgAqi: number;
    category: AqiCategoryInfo;
    recommendation: string;
  }>;
  peakHour: { label: string; aqi: number } | null;
  lowestHour: { label: string; aqi: number } | null;
  trendSummary: string;
}

export function formatHourLabel(isoTime: string): string {
  const parts = isoTime.split('T');
  if (parts.length < 2) return isoTime;
  const [hStr, mStr] = parts[1].split(':');
  const h = Number(hStr);
  if (!Number.isFinite(h)) return isoTime;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr || '00'} ${period}`;
}

export function formatDayHourLabel(isoTime: string): string {
  const [datePart, timePart] = isoTime.split('T');
  if (!datePart || !timePart) return isoTime;
  const [, month, day] = datePart.split('-');
  return `${month}/${day} ${formatHourLabel(isoTime)}`;
}

export function analyzeForecastWindows(
  dataset: AirQualityDataset | null,
  scale: AqiScale
): ForecastWindowAnalysis {
  if (!dataset || dataset.hourly.length === 0) {
    return {
      hasForecast: false,
      forecastPoints: [],
      pastPoints: [],
      bestWindows: [],
      peakHour: null,
      lowestHour: null,
      trendSummary: 'Hourly forecast data is unavailable for this location.',
    };
  }

  const currentIso = dataset.current.time;
  let splitIdx = dataset.hourly.findIndex((p) => (currentIso ? p.time >= currentIso : false));
  if (splitIdx === -1) {
    splitIdx = Math.max(0, dataset.hourly.length - 24);
  }

  const pastPoints = dataset.hourly.slice(Math.max(0, splitIdx - 12), splitIdx);
  const forecastPoints = dataset.hourly.slice(splitIdx, splitIdx + 24);

  const validForecast = forecastPoints.filter((p) => getAqiValue(p, scale) !== null);
  if (validForecast.length < 3) {
    return {
      hasForecast: false,
      forecastPoints,
      pastPoints,
      bestWindows: [],
      peakHour: null,
      lowestHour: null,
      trendSummary: 'Insufficient future hourly AQI points returned by the forecast feed.',
    };
  }

  let peak: { label: string; aqi: number } | null = null;
  let lowest: { label: string; aqi: number } | null = null;

  for (const pt of validForecast) {
    const val = getAqiValue(pt, scale);
    if (val === null) continue;
    if (!peak || val > peak.aqi) {
      peak = { label: formatHourLabel(pt.time), aqi: Math.round(val) };
    }
    if (!lowest || val < lowest.aqi) {
      lowest = { label: formatHourLabel(pt.time), aqi: Math.round(val) };
    }
  }

  // Evaluate 3-hour rolling windows across the next 24h
  const windows: Array<{
    idx: number;
    startLabel: string;
    endLabel: string;
    avgAqi: number;
    category: AqiCategoryInfo;
  }> = [];

  for (let i = 0; i <= forecastPoints.length - 3; i += 2) {
    const slice = forecastPoints.slice(i, i + 3);
    const vals = slice.map((s) => getAqiValue(s, scale)).filter((v): v is number => v !== null);
    if (vals.length < 2) continue;
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const cat = getAqiCategory(avg, scale);
    windows.push({
      idx: i,
      startLabel: formatHourLabel(slice[0].time),
      endLabel: formatHourLabel(slice[slice.length - 1].time),
      avgAqi: avg,
      category: cat,
    });
  }

  // Sort by lowest AQI and keep up to 3 non-overlapping windows that are actually reasonable (level <= 3)
  const sorted = [...windows].sort((a, b) => a.avgAqi - b.avgAqi);
  const picked: typeof sorted = [];
  for (const w of sorted) {
    if (picked.some((p) => Math.abs(p.idx - w.idx) < 3)) continue;
    if (w.category.level <= 3) {
      picked.push(w);
    }
    if (picked.length >= 3) break;
  }

  const bestWindows = picked
    .sort((a, b) => a.idx - b.idx)
    .map((w) => ({
      startLabel: w.startLabel,
      endLabel: w.endLabel,
      avgAqi: w.avgAqi,
      category: w.category,
      recommendation:
        w.category.level === 1
          ? 'Cleanest forecast window — ideal for running, cycling, or natural ventilation.'
          : w.category.level === 2
          ? 'Lower-pollution window — suitable for moderate outdoor walks or commuting.'
          : 'Least polluted window available, though keep outdoor exertion light and brief.',
    }));

  const firstVal = getAqiValue(validForecast[0], scale);
  const lastVal = getAqiValue(validForecast[validForecast.length - 1], scale);
  let directionText = 'relatively steady';
  if (firstVal !== null && lastVal !== null) {
    const diff = lastVal - firstVal;
    if (diff <= -8) directionText = 'trending cleaner over the next 24 hours';
    else if (diff >= 8) directionText = 'trending higher in pollution over the next 24 hours';
  }

  const trendSummary = `Over the next 24 hours, air quality is ${directionText}${
    lowest ? `, reaching its cleanest point around ${lowest.label} (${lowest.aqi})` : ''
  }${peak ? ` and peaking around ${peak.label} (${peak.aqi})` : ''}.`;

  return {
    hasForecast: true,
    forecastPoints,
    pastPoints,
    bestWindows,
    peakHour: peak,
    lowestHour: lowest,
    trendSummary,
  };
}

export function generateRuleBasedReply(
  question: string,
  dataset: AirQualityDataset | null,
  locationName: string,
  scale: AqiScale,
  profile: SensitivityProfile
): string {
  const q = question.toLowerCase();
  const aqi = dataset ? getAqiValue(dataset.current, scale) : null;
  const scaleLabel = scale === 'european_aqi' ? 'EU EAQI' : 'US AQI';
  const cat = getAqiCategory(aqi, scale);
  const dominant = dataset ? getDominantPollutant(dataset.current) : null;
  const forecast = analyzeForecastWindows(dataset, scale);
  const advisory = dataset ? buildHealthAdvisory(dataset.current, scale, profile) : null;

  if (q.includes('pm2.5') || q.includes('pm 2.5') || q.includes('particulate')) {
    const pm25Val = dataset?.current.pm2_5;
    const pm25Text =
      pm25Val !== null && pm25Val !== undefined
        ? `Right now in ${locationName}, PM2.5 is **${pm25Val.toFixed(1)} µg/m³** (WHO 24-hour guideline is 15 µg/m³).`
        : `PM2.5 data is not currently available for ${locationName}.`;
    return `${pm25Text}\n\n**What PM2.5 means:**\n- PM2.5 refers to airborne fine particles 2.5 micrometers or smaller—about 30× thinner than a human hair.\n- Common urban sources include vehicle exhaust, power plants, construction dust, and wood or biomass smoke.\n- Because these particles are so small, they can travel deep into the lungs and enter the bloodstream, irritating airways over time.\n\n**Practical protection:** When PM2.5 rises above 35 µg/m³, reduce intense outdoor cardio, run a HEPA purifier indoors, and wear a well-fitted N95/FFP2 mask near heavy traffic.`;
  }

  if (q.includes('run') || q.includes('exercise') || q.includes('jog') || q.includes('workout') || q.includes('safe')) {
    if (!dataset || aqi === null || !advisory) {
      return `I don't have live air quality readings loaded for ${locationName} yet. Try refreshing the dashboard first so I can evaluate whether today's AQI supports an outdoor run.`;
    }
    const windowNote =
      forecast.bestWindows.length > 0
        ? `\n\n**Best forecast window:** ${forecast.bestWindows[0].startLabel} – ${forecast.bestWindows[0].endLabel} (avg ${forecast.bestWindows[0].avgAqi} ${scaleLabel}).`
        : forecast.hasForecast
        ? `\n\nNo low-pollution outdoor windows appear in the next 24-hour forecast—indoor exercise is recommended.`
        : '';
    return `In **${locationName}**, current air quality is **${Math.round(aqi)} ${scaleLabel} (${cat.label})**${
      dominant ? `, led by ${dominant.code} (${dominant.valueText})` : ''
    }.\n\n**Running & exercise guidance:** ${advisory.exerciseVerdict}. ${advisory.exerciseDetail}${windowNote}\n\n*Note: This is environmental guidance, not a medical diagnosis.*`;
  }

  if (q.includes('family') || q.includes('smog') || q.includes('child') || q.includes('kids') || q.includes('elderly')) {
    const statusLine =
      aqi !== null
        ? `Current reading in **${locationName}**: **${Math.round(aqi)} ${scaleLabel} (${cat.label})**.`
        : `No live reading loaded for ${locationName} yet.`;
    return `${statusLine}\n\n**How to protect your family during smog:**\n- **Schedule smartly:** Keep children and older adults indoors during peak traffic or afternoon ozone hours.${
      forecast.lowestHour ? ` Today's cleanest forecast hour is around **${forecast.lowestHour.label} (${forecast.lowestHour.aqi} ${scaleLabel})**.` : ''
    }\n- **Seal & filter:** Close street-facing windows during haze episodes and run a true HEPA (H13) purifier in bedrooms.\n- **Cleaner commutes:** Walk away from main roads, use car AC recirculation in traffic, and use properly sized KN95/N95/FFP2 masks for older children and adults when AQI exceeds unhealthy thresholds.\n- **Monitor symptoms:** Watch for coughing, wheezing, or shortness of breath and consult a clinician if symptoms persist.`;
  }

  if (q.includes('indoor') || q.includes('home') || q.includes('ventilation') || q.includes('purifier')) {
    const ventAdvice = advisory
      ? `**Right now in ${locationName} (${Math.round(aqi ?? 0)} ${scaleLabel}):** ${advisory.ventilationDetail}`
      : 'Check current outdoor AQI before opening windows.';
    return `${ventAdvice}\n\n**Top ways to improve indoor air quality:**\n- **Kitchen exhaust:** Always run your range hood (or open a kitchen window if outdoor air is clean) when frying, grilling, or using gas stoves.\n- **HEPA filtration:** Choose a true HEPA purifier sized to your room's CADR rating and replace pre-filters/HEPA cartridges on schedule.\n- **Eliminate indoor smoke:** Avoid indoor tobacco smoke, incense, and scented candles during high-pollution days.\n- **Low-dust cleaning:** Damp-mop hard floors and vacuum with a HEPA-sealed vacuum rather than dry sweeping.`;
  }

  if (q.includes('hazardous') || q.includes('emergency') || q.includes('300') || q.includes('severe')) {
    return `**Action checklist when AQI becomes Hazardous (301+ US AQI / 101+ EU EAQI):**\n1. **Stay indoors:** Cancel all outdoor exercise, school outdoor play, and non-essential travel.\n2. **Create a clean-air room:** Pick one bedroom or living room, close all windows and exterior doors, seal visible gaps with damp towels if smoky, and run a HEPA purifier continuously.\n3. **Protect indoor air:** Avoid vacuuming without a HEPA filter, burning candles, frying food, or running exhaust fans that pull polluted outdoor air inside.\n4. **Mask up if you must go out:** Use a tight-fitting **N95 or FFP2** respirator (cloth and surgical masks do not filter fine PM2.5).\n5. **Watch health signs:** People with asthma, heart disease, or breathing difficulty should follow their doctor's action plan and seek medical help promptly if symptoms worsen.`;
  }

  if (q.includes('commut') || q.includes('travel') || q.includes('walk') || q.includes('bike')) {
    return `**Safer commuting for ${locationName}** (${
      aqi !== null ? `currently ${Math.round(aqi)} ${scaleLabel} · ${cat.label}` : 'live AQI unavailable'
    }):\n- ${advisory ? advisory.commutingDetail : 'Avoid idling traffic corridors whenever possible.'}\n- Parallel side streets one block away from major highways often have substantially lower ultrafine particle and NO₂ concentrations.\n- If driving in stop-and-go traffic, switch cabin airflow to **recirculate** so exhaust fumes aren't pulled directly inside.`;
  }

  // General context-aware fallback summary
  if (dataset && aqi !== null && advisory) {
    return `Here is the current air quality snapshot for **${locationName}**:\n- **Index:** ${Math.round(aqi)} ${scaleLabel} (${cat.label})\n- **Primary pollutant:** ${
      dominant ? `${dominant.code} at ${dominant.valueText}` : 'Mixed urban background'
    }\n- **Activity advice:** ${advisory.exerciseVerdict}. ${advisory.exerciseDetail}\n- **Indoor ventilation:** ${advisory.ventilationDetail}\n\nAsk me specifics like *"Is it safe to run today?"*, *"What does PM2.5 mean?"*, or *"How can I improve indoor air quality?"*`;
  }

  return `I'm your AirAware Clean Air Assistant. Select or refresh a city on the dashboard to load live Open-Meteo readings, and ask me about outdoor exercise safety, PM2.5, smog protection, indoor air quality, or hazardous AQI steps.`;
}

export function formatReadableTimestamp(isoString: string | null): string {
  if (!isoString) return 'Unavailable';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}
