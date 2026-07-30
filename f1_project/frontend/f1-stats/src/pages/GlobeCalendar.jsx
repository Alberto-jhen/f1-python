import { useState } from 'react';
import { GlobeGL } from '@/components/GlobeGL';

const globeConfig = {
  globeColor: '#0f172a',
  emissive: '#000000',
  emissiveIntensity: 0.1,
  shininess: 0.9,
  ambientLight: '#ffffff',
  directionalLeftLight: '#ffffff',
  directionalTopLight: '#ffffff',
  pointLight: '#ef4444',
};

const sampleRaces = [
  {
    lat: 40.4168,
    lng: -3.7038,
    label: 'Spanish GP',
    color: '#ef4444',
    size: 1.4,
    dotRadius: 0.6,
    info: {
      circuit: 'Circuit de Barcelona-Catalunya',
      country: 'Spain',
      date: '2026-05-10',
      round: 6,
    },
  },
  {
    lat: 51.5074,
    lng: -0.1278,
    label: 'British GP',
    color: '#3b82f6',
    size: 1.4,
    dotRadius: 0.6,
    info: {
      circuit: 'Silverstone Circuit',
      country: 'United Kingdom',
      date: '2026-07-05',
      round: 11,
    },
  },
  {
    lat: 25.276987,
    lng: 55.296249,
    label: 'Abu Dhabi GP',
    color: '#22c55e',
    size: 1.4,
    dotRadius: 0.6,
    info: {
      circuit: 'Yas Marina Circuit',
      country: 'UAE',
      date: '2026-12-06',
      round: 24,
    },
  },
  {
    lat: 1.352083,
    lng: 103.819836,
    label: 'Singapore GP',
    color: '#eab308',
    size: 1.4,
    dotRadius: 0.6,
    info: {
      circuit: 'Marina Bay Street Circuit',
      country: 'Singapore',
      date: '2026-09-27',
      round: 18,
    },
  },
  {
    lat: 43.7384,
    lng: 7.4246,
    label: 'Monaco GP',
    color: '#f97316',
    size: 1.4,
    dotRadius: 0.6,
    info: {
      circuit: 'Circuit de Monaco',
      country: 'Monaco',
      date: '2026-05-24',
      round: 8,
    },
  },
];

export function GlobeCalendar() {
  const [selectedRace, setSelectedRace] = useState(null);

  return (
    <div className='relative h-screen w-full overflow-hidden bg-black'>
      <div className='relative z-0 w-full h-full'>
        <GlobeGL
          markers={sampleRaces}
          onMarkerClick={(race) => setSelectedRace(race)}
          config={globeConfig}
        />
      </div>

      <div className='absolute top-6 left-6 z-10 max-w-sm'>
        <div className='bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl'>
          <h1 className='text-2xl font-black italic uppercase tracking-tighter text-white mb-2'>
            F1 Race Calendar
          </h1>
          <p className='text-zinc-400 text-xs uppercase tracking-widest'>
            Click a marker to view race details
          </p>
        </div>
      </div>

      {selectedRace && (
        <div className='absolute bottom-6 right-6 z-10 max-w-sm'>
          <div className='bg-zinc-950/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-black italic uppercase tracking-tighter text-white'>
                {selectedRace.label}
              </h2>
              <button
                onClick={() => setSelectedRace(null)}
                className='text-zinc-500 hover:text-white transition-colors text-sm'
              >
                ✕
              </button>
            </div>
            <div className='space-y-2 text-sm text-zinc-300'>
              <p>
                <span className='text-zinc-500 uppercase text-xs tracking-wider'>Circuit:</span>{' '}
                {selectedRace.info.circuit}
              </p>
              <p>
                <span className='text-zinc-500 uppercase text-xs tracking-wider'>Country:</span>{' '}
                {selectedRace.info.country}
              </p>
              <p>
                <span className='text-zinc-500 uppercase text-xs tracking-wider'>Date:</span>{' '}
                {selectedRace.info.date}
              </p>
              <p>
                <span className='text-zinc-500 uppercase text-xs tracking-wider'>Round:</span>{' '}
                {selectedRace.info.round}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
