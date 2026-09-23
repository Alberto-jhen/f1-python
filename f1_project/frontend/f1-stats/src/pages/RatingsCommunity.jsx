import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, MessageSquare, TrendingUp } from 'lucide-react';

import { RaceSelector } from '@/components/ratings/RaceSelector';
import { RatingCard } from '@/components/ratings/RatingCard';
import { useLikeRating } from '@/hooks/useLikeRating';
import { useProfile } from '@/hooks/useProfile';
import { useRacesBySeason } from '@/hooks/useRacesBySeason';
import { useRatings } from '@/hooks/useRatings';

export function RatingsCommunity() {
  const { profile, loading: profileLoading } = useProfile();
  const { races, loading: racesLoading, error: racesError } = useRacesBySeason(2026);
  const [selectedRace, setSelectedRace] = useState('');
  const [sortBy, setSortBy] = useState('likes');
  const { toggleLike, loading: likeLoading } = useLikeRating();

  const raceOptions = races.map((race) => ({ value: race.id, label: race.name }));
  const currentRaceId = selectedRace || raceOptions[0]?.value || '';
  const currentProfileId = profile?.id || undefined;

  const { ratings, setRatings, loading, error } = useRatings({
    raceId: currentRaceId,
    sortBy,
    currentProfileId,
  });

  const handleToggleLike = async (ratingId, isLiked) => {
    if (!currentProfileId) return;
    try {
      const updated = await toggleLike(currentProfileId, ratingId, isLiked);
      setRatings((prev) =>
        prev.map((r) =>
          r.id === ratingId
            ? {
                ...r,
                likes: updated?.likes ?? r.likes,
                liked_by_me: updated?.liked_by_me ?? !isLiked,
              }
            : r
        )
      );
    } catch (e) {
      console.error('Error al cambiar el like:', e);
    }
  };

  const isLoading = profileLoading || racesLoading || loading;

  return (
    <div className='flex flex-col p-6 md:p-12 mb-10 gap-8 relative min-h-screen'>
      <div className='absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none -z-10' />

      <div className='flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/80 pb-6 gap-4'>
        <div className='border-l-4 border-red-600 pl-4'>
          <div className='flex items-center gap-3 mb-2'>
            <span className='px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300'>
              Comunidad
            </span>
          </div>
          <h1 className='text-4xl font-black uppercase tracking-tighter text-white italic'>
            Opiniones de la <span className='text-red-600'>parrilla</span>
          </h1>
          <p className='text-zinc-400 text-sm mt-2 font-medium max-w-xl leading-relaxed'>
            Descubre lo que otros usuarios opinan de cada Gran Premio. Filtra por carrera y únete al debate.
          </p>
        </div>
        <Link
          to='/ratings'
          className='group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-zinc-900/40 px-4 py-2 rounded-lg border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/20'
        >
          <ArrowLeft className='size-4 group-hover:-translate-x-1 transition-transform' />
          Volver a valorar
        </Link>
      </div>

      {racesError && (
        <div className='text-red-500 text-sm'>Error al cargar las carreras.</div>
      )}

      <RaceSelector
        raceOptions={raceOptions}
        value={currentRaceId}
        onChange={setSelectedRace}
        season={2026}
      />

      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={() => setSortBy('likes')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
            sortBy === 'likes'
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <TrendingUp className='size-4' />
          Más gustados
        </button>
        <button
          type='button'
          onClick={() => setSortBy('newest')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${
            sortBy === 'newest'
              ? 'bg-red-600 border-red-600 text-white'
              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          <Clock className='size-4' />
          Más recientes
        </button>
      </div>

      <div className='flex flex-col gap-4'>
        {isLoading && (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-red-500' />
            <span className='ml-3 text-zinc-400 text-sm font-medium'>Cargando valoraciones…</span>
          </div>
        )}

        {!isLoading && error && (
          <div className='text-red-500 text-sm py-8'>
            Error al cargar las valoraciones: {error.message}
          </div>
        )}

        {!isLoading && !error && ratings.length === 0 && (
          <div className='flex flex-col items-center justify-center py-16 text-zinc-500 gap-4 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30'>
            <MessageSquare className='size-12 opacity-30' />
            <p className='text-lg font-black uppercase tracking-widest text-zinc-500'>Sin valoraciones</p>
            <p className='text-sm text-zinc-600 text-center max-w-xs'>
              Sé el primero en compartir tu opinión sobre este Gran Premio.
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          ratings.map((rating) => (
            <RatingCard
              key={rating.id}
              rating={rating}
              currentProfileId={currentProfileId}
              onToggleLike={handleToggleLike}
              likeLoading={likeLoading}
            />
          ))}
      </div>
    </div>
  );
}
