import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  StarIcon,
  PencilIcon,
  ArrowRightIcon,
} from 'lucide-react';

import { FavoriteCard } from '@/components/profile/FavoriteCard';
import { FavoritesModal } from '@/components/profile/FavoritesModal';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { RatingStats } from '@/components/profile/RatingStats';
import { RatingItem } from '@/components/ratings/RatingItem';
import { useProfile } from '@/hooks/useProfile';
import { useUserRatings } from '@/hooks/useRatings';
import { getTeamLogo, getTeamColor } from '@/lib/teamLogos';

function formatRatingDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function Profile() {
  const { profile, setProfile, loading, user } = useProfile();
  const { ratings, loading: loadingRatings, error: ratingsError } = useUserRatings({
    currentProfileId: user?.id,
    sortBy: 'created_at',
    limit: null,
  });
  const latestRatings = ratings.slice(0, 3);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);

  const handleFavoritesSaved = (favorites) => {
    setProfile((prev) => ({ ...prev, ...favorites }));
  };


  const favoriteDriver = profile?.favorite_driver || null;
  const favoriteTeam = profile?.favorite_team || null;

  if (loading) {
    return (
      <div className='min-h-screen bg-[#050505] flex items-center justify-center'>
        <p className='text-zinc-400'>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#050505] pb-16'>
      <ProfileHeader
        user={profile}
        userId={user?.id}
        editable
        onProfileUpdated={(updates) => setProfile((prev) => ({ ...prev, ...updates }))}
      />

      <div className='max-w-6xl mx-auto px-6 mt-10'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Columna principal */}
          <div className='lg:col-span-2 space-y-6'>
            <ProfileSection title='Favoritos' icon={HeartIcon}>
              <div className='flex justify-end mb-3'>
                <button
                  type='button'
                  onClick={() => setFavoritesModalOpen(true)}
                  className='flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer'
                >
                  <PencilIcon className='size-3' />
                  <span>Editar favoritos</span>
                </button>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FavoriteCard
                  title='Piloto favorito'
                  name={favoriteDriver || 'Sin seleccionar'}
                  subtitle={
                    favoriteDriver ? 'Tu piloto favorito' : 'Haz clic para elegir tu piloto favorito'
                  }
                  color={favoriteDriver ? '#dc2626' : 'gray'}
                  onClick={() => setFavoritesModalOpen(true)}
                />
                <FavoriteCard
                  title='Equipo favorito'
                  name={favoriteTeam || 'Sin seleccionar'}
                  subtitle={
                    favoriteTeam ? 'Tu escudería favorita' : 'Haz clic para elegir tu equipo favorito'
                  }
                  image={getTeamLogo(favoriteTeam)}
                  color={getTeamColor(favoriteTeam) || 'gray'}
                  onClick={() => setFavoritesModalOpen(true)}
                />
              </div>
            </ProfileSection>

            <ProfileSection title='Últimas valoraciones' icon={StarIcon}>
              {loadingRatings && (
                <p className='text-sm text-zinc-500 py-4'>Cargando valoraciones...</p>
              )}
              {!loadingRatings && latestRatings.length === 0 && (
                <p className='text-sm text-zinc-500 py-4'>
                  Aún no hay valoraciones publicadas.
                </p>
              )}
              {!loadingRatings &&
                latestRatings.map((rating) => {
                  const race = rating.race || {};
                  const driverId = rating.driver_id;
                  return (
                    <RatingItem
                      key={rating.id}
                      title={race.circuit_name || 'Gran Premio'}
                      category={driverId ? 'Piloto' : 'Carrera'}
                      rating={rating.rating}
                      date={formatRatingDate(rating.created_at)}
                      comment={rating.comment}
                    />
                  );
                })}
              {!loadingRatings && latestRatings.length > 0 && user?.id && (
                <Link
                  to={`/profile/${user.id}/ratings`}
                  className='group flex items-center justify-center gap-2 mt-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950/50 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-red-900/50 hover:bg-red-950/20 transition-all'
                >
                  Ver todas mis valoraciones
                  <ArrowRightIcon className='size-4 group-hover:translate-x-1 transition-transform' />
                </Link>
              )}
            </ProfileSection>
          </div>

          {/* Columna lateral */}
          <div className='space-y-6'>
            <RatingStats ratings={ratings} loading={loadingRatings} error={ratingsError} />
          </div>
        </div>
      </div>

      <FavoritesModal
        open={favoritesModalOpen}
        onClose={() => setFavoritesModalOpen(false)}
        onSaved={handleFavoritesSaved}
        userId={user?.id}
        favoriteDriver={favoriteDriver}
        favoriteTeam={favoriteTeam}
      />
    </div>
  );
}
