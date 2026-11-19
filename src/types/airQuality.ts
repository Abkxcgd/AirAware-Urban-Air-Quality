export type AqiScale = 'us_aqi' | 'european_aqi';

export type SensitivityProfile =
  | 'standard'
  | 'sensitive'
  | 'children_elderly'
  | 'athlete';

export type NavTab = 'home' | 'insights' | 'plan' | 'assistant' | 'profile';

export interface SavedLocation {
  id: string;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  source: 'geolocation' | 'search' | 'preset';
}

export interface CurrentReadings {
  time: string | null;
  us_aqi: number | null;
  european_aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  nitrogen_dioxide: number | null;
  ozone: number | null;
  sulphur_dioxide: number | null;
  carbon_monoxide: number | null;
  dust: number | null;
  uv_index: number | null;
}

export interface HourlyPoint {
  time: string;
  us_aqi: number | null;
  european_aqi: number | null;
  pm2_5: number | null;
  pm10: number | null;
  nitrogen_dioxide: number | null;
  ozone: number | null;
  sulphur_dioxide: number | null;
  carbon_monoxide: number | null;
}

export interface AirQualityDataset {
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneAbbreviation: string;
  elevation: number | null;
  fetchedAtIso: string;
  current: CurrentReadings;
  hourly: HourlyPoint[];
  units: {
    pm2_5: string;
    pm10: string;
    nitrogen_dioxide: string;
    ozone: string;
    sulphur_dioxide: string;
    carbon_monoxide: string;
    dust: string;
  };
}

export interface AqiCategoryInfo {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  shortLabel: string;
  rangeText: string;
  summary: string;
  strokeColor: string;
  textColorClass: string;
  surfaceTintClass: string;
  borderTintClass: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  engine: 'gemini' | 'rule-based';
}

export interface CommunityTrackerState {
  completedIds: string[];
  dailyLogs: Record<string, string[]>; // YYYY-MM-DD -> action ids
}
