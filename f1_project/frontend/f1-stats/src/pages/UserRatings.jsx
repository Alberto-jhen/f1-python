import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MessageSquare, TrendingUp } from 'lucide-react';

import { RatingCard } from '@/components/ratings/RatingCard';
import { RatingStats } from '@/components/profile/RatingStats';
import { useLikeRating } from '@/hooks/useLikeRating';
import { useProfile } from '@/hooks/useProfile';
import { useUserRatings } from '@/hooks/useRatings';
import { fetchDriversFullNamesByYear } from '@/service/apiService.ts';

export function UserRatings() {
  const { profileId: paramProfileId } = useParams();
  const { profile: loggedProfile, loading: profileLoading } = useProfile();
  const [sortBy, setSortBy] = useState('newest');
  const { toggleLike, loading: likeLoading } = useLikeRating();

  const currentProfileId = loggedProfile?.id || undefined;
  const targetProfileId = paramProfileId || currentProfileId;

  const { ratings, setRatings, loading, error } = useUserRatings({
    currentProfileId: targetProfileId,
    viewerProfileId: currentProfileId,
    sortBy,
    limit: null,
  });

  // Mapa código de piloto (driver_id) → datos del piloto (parrilla actual).
  // Las valoraciones pueden ser de distintas carreras, así que se usa 'latest'.
  const [driverMap, setDriverMap] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    const loadDrivers = async () => {
      try {
        const data = await fetchDriversFullNamesByYear(
          new Date().getFullYear(),
          'latest',
          'R',
          controller.signal
        );
        if (ignore) return;
        const map = {};
        (data || []).forEach((driver) => {
          if (driver.value) map[driver.value] = driver;
        });
        setDriverMap(map);
      } catch (e) {
        if (ignore || e.name === 'AbortError' || controller.signal.aborted) return;
        console.error('Error cargando pilotos para las valoraciones:', e);
        setDriverMap({});
      }
    };

    loadDrivers();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  const handleDeleteRating = (deletedId) => {
    setRatings((prev) => prev.filter((r) => r.id !== deletedId));
  };

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

  const isLoading = profileLoading || loading;

  const displayedProfile =
    (!paramProfileId || paramProfileId === currentProfileId)
      ? loggedProfile
      : ratings[0]?.profile;

  const displayName =
    displayedProfile?.full_name ||
    displayedProfile?.username ||
    'Usuario';

  return (
    <div className='relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10'>
      <div className='absolute top-0 right-0 -z-10 size-[600px] rounded-full bg-red-900/5 blur-[120px] pointer-events-none' />

      <div className='relative mx-auto flex w-full max-w-[1440px] flex-col gap-8'>
        <header className='flex flex-col items-start justify-between gap-5 border-b border-zinc-800/80 pb-6 md:flex-row md:items-end'>
          <div className='min-w-0 border-l-4 border-red-600 pl-4'>
            <div className='mb-2 flex items-center gap-3'>
              <span className='rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300'>
                Historial de perfil
              </span>
            </div>
            <h1 className='text-3xl font-black uppercase italic tracking-tighter text-white sm:text-4xl'>
              Valoraciones de <span className='text-red-600'>{displayName}</span>
            </h1>
            <p className='mt-2 max-w-2xl text-sm font-medium leading-relaxed text-zinc-400'>
              Consulta todas las reseñas y puntuaciones publicadas en los Grandes Premios.
            </p>
          </div>
          <Link
            to='/profile'
            className='group inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-400 transition-all hover:border-red-900/50 hover:bg-red-950/20 hover:text-white'
          >
            <ArrowLeft className='size-4 transition-transform group-hover:-translate-x-1' />
            Volver al perfil
          </Link>
        </header>

        <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(250px,0.9fr)_minmax(0,2.1fr)] xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,2.15fr)]'>
          <aside className='space-y-5'>
            <RatingStats ratings={ratings} loading={isLoading} error={error} />

            <section className='rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5'>
              <h2 className='text-sm font-bold uppercase tracking-widest text-white'>
                Ordenar valoraciones
              </h2>
              <div
                role='group'
                aria-label='Ordenar valoraciones'
                className='mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1'
              >
                <button
                  type='button'
                  onClick={() => setSortBy('newest')}
                  aria-pressed={sortBy === 'newest'}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-left text-xs font-bold uppercase tracking-widest transition-all ${
                    sortBy === 'newest'
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clock className='size-4' />
                  Más recientes
                </button>
                <button
                  type='button'
                  onClick={() => setSortBy('likes')}
                  aria-pressed={sortBy === 'likes'}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-left text-xs font-bold uppercase tracking-widest transition-all ${
                    sortBy === 'likes'
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className='size-4' />
                  Más gustados
                </button>
              </div>
            </section>
          </aside>

          <section className='min-w-0 space-y-4' aria-labelledby='user-ratings-heading'>
            <div className='px-1'>
              <h2
                id='user-ratings-heading'
                className='text-lg font-bold tracking-tight text-white'
              >
                Todas las valoraciones
              </h2>
              {!isLoading && !error && (
                <p className='mt-1 text-sm text-zinc-500'>
                  {ratings.length} {ratings.length === 1 ? 'valoración publicada' : 'valoraciones publicadas'}
                </p>
              )}
            </div>

            {isLoading && (
              <div className='flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 py-12'>
                <div className='size-8 animate-spin rounded-full border-b-2 border-red-500' />
                <span className='ml-3 text-sm font-medium text-zinc-400'>Cargando valoraciones…</span>
              </div>
            )}

            {!isLoading && error && (
              <div className='rounded-2xl border border-red-900/40 bg-red-950/20 py-8 text-center text-sm text-red-400'>
                Error al cargar las valoraciones: {error.message}
              </div>
            )}

            {!isLoading && !error && ratings.length === 0 && (
              <div className='flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 py-16 text-center text-zinc-500'>
                <MessageSquare className='size-12 opacity-30' />
                <p className='text-lg font-black uppercase tracking-widest text-zinc-500'>
                  Sin valoraciones
                </p>
                <p className='max-w-xs text-sm text-zinc-600'>
                  Este usuario aún no ha publicado ninguna valoración.
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
                  deleteMode={true}
                  onDelete={handleDeleteRating}
                  driverMode={!!rating.driver_id}
                  driverInfo={rating.driver_id ? driverMap[rating.driver_id] || null : null}
                />
              ))}
          </section>
        </div>
      </div>
    </div>
  );
}