import { FlagIcon } from 'lucide-react';
import { GenericCombobox } from '@/components/GenericComobobox';

export function RaceSelector({ raceOptions = [], value, onChange, season = 2026 }) {
  const selectedRace = value || raceOptions[0]?.value || '';

  const handleChange = (newValue) => {
    if (onChange) onChange(newValue);
  };

  const selectedRaceLabel = raceOptions.find((opt) => opt.value === selectedRace)?.label || 'Selecciona una carrera';

  return (
    <div className='flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12'>
      <div>
        <div className='flex items-center gap-2 mb-3'>
          <FlagIcon className='size-4 text-red-600' />
          <span className='text-xs font-bold uppercase tracking-[0.2em] text-zinc-400'>
            Análisis de Carrera
          </span>
        </div>
        <h2 className='text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none mb-2'>
          {selectedRaceLabel}
        </h2>
        <p className='text-sm font-bold uppercase tracking-widest text-red-600'>
          Temporada {season}
        </p>
      </div>
      <div className='w-full md:w-64'>
        <label className='block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2'>
          Cambiar Gran Premio
        </label>
        <GenericCombobox
          options={raceOptions}
          value={selectedRace}
          onChange={handleChange}
          placeholder='Selecciona una carrera...'
        />
      </div>
    </div>
  );
}
