import { Activity } from 'lucide-react';

import { ProfileSection } from './ProfileSection';
import { StatBadge } from './StatBadge';

export function RatingStats({ ratings = [], loading = false, error = null }) {
  const driverRatingCount = ratings.filter((rating) => rating.driver_id).length;
  const raceRatingCount = ratings.length - driverRatingCount;
  const averageRating = ratings.length
    ? (
        ratings.reduce((total, rating) => total + Number(rating.rating || 0), 0) / ratings.length
      ).toFixed(1)
    : '—';
  const unavailable = loading || !!error;

  return (
    <ProfileSection title='Actividad' icon={Activity}>
      <div className='grid grid-cols-2 gap-3'>
        <StatBadge value={unavailable ? '—' : ratings.length} label='Valoraciones' />
        <StatBadge value={unavailable ? '—' : averageRating} label='Media' />
      </div>
      <div className='mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm text-zinc-400'>
        <div className='flex justify-between gap-3'>
          <span>De pilotos</span>
          <span className='font-bold text-white'>{unavailable ? '—' : driverRatingCount}</span>
        </div>
        <div className='flex justify-between gap-3'>
          <span>De carreras</span>
          <span className='font-bold text-white'>{unavailable ? '—' : raceRatingCount}</span>
        </div>
      </div>
    </ProfileSection>
  );
}
