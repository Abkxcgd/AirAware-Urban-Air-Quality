import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function buildOpenMeteoResponse(overrides: { aqi?: number; pm25?: number; pm10?: number } = {}) {
  const aqi = overrides.aqi ?? 46;
  const pm25 = overrides.pm25 ?? 10.2;
  const pm10 = overrides.pm10 ?? 18.4;

  const hourlyTimes = Array.from({ length: 24 }, (_, idx) => {
    const hour = String(idx).padStart(2, '0');
    return `2026-11-21T${hour}:00`;
  });

  return {
    latitude: 51.5,
    longitude: -0.1,
    timezone: 'Europe/London',
    timezone_abbreviation: 'GMT',
    elevation: 16,
    current: {
      time: '2026-11-21T10:00',
      us_aqi: aqi,
      european_aqi: 24,
      pm2_5: pm25,
      pm10,
      carbon_monoxide: 230,
      nitrogen_dioxide: 17.5,
      sulphur_dioxide: 3.1,
      ozone: 54.0,
      dust: 2.2,
      uv_index: 2.0,
    },
    hourly: {
      time: hourlyTimes,
      us_aqi: hourlyTimes.map((_, i) => aqi + (i % 5) * 4),
      european_aqi: hourlyTimes.map((_, i) => 22 + (i % 4) * 3),
      pm2_5: hourlyTimes.map((_, i) => pm25 + i * 0.3),
      pm10: hourlyTimes.map((_, i) => pm10 + i * 0.4),
      nitrogen_dioxide: hourlyTimes.map(() => 18),
      ozone: hourlyTimes.map(() => 52),
      sulphur_dioxide: hourlyTimes.map(() => 3),
      carbon_monoxide: hourlyTimes.map(() => 240),
    },
  };
}

describe('AirAware Application Workflows', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders live AQI data, switches AQI scales, and expands pollutant explanations', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/assistant/status')) {
          return { ok: true, json: async () => ({ aiConfigured: false, provider: 'rule-based' }) };
        }
        return { ok: true, json: async () => buildOpenMeteoResponse({ aqi: 46, pm25: 10.2 }) };
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('46')).toBeInTheDocument();
    });
    expect(screen.getByText('Ideal for Outdoor Exercise')).toBeInTheDocument();
    expect(screen.getByText('10.2')).toBeInTheDocument();

    // Toggle to European EAQI scale
    await user.click(screen.getByRole('button', { name: 'EU EAQI' }));
    expect(screen.getByText('24')).toBeInTheDocument();

    // Expand PM2.5 pollutant card
    const pm25Card = screen.getByRole('button', { name: /PM2\.5/i });
    await user.click(pm25Card);
    expect(pm25Card).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/Microscopic particles from vehicle exhaust/i)).toBeInTheDocument();
  });

  it('displays API error state and recovers when Try Again is clicked', async () => {
    const user = userEvent.setup();
    let shouldFail = true;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/assistant/status')) {
          return { ok: true, json: async () => ({ aiConfigured: false }) };
        }
        if (shouldFail) {
          return { ok: false, status: 503 };
        }
        return { ok: true, json: async () => buildOpenMeteoResponse({ aqi: 38 }) };
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Unable to load live air quality data/i);
    });

    shouldFail = false;
    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    await waitFor(() => {
      expect(screen.getByText('38')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Unable to load live air quality data/i)).not.toBeInTheDocument();
  });

  it('supports city search via Open-Meteo Geocoding and updates dashboard readings', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('geocoding-api.open-meteo.com')) {
          return {
            ok: true,
            json: async () => ({
              results: [
                {
                  id: 1853909,
                  name: 'Osaka',
                  admin1: 'Osaka',
                  country: 'Japan',
                  latitude: 34.6937,
                  longitude: 135.5023,
                },
              ],
            }),
          };
        }
        if (url.includes('latitude=34.6937')) {
          return { ok: true, json: async () => buildOpenMeteoResponse({ aqi: 72, pm25: 19.6 }) };
        }
        return { ok: true, json: async () => buildOpenMeteoResponse({ aqi: 42, pm25: 9.1 }) };
      })
    );

    render(<App />);
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /Change location/i }));
    const searchInput = screen.getByLabelText(/Search City or Neighborhood/i);
    await user.type(searchInput, 'Osaka');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Osaka.*Japan/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Osaka.*Japan/i }));

    await waitFor(() => {
      expect(screen.getByText('72')).toBeInTheDocument();
    });
    expect(screen.getByText('19.6')).toBeInTheDocument();
  });

  it('navigates across Insights, Daily Plan, AI Assistant, and Profile dark mode toggle', async () => {
    const user = userEvent.setup();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/api/assistant/status')) {
          return { ok: true, json: async () => ({ aiConfigured: false, provider: 'rule-based' }) };
        }
        return { ok: true, json: async () => buildOpenMeteoResponse({ aqi: 58, pm25: 16.4 }) };
      })
    );

    render(<App />);
    await waitFor(() => expect(screen.getByText('58')).toBeInTheDocument());

    // 1. Insights tab
    await user.click(screen.getAllByRole('button', { name: 'Insights' })[0]);
    expect(screen.getByRole('heading', { name: /Pollution Insights/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Hourly AQI Index chart/i })).toBeInTheDocument();

    // 2. Daily Plan + Community Tracker persistence
    await user.click(screen.getAllByRole('button', { name: 'Daily Plan' })[0]);
    expect(screen.getByText(/Lower-Pollution Activity Windows/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Community Tracker' }));
    await user.click(screen.getByRole('button', { name: /Took transit, walked, or biked/i }));
    expect(screen.getByText(/20 \/ 100 pts/i)).toBeInTheDocument();

    // 3. AI Assistant (rule-based mode with live data)
    await user.click(screen.getAllByRole('button', { name: 'AI Assistant' })[0]);
    await waitFor(() => {
      expect(screen.getByText(/Rule-Based Clean Air Engine/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'Is it safe to run today?' }));
    expect(screen.getByText(/Running & exercise guidance:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/58 US AQI/i).length).toBeGreaterThanOrEqual(2);

    // 4. Profile & Dark Mode toggle
    await user.click(screen.getAllByRole('button', { name: 'Profile' })[0]);
    await user.click(screen.getByRole('button', { name: 'Dark Mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
