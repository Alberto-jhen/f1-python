import { useCallback, useState } from 'react';
import { publishRating } from '@/service/apiService.ts';

export function usePublishRating() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  const publish = async (profileId, ratingData) => {
    reset();
    setLoading(true);

    try {
      const result = await publishRating(profileId, ratingData);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { publish, loading, error, data, reset };
}
