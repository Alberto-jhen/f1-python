import { useEffect, useState } from 'react';

import { fetchRatings, fetchUserRatings } from '@/service/ratingsService.ts';

export function useRatings({ raceId, sortBy = 'likes', limit = 10, currentProfileId } = {}) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadRatings = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { sort_by: sortBy, limit };
        if (raceId) params.race_id = raceId;
        if (currentProfileId) params.current_profile_id = currentProfileId;
        const data = await fetchRatings(params, controller.signal);
        if (!ignore) setRatings(data || []);
      } catch (e) {
        if (ignore || e.name === 'AbortError' || controller.signal.aborted) return;
        setError(e);
        console.error('Error fetching ratings:', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadRatings();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [raceId, sortBy, limit, currentProfileId]);

  return { ratings, setRatings, loading, error };
}

export function useUserRatings({
  currentProfileId,
  viewerProfileId = currentProfileId,
  sortBy = 'likes',
  limit = 10,
} = {}) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentProfileId) {
      setRatings([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let ignore = false;

    const loadUserRatings = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { sort_by: sortBy };
        if (limit !== null && limit !== undefined) params.limit = limit;
        if (viewerProfileId) params.current_profile_id = viewerProfileId;
        const data = await fetchUserRatings(currentProfileId, params, controller.signal);
        if (!ignore) setRatings(data || []);
      } catch (e) {
        if (ignore || e.name === 'AbortError' || controller.signal.aborted) return;
        setError(e);
        console.error('Error fetching user ratings:', e);
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadUserRatings();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [currentProfileId, viewerProfileId, sortBy, limit]);

  return { ratings, setRatings, loading, error };
}