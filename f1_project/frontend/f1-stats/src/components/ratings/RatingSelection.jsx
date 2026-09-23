import { ChevronLeftIcon, User, FlagIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import DriverGridSelector from '@/components/drivers/DriverGridSelector.jsx';
import { useProfile } from '@/hooks/useProfile';
import { useRacesBySeason } from '@/hooks/useRacesBySeason';
import { fetchDriversFullNamesByYear } from '@/service/apiService.ts';

import { DriverRating } from './DriverRating';
import { RaceRating } from './RaceRating';
import { RaceSelector } from './RaceSelector';

const RACE_GALLERY = [
  'https://cdn-7.motorsport.com/images/amp/6n7APeR0/s1000/charles-leclerc-ferrari-max-ve.webp',
  'https://www.menzig.es/images/a/0000/105-h1.jpg',
  'https://img.asmedia.epimg.net/resizer/v2/QWFNE5QRTSJE7HDBJJERH3IJYU.jpg?auth=f861ae682611b0dea6f9b673abe515680e275d18baccaef41d19c689378aee8e&width=644&height=362&smart=true',
  'https://cdn-7.motorsport.com/images/amp/24QeAONY/s6/charles-leclerc-ferrari-3.jpg',
  'https://hips.hearstapps.com/hmg-prod/images/fernando-alonso-nos-desvela-su-top-5-de-mejores-pilotos-de-la-historia-de-la-f1-1539885208.jpg?resize=640:*',
];

function normalizeDriver(driver, year) {
  return {
    ...driver,
    year,
    driverValue: driver.value,
    driverLabel: driver.label,
    driverNumber: driver.number,
    team: driver.team,
    team_color: driver.team_color,
    country: driver.country,
  };
}

export function RatingSelection({ mode, onBack }) {
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState(null);
  const { races, loading: racesLoading, error: racesError } = useRacesBySeason(2026);
  const { profile, loading: profileLoading } = useProfile();

  const raceOptions = races.map((race) => ({ value: race.id, label: race.name }));
  const currentSelectedRace = selectedRace || raceOptions[0]?.value || '';
  const currentSelectedRaceName = raceOptions.find((opt) => opt.value === currentSelectedRace)?.label || '';

  useEffect(() => {
    setSelectedDriver(null);
    setDrivers([]);
    setDriversError(null);
    if (!currentSelectedRaceName) return;

    const controller = new AbortController();
    let ignore = false;

    const loadDrivers = async () => {
      setLoadingDrivers(true);
      try {
        const data = await fetchDriversFullNamesByYear(2026, currentSelectedRaceName, 'R', controller.signal);
        if (!ignore) setDrivers(data || []);
      } catch (e) {
        if (ignore || e.name === 'AbortError' || controller.signal.aborted) return;
        setDriversError(e);
        console.error('Error cargando pilotos:', e);
      } finally {
        if (!ignore) setLoadingDrivers(false);
      }
    };

    loadDrivers();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [currentSelectedRaceName]);

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver ? normalizeDriver(driver, 2026) : null);
  };

  if (racesLoading) {
    return <div className='text-zinc-400 text-sm'>Cargando carreras...</div>;
  }

  if (racesError) {
    return <div className='text-red-500 text-sm'>Error al cargar las carreras.</div>;
  }

  if (raceOptions.length === 0) {
    return <div className='text-zinc-400 text-sm'>No hay carreras disponibles.</div>;
  }

  if (mode === 'driver') {
    return (
      <>
        <RaceSelector
          raceOptions={raceOptions}
          value={currentSelectedRace}
          onChange={setSelectedRace}
          season={2026}
          title='Valoración de piloto'
        />

        {driversError && (
          <div className='text-red-500 text-sm mb-4'>Error al cargar la parrilla del GP.</div>
        )}

        {!selectedDriver && (
          <div className='animate-fade-in mb-8'>
            <div className='flex items-center gap-3 mb-4'>
              <User className='size-5 text-red-500' />
              <h2 className='text-xl font-bold text-white tracking-tight'>Selecciona un piloto</h2>
            </div>
            <DriverGridSelector
              drivers={drivers}
              year={2026}
              mode='individual'
              selectedDriver={selectedDriver}
              comparisonList={[]}
              onSelect={handleDriverSelect}
              onRemove={() => {}}
              loading={loadingDrivers}
            />
            <button
              type='button'
              onClick={onBack}
              className='mt-6 flex items-center gap-2 text-zinc-400 hover:text-white text-sm font-bold uppercase tracking-widest cursor-pointer transition-colors'
            >
              <ChevronLeftIcon className='size-4' />
              Volver
            </button>
          </div>
        )}

        {selectedDriver && (
          <DriverRating
            key={selectedDriver.driverValue}
            selectedDriver={selectedDriver}
            selectedRace={currentSelectedRace}
            user={profile}
            loadingUser={profileLoading}
            onBack={() => setSelectedDriver(null)}
          />
        )}
      </>
    );
  }

  if (mode === 'race') {
    return (
      <>
        <RaceSelector raceOptions={raceOptions} value={currentSelectedRace} onChange={setSelectedRace} season={2026} />
        <RaceRating onBack={onBack} raceGallery={RACE_GALLERY} selectedRace={currentSelectedRace} user={profile} loadingUser={profileLoading} />
      </>

    );
  }

  return null;
}