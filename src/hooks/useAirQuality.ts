import { useCallback, useEffect, useRef, useState } from 'react';
import type { AirQualityDataset, SavedLocation } from '../types/airQuality';
import { fetchAirQuality } from '../services/openMeteo';

export function useAirQuality(location: SavedLocation) {
  const [dataset, setDataset] = useState<AirQualityDataset | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (target: SavedLocation) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAirQuality(target.latitude, target.longitude, controller.signal);
      if (!controller.signal.aborted) {
        setDataset(data);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Unable to fetch air quality data.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    load(location);
    return () => {
      abortRef.current?.abort();
    };
  }, [location, load]);

  const refresh = useCallback(() => {
    return load(location);
  }, [load, location]);

  return { dataset, loading, error, refresh };
}
