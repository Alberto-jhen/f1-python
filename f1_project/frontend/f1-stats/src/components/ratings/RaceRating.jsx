import { useState, useEffect } from 'react';
import { ChevronLeftIcon, MessageSquare, Newspaper, Quote } from 'lucide-react';
import { RatingStars } from './RatingStars';

export function RaceRating({ onBack, raceGallery }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const MOCK_USER = {
    name: "Piloto_01",
    avatar: "https://i.pravatar.cc/150?img=11"
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % raceGallery.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='animate-fade-in mt-4 w-full max-w-full overflow-x-hidden pb-4'>      

      {/* 2. BLOQUE PRINCIPAL: Galería | Formulario */}
      <div className='flex flex-col md:flex-row gap-8 md:gap-12 min-h-[550px]'>
        
        {/* Galería */}
        <div className='flex-1 relative overflow-hidden rounded-2xl group min-h-[300px] md:min-h-full border border-zinc-800/50 shadow-2xl'>
          <img
            key={currentImage}
            src={raceGallery[currentImage]}
            alt={`Momento destacado ${currentImage + 1}`}
            className='absolute inset-0 w-full h-full object-cover animate-in fade-in zoom-in-95 duration-1000'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none' />
          
          <div className='absolute bottom-6 left-6 flex gap-2'>
            {raceGallery.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-500 ${index === currentImage ? 'w-8 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]' : 'w-2 bg-white/30 hover:bg-white/50'}`}
              />
            ))}
          </div>
        </div>

        {/* Separador Vertical */}
        <div className='hidden md:block w-px bg-zinc-800 self-stretch' />

        {/* Formulario Derecho */}
        <div className='flex-1 flex flex-col justify-between py-2'>
          
          {/* Identidad del Usuario */}
          <div className='flex items-center gap-4 mb-8 bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl'>
            <div className='relative shrink-0'>
              <img src={MOCK_USER.avatar} alt="Perfil" className='w-12 h-12 rounded-full border-2 border-zinc-700 object-cover' />
              <div className='absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-zinc-950 rounded-full'></div>
            </div>
            <div>
              <p className='text-[10px] font-bold uppercase tracking-widest text-zinc-500'>Publicando como</p>
              <p className='text-lg font-black tracking-tight text-white'>{MOCK_USER.name}</p>
            </div>
          </div>

          <div className='space-y-10'>
            <div>
              <label className='flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-zinc-300 mb-5'>
                <span className='w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]'></span>
                Espectáculo Global
              </label>
              <div className='scale-110 sm:scale-125 origin-left ml-1'>
                <RatingStars value={rating} onChange={setRating} color='yellow' />
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
                  placeholder='Escribe aquí tu análisis detallado de la carrera...'
                  className='w-full min-h-[180px] bg-zinc-900/30 border border-zinc-800 rounded-2xl px-6 py-5 text-base text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-red-600/50 focus:ring-1 focus:ring-red-600/50 resize-none transition-all'
                />
              </div>
            </div>
          </div>

          <div className='pt-10 mt-auto'>
            <button
              type='button'
              className='w-full py-4 bg-white text-black text-sm font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all duration-300 cursor-pointer'
            >
              Publicar Análisis
            </button>
          </div>
        </div>
      </div>

      {/* 3. SECCIONES INFERIORES: Comunidad y Contexto */}
      <div className='mt-16 grid grid-cols-1 md:grid-cols-5 gap-6'>
        
        {/* Banner de Comunidad */}
        <div className='md:col-span-3 group bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-red-600/50 transition-all cursor-pointer overflow-hidden relative'>
          <div className='absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -z-10 group-hover:bg-red-600/10 transition-colors'></div>
          
          <div className='flex items-start justify-between'>
            <div>
              <MessageSquare className='size-8 text-red-600 mb-4' />
              <h3 className='text-2xl font-black italic uppercase text-white mb-2'>
                ¿Qué opina el resto?
              </h3>
              <p className='text-zinc-400 text-sm font-medium leading-relaxed max-w-md'>
                Descubre los análisis de otros usuarios. Compara tus puntuaciones, lee veredictos detallados y únete al debate de la comunidad.
              </p>
            </div>
            <div className='hidden sm:flex h-10 px-4 items-center justify-center rounded-lg bg-zinc-800 text-white text-xs font-bold uppercase tracking-widest group-hover:bg-red-600 transition-colors'>
              Ver opiniones
            </div>
          </div>
        </div>

        {/* Módulo de Noticias / Contexto */}
        <div className='md:col-span-2 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 md:p-8'>
          <div className='flex items-center gap-3 mb-6'>
            <Newspaper className='size-5 text-zinc-400' />
            <h3 className='text-sm font-bold uppercase tracking-widest text-white'>
              Contexto Pista
            </h3>
          </div>
          
          <div className='space-y-4'>
            <div className='bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 transition-colors cursor-pointer'>
              <div className='flex items-center gap-2 mb-2'>
                <span className='w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse'></span>
                <span className='text-[10px] font-bold uppercase tracking-widest text-zinc-500'>Destacado</span>
              </div>
              <p className='text-sm text-zinc-200 font-medium'>
                Revisa los datos de telemetría y degradación antes de dar tu valoración final.
              </p>
            </div>
            
            <div className='bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 transition-colors cursor-pointer'>
              <p className='text-sm text-zinc-400 line-clamp-2'>
                No olvides que la climatología jugó un papel crucial en las estrategias de boxes de este fin de semana.
              </p>
            </div>
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
          Volver a la selección principal
        </button>
      </div>

    </div>
  );
}