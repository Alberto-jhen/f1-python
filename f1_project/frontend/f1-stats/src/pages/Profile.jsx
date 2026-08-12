import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSection } from '@/components/profile/ProfileSection';
import { FavoriteCard } from '@/components/profile/FavoriteCard';
import { RatingItem } from '@/components/profile/RatingItem';
import { StatBadge } from '@/components/profile/StatBadge';
import { ActivityItem } from '@/components/profile/ActivityItem';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfileById } from '@/service/supabaseService';
import { useEffect, useState } from 'react';
import {
  HeartIcon,
  StarIcon,
  ActivityIcon,
  TrophyIcon,
  FlagIcon,
  MessageSquareIcon,
  GaugeIcon,
  UsersIcon,
} from 'lucide-react';

const emptyProfile = {
  full_name: '',
  username: '',
  avatar_url: '',
  created_at: '',
};

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      setLoading(true);
      const data = await fetchProfileById(user.id);

      if (data) {
        setProfile({
          full_name: data.full_name || data.username || '',
          username: data.username || '',
          avatar_url: data.avatar_url || '',
          created_at: data.created_at || '',
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user?.id]);

  if (loading) {
    return (
      <div className='min-h-screen bg-[#050505] flex items-center justify-center'>
        <p className='text-zinc-400'>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#050505] pb-16'>
      <ProfileHeader user={profile} userId={user?.id} editable />

      <div className='max-w-6xl mx-auto px-6 mt-10'>
        {/* Estadísticas rápidas */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          <StatBadge value='142' label='Predicciones' trend='up' />
          <StatBadge value='18' label='Vueltas analizadas' />
          <StatBadge value='4.8' label='Valoración media' trend='up' />
          <StatBadge value='12' label='Grandes Premios' />
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Columna principal */}
          <div className='lg:col-span-2 space-y-6'>
            <ProfileSection title='Favoritos' icon={HeartIcon}>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <FavoriteCard
                  title='Piloto favorito'
                  name='Lewis Hamilton'
                  subtitle='Mercedes-AMG F1'
                  image='/logos/mercedes.png'
                  color='blue'
                />
                <FavoriteCard
                  title='Equipo favorito'
                  name='Ferrari'
                  subtitle='Scuderia Ferrari HP'
                  image='/logos/ferrari.png'
                  color='red'
                />
              </div>
            </ProfileSection>

            <ProfileSection title='Últimas valoraciones' icon={StarIcon}>
              <RatingItem
                title='Gran Premio de España'
                category='Carrera'
                rating={4}
                date='12 may 2026'
                comment='Gran remontada de Norris, buena estrategia de Red Bull.'
              />
              <RatingItem
                title='Gran Premio de Mónaco'
                category='Carrera'
                rating={5}
                date='25 may 2026'
                comment='Carrera clásica de Mónaco, incrible pole de Leclerc.'
              />
              <RatingItem
                title='Gran Premio de Canadá'
                category='Carrera'
                rating={3}
                date='08 jun 2026'
                comment='Mucha lluvia y banderas rojas, se hizo larga.'
              />
            </ProfileSection>

            <ProfileSection title='Actividad reciente' icon={ActivityIcon}>
              <ActivityItem
                icon={MessageSquareIcon}
                type='blue'
                title='Comentaste en GP España'
                description='Gran remontada de Norris, buena estrategia de Red Bull.'
                date='Hace 2 h'
              />
              <ActivityItem
                icon={GaugeIcon}
                type='red'
                title='Analizaste vuelta de Leclerc'
                description='Sector 3 mejorado respecto a la Q2.'
                date='Ayer'
              />
              <ActivityItem
                icon={TrophyIcon}
                type='green'
                title='Predicción acertada'
                description='Pole position de Verstappen en Silverstone.'
                date='Hace 3 d'
              />
            </ProfileSection>
          </div>

          {/* Columna lateral */}
          <div className='space-y-6'>
            <ProfileSection title='Logros' icon={TrophyIcon}>
              <div className='space-y-3'>
                <div className='flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800'>
                  <div className='bg-red-600/20 p-2 rounded-full text-red-500'>
                    <FlagIcon className='size-4' />
                  </div>
                  <div>
                    <p className='text-sm font-bold text-white'>Primer GP</p>
                    <p className='text-xs text-zinc-500'>Completaste tu primera predicción</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800'>
                  <div className='bg-yellow-600/20 p-2 rounded-full text-yellow-500'>
                    <StarIcon className='size-4' />
                  </div>
                  <div>
                    <p className='text-sm font-bold text-white'>Crítico experto</p>
                    <p className='text-xs text-zinc-500'>10 valoraciones publicadas</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800'>
                  <div className='bg-blue-600/20 p-2 rounded-full text-blue-500'>
                    <UsersIcon className='size-4' />
                  </div>
                  <div>
                    <p className='text-sm font-bold text-white'>Analista de datos</p>
                    <p className='text-xs text-zinc-500'>50 vueltas analizadas</p>
                  </div>
                </div>
              </div>
            </ProfileSection>

            <ProfileSection title='Próximos eventos' icon={FlagIcon}>
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800'>
                  <div>
                    <p className='text-sm font-bold text-white'>GP Italia</p>
                    <p className='text-xs text-zinc-500'>Monza • 07 sep</p>
                  </div>
                  <span className='text-xs text-red-500 font-bold'>En 5 d</span>
                </div>
                <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800'>
                  <div>
                    <p className='text-sm font-bold text-white'>GP Azerbaiyán</p>
                    <p className='text-xs text-zinc-500'>Bakú • 21 sep</p>
                  </div>
                  <span className='text-xs text-zinc-500'>En 19 d</span>
                </div>
              </div>
            </ProfileSection>

            <ProfileSection title='Sobre mí' icon={MessageSquareIcon}>
              <p className='text-sm text-zinc-400 leading-relaxed'>
                Apasionado de la Fórmula 1 desde pequeño. Me encanta analizar telemetría, comparar
                estrategias y debatir sobre cada Gran Premio.
              </p>
            </ProfileSection>
          </div>
        </div>
      </div>
    </div>
  );
}
