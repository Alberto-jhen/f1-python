import { UsersIcon, FlagIcon, ChevronLeftIcon } from 'lucide-react';

export function RatingSelection({ mode, selection, onBack }) {
  if (mode === 'driver') {
    return (
      <div className='animate-fade-in'>
        <div className='flex items-center gap-3 mb-4'>
          <UsersIcon className='size-5 text-red-500' />
          <h2 className='text-xl font-bold text-white tracking-tight'>Valoración de piloto</h2>
        </div>
        <p className='text-zinc-400 text-sm mb-6'>
          Has seleccionado a <span className='text-white font-bold'>{selection?.name || 'un piloto'}</span>.
        </p>
        <div className='bg-zinc-950 border border-zinc-800 rounded-xl p-8 flex items-center justify-center min-h-[200px]'>
          <p className='text-zinc-500 text-sm'>Aquí irá el formulario de valoración del piloto.</p>
        </div>
        <button
          type='button'
          onClick={onBack}
          className='mt-6 flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors'
        >
          <ChevronLeftIcon className='size-4' />
          Volver
        </button>
      </div>
    );
  }

  if (mode === 'race') {
    return (
      <div className='animate-fade-in'>
        <div className='flex items-center gap-3 mb-4'>
          <FlagIcon className='size-5 text-red-500' />
          <h2 className='text-xl font-bold text-white tracking-tight'>Valoración de carrera</h2>
        </div>
        <p className='text-zinc-400 text-sm mb-6'>
          Has seleccionado <span className='text-white font-bold'>{selection?.name || 'una carrera'}</span>.
        </p>
        <div className='bg-zinc-950 border border-zinc-800 rounded-xl p-8 flex items-center justify-center min-h-[200px]'>
          <p className='text-zinc-500 text-sm'>Aquí irá el formulario de valoración de la carrera.</p>
        </div>
        <button
          type='button'
          onClick={onBack}
          className='mt-6 flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors'
        >
          <ChevronLeftIcon className='size-4' />
          Volver
        </button>
      </div>
    );
  }

  return null;
}
