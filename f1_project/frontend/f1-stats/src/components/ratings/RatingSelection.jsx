import { ChevronLeftIcon, User, FlagIcon } from 'lucide-react';
import { RaceRating } from './RaceRating';
import { RaceSelector } from './RaceSelector';
import { useState } from 'react';

const RACE_OPTIONS = [
  { value: 'bahrain', label: 'Gran Premio de Baréin' },
  { value: 'saudi-arabia', label: 'Gran Premio de Arabia Saudí' },
  { value: 'australia', label: 'Gran Premio de Australia' },
  { value: 'japan', label: 'Gran Premio de Japón' },
  { value: 'china', label: 'Gran Premio de China' },
  { value: 'miami', label: 'Gran Premio de Miami' },
  { value: 'imola', label: 'Gran Premio de Emilia-Romaña' },
  { value: 'monaco', label: 'Gran Premio de Mónaco' },
  { value: 'canada', label: 'Gran Premio de Canadá' },
  { value: 'spain', label: 'Gran Premio de España' },
  { value: 'austria', label: 'Gran Premio de Austria' },
  { value: 'silverstone', label: 'Gran Premio de Gran Bretaña' },
];

// Imágenes puramente de Fórmula 1 (Monoplazas, trazados, Red Bull, etc.)
const RACE_GALLERY = [
  'https://cdn-7.motorsport.com/images/amp/6n7APeR0/s1000/charles-leclerc-ferrari-max-ve.webp',
  'https://www.menzig.es/images/a/0000/105-h1.jpg',
  'https://img.asmedia.epimg.net/resizer/v2/QWFNE5QRTSJE7HDBJJERH3IJYU.jpg?auth=f861ae682611b0dea6f9b673abe515680e275d18baccaef41d19c689378aee8e&width=644&height=362&smart=true',
  'https://cdn-7.motorsport.com/images/amp/24QeAONY/s6/charles-leclerc-ferrari-3.jpg',
  'https://hips.hearstapps.com/hmg-prod/images/fernando-alonso-nos-desvela-su-top-5-de-mejores-pilotos-de-la-historia-de-la-f1-1539885208.jpg?resize=640:*',
];

export function RatingSelection({ mode, selection, onBack }) {
  const [selectedRace, setSelectedRace] = useState(RACE_OPTIONS[0]?.value || '');

  if (mode === 'driver') {
    return (
      <>
        <RaceSelector raceOptions={RACE_OPTIONS} value={selectedRace} onChange={setSelectedRace} season={2026} />
        <div className='animate-fade-in'>
          <div className='flex items-center gap-3 mb-4'>
            <User className='size-5 text-red-500' />
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
      </>
    );
  }

  if (mode === 'race') {
    return (
      <>
        <RaceSelector raceOptions={RACE_OPTIONS} value={selectedRace} onChange={setSelectedRace} season={2026} />
        <RaceRating onBack={onBack} raceGallery={RACE_GALLERY} selectedRace={selectedRace} />
      </>

    );
  }

  return null;
}