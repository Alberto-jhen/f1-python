import { useState } from 'react';
import { publishRating } from '@/service/apiService';

export function usePublishRating() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const publish = async (profileId, ratingData) => {
    setLoading(true);
    setError(null);
    setData(null);

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

  return { publish, loading, error, data };
}
