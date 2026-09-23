import { useState, useEffect } from 'react';
import { ChevronLeftIcon, Quote } from 'lucide-react';
import { toast } from 'sonner';

import { RatingStars } from './RatingStars';
import { usePublishRating } from '@/hooks/usePublishRating';

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

function buildDriverImageUrl(year, surname) {
  const surnameNorm = surname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return `https://media.formula1.com/content/dam/fom-website/drivers/${year}Drivers/${surnameNorm}.jpg`;
}

function getDriverSurname(fullName) {
  const parts = fullName.split(' ');
  return parts[parts.length - 1];
}

export function DriverRating({ onBack, selectedDriver, selectedRace, user, loadingUser = false }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageFallback, setImageFallback] = useState(false);
  const { publish, loading: publishing, error: publishError, data: publishedData } = usePublishRating();

  const displayName = loadingUser ? 'Cargando...' : (user?.username || user?.full_name || 'Usuario Anónimo');
  const avatarUrl = user?.avatar_url || DEFAULT_AVATAR;

  const surname = getDriverSurname(selectedDriver?.driverLabel || '');
  const surnameNorm = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const imageUrl = buildDriverImageUrl(selectedDriver?.year || 2026, surnameNorm);
  const color = selectedDriver?.team_color ? `#${selectedDriver.team_color}` : '#dc2626';

  const handlePublish = async () => {
    if (!selectedRace || rating < 1 || !user?.id || !selectedDriver) return;
    try {
      await publish(user.id, {
        race_id: selectedRace,
        driver_id: selectedDriver.driverValue,
        rating,
        comment: comment.trim() || undefined,
      });
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error al publicar la valoración:', error);
    }
  };

  useEffect(() => {
    if (publishError) {
      toast.error(publishError.message || 'Error al publicar la valoración');
    }
  }, [publishError]);

  useEffect(() => {
    if (publishedData) {
      toast.success('Valoración del piloto publicada correctamente');
    }
  }, [publishedData]);

  return (
    <div className='animate-fade-in mt-4 w-full max-w-full overflow-x-hidden pb-4'>
      <div className='flex flex-col md:flex-row gap-8 md:gap-12 min-h-[550px]'>

        {/* Formulario Izquierdo */}
        <div className='flex-1 flex flex-col justify-between py-2 order-2 md:order-1'>

          {/* Identidad del Usuario */}
          <div className='flex items-center gap-4 mb-8 bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl'>
            <div className='relative shrink-0'>
              <img src={avatarUrl} alt='Perfil' className='w-12 h-12 rounded-full border-2 border-zinc-700 object-cover' />
              <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-zinc-950 rounded-full'></div>
            </div>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-widest text-zinc-500'>Publicando como</p>
              <p className='text-lg font-black tracking-tight text-white'>{displayName}</p>
            </div>
          </div>

          <div className='space-y-10'>
            <div>
              <label className='flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300 mb-5'>
                <span className='w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'></span>
                Rendimiento del Piloto
              </label>
              <div className='scale-110 sm:scale-125 origin-left ml-1'>
                <RatingStars value={rating} onChange={setRating} color='red' />
              </div>
            </div>

            <div className='relative'>
              <label className='flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300 mb-4'>
                <span className='w-2 h-2 rounded-full bg-zinc-600'></span>
                Veredicto <span className='text-zinc-600 font-medium normal-case tracking-normal'>(Opcional)</span>
              </label>

              <div className='relative group'>
                <Quote className='absolute top-4 right-4 size-6 text-zinc-800 group-focus-within:text-red-900/30 transition-colors pointer-events-none' />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder='Escribe aquí tu análisis detallado del piloto...'
                  className='w-full min-h-[180px] bg-zinc-900/30 border border-zinc-800 rounded-2xl px-6 py-5 text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 resize-none transition-all'
                />
              </div>
            </div>
          </div>

          <div className='pt-10 mt-auto'>
            <button
              type='button'
              onClick={handlePublish}
              disabled={publishing || !selectedRace || rating < 1 || !user?.id}
              className='w-full h-9 px-4 bg-gradient-to-r from-red-700 to-red-600 text-white text-sm font-bold uppercase tracking-wider rounded-lg border border-red-500/20 hover:from-red-600 hover:to-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            >
              {publishing ? 'Publicando...' : 'Publicar Valoración'}
            </button>
          </div>
        </div>

        {/* Separador Vertical */}
        <div className='hidden md:block w-px bg-zinc-800 self-stretch order-2 md:order-1' />

        {/* Imagen del Piloto Derecha */}
        <div className='flex-1 relative overflow-hidden rounded-2xl group min-h-[300px] md:min-h-full border border-zinc-800/50 shadow-2xl order-1 md:order-2'>
          {!imageFallback ? (
            <img
              src={imageUrl}
              alt={selectedDriver?.driverLabel}
              onError={() => setImageFallback(true)}
              className='absolute inset-0 w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105'
            />
          ) : (
            <div className='absolute inset-0 flex items-center justify-center bg-zinc-950'>
              <span className='text-6xl font-black italic text-zinc-800'>
                {selectedDriver?.driverNumber || '?'}
              </span>
            </div>
          )}
          <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none' />

          <div className='absolute bottom-6 left-6 right-6'>
            <div
              className='w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white mb-3'
              style={{ backgroundColor: color }}
            >
              {selectedDriver?.team || 'Cargando equipo…'}
            </div>
            <h3 className='text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none'>
              {selectedDriver?.driverLabel}
            </h3>
            <p className='text-sm font-bold text-zinc-400 mt-2 uppercase tracking-widest'>
              #{selectedDriver?.driverNumber} • {selectedDriver?.year}
            </p>
          </div>

          <div
            className='absolute top-4 right-4 text-7xl md:text-8xl font-black italic leading-none opacity-10 pointer-events-none select-none'
            style={{ color }}
          >
            {selectedDriver?.driverNumber}
          </div>
        </div>
      </div>

      {/* Botón de volver */}
      <div className='mt-12 flex justify-center border-t border-zinc-800/80 pt-8'>
        <button
          type='button'
          onClick={onBack}
          className='flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors px-6 py-3 rounded-xl hover:bg-zinc-900'
        >
          <ChevronLeftIcon className='size-4' />
          Volver a la selección
        </button>
      </div>
    </div>
  );
}
