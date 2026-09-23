import { useState } from 'react';

import { likeRating, unlikeRating } from '@/service/apiService.ts';

export function useLikeRating() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleLike = async (profileId, ratingId, isLiked) => {
    setLoading(true);
    setError(null);
    try {
      const result = isLiked
        ? await unlikeRating(profileId, ratingId)
        : await likeRating(profileId, ratingId);
      return result;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { toggleLike, loading, error };
}
