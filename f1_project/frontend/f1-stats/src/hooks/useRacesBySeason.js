import { useEffect, useState } from 'react';

import { getRacesBySeason } from '@/service/apiService';

export function useRacesBySeason(seasonYear) {
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchRaces = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getRacesBySeason(seasonYear);
        if (!cancelled) {
          if (data) {
            setRaces(data);
          } else {
            setError(new Error('No se pudieron cargar las carreras'));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchRaces();

    return () => {
      cancelled = true;
    };
  }, [seasonYear]);

  return { races, loading, error };
}
