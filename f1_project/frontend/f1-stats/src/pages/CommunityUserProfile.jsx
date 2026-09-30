import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, HeartIcon, StarIcon } from 'lucide-react';

import { FavoriteCard } from '@/components/profile/FavoriteCard';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { RatingStats } from '@/components/profile/RatingStats';
import { RatingItem } from '@/components/ratings/RatingItem';
import { useUserRatings } from '@/hooks/useRatings';
import { getTeamColor, getTeamLogo } from '@/lib/teamLogos';
import { fetchDriversFullNamesByYear } from '@/service/apiService.ts';
import { fetchPublicProfileById } from '@/service/supabaseService';

function formatRatingDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function CommunityUserProfile() {
  const { profileId } = useParams();
  const targetProfileId = profileId || '';
  const [publicProfile, setPublicProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [driverMap, setDriverMap] = useState({});
  const { ratings, loading: ratingsLoading, error: ratingsError } = useUserRatings({
    currentProfileId: targetProfileId,
    sortBy: 'created_at',
    limit: null,
  });

  useEffect(() => {
    if (!targetProfileId) {
      setPublicProfile(null);
      setProfileError(null);
      setProfileLoading(false);
      return;
    }

    let ignore = false;
    setPublicProfile(null);
    setProfileLoading(true);
    setProfileError(null);

    const loadProfile = async () => {
      try {
        const data = await fetchPublicProfileById(targetProfileId);
        if (!ignore) setPublicProfile(data);
      } catch (e) {
        if (ignore) return;
        console.error('Error cargando el perfil del usuario:', e);
        setProfileError(e);
      } finally {
        if (!ignore) setProfileLoading(false);
      }
    };

    loadProfile();
    return () => {
      ignore = true;
    };
  }, [targetProfileId]);

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

  const isLoading = profileLoading || ratingsLoading;
  const displayedProfile = publicProfile || ratings[0]?.profile || null;
  const profileUser = displayedProfile
    ? {
        ...displayedProfile,
        full_name: displayedProfile.full_name || displayedProfile.username || 'Usuario',
        username: displayedProfile.username || 'usuario',
      }
    : null;
  const favoriteDriver = profileUser?.favorite_driver || null;
  const favoriteTeam = profileUser?.favorite_team || null;

  if (isLoading) {
    return (
      <div className='min-h-screen bg-[#050505] flex items-center justify-center'>
        <p className='text-zinc-400'>Cargando perfil...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className='min-h-screen bg-[#050505] pb-16'>
        <div className='max-w-6xl mx-auto px-6 py-20 flex flex-col items-center gap-5 text-center'>
          <p className='text-zinc-400'>
            {profileError || ratingsError
              ? 'No se ha podido cargar el perfil de este usuario.'
              : 'No se encontró el perfil solicitado.'}
          </p>
          <Link
            to='/ratings/community'
            className='inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors'
          >
            <ArrowLeft className='size-4' />
            Volver a la comunidad
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#050505] pb-16'>
      <ProfileHeader
        key={targetProfileId}
        user={profileUser}
        userId={targetProfileId}
        editable={false}
      />

      <div className='max-w-6xl mx-auto px-6 mt-10'>
        <div className='flex justify-end mb-5'>
          <Link
            to='/ratings/community'
            className='group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors'
          >
            <ArrowLeft className='size-4 group-hover:-translate-x-1 transition-transform' />
            Volver a la comunidad
          </Link>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <ProfileSection title='Favoritos' icon={HeartIcon}>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FavoriteCard
                  title='Piloto favorito'
                  name={favoriteDriver || 'Sin seleccionar'}
                  subtitle={
                    favoriteDriver
                      ? `Favorito de ${profileUser.full_name}`
                      : 'No ha seleccionado un piloto favorito'
                  }
                  color={favoriteDriver ? '#dc2626' : 'gray'}
                />
                <FavoriteCard
                  title='Equipo favorito'
                  name={favoriteTeam || 'Sin seleccionar'}
                  subtitle={
                    favoriteTeam
                      ? `Escudería favorita de ${profileUser.full_name}`
                      : 'No ha seleccionado un equipo favorito'
                  }
                  image={getTeamLogo(favoriteTeam)}
                  color={getTeamColor(favoriteTeam) || 'gray'}
                />
              </div>
            </ProfileSection>

            <ProfileSection title='Valoraciones' icon={StarIcon}>
              {ratingsLoading && (
                <p className='text-sm text-zinc-500 py-4'>Cargando valoraciones...</p>
              )}
              {!ratingsLoading && ratingsError && (
                <p className='text-sm text-red-400 py-4'>
                  No se pudieron cargar las valoraciones de este usuario.
                </p>
              )}
              {!ratingsLoading && !ratingsError && ratings.length === 0 && (
                <p className='text-sm text-zinc-500 py-4'>
                  Aún no hay valoraciones publicadas.
                </p>
              )}
              {!ratingsLoading &&
                !ratingsError &&
                ratings.map((rating) => {
                  const race = rating.race || {};
                  const driverName = rating.driver_id
                    ? driverMap[rating.driver_id]?.label || rating.driver_id
                    : null;

                  return (
                    <RatingItem
                      key={rating.id}
                      title={race.circuit_name || race.name || 'Gran Premio'}
                      category={driverName ? `Piloto · ${driverName}` : 'Carrera'}
                      rating={rating.rating}
                      date={formatRatingDate(rating.created_at)}
                      comment={rating.comment}
                    />
                  );
                })}
            </ProfileSection>
          </div>

          <aside className='space-y-6'>
            <RatingStats ratings={ratings} loading={ratingsLoading} error={ratingsError} />
          </aside>
        </div>
      </div>
    </div>
  );
}