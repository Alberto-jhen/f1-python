import { useEffect, useMemo, useState } from 'react';
import { Check, User } from 'lucide-react';
import { toast } from 'sonner';

import DriverGridSelector from '@/components/drivers/DriverGridSelector.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getTeamColor, getTeamLogo } from '@/lib/teamLogos';
import { fetchDriversFullNamesByYear } from '@/service/apiService.ts';
import { uploadFavoritesToSupabase } from '@/service/supabaseService';

const CURRENT_YEAR = new Date().getFullYear();

function normalizeDriver(driver) {
  return {
    ...driver,
    year: CURRENT_YEAR,
    driverValue: driver.value,
    driverLabel: driver.label,
    driverNumber: driver.number,
  };
}

const TABS = [
  { key: 'driver', label: 'Piloto' },
  { key: 'team', label: 'Equipo' },
];

export function FavoritesModal({ open, onClose, onSaved, userId, favoriteDriver, favoriteTeam }) {
  const [tab, setTab] = useState('driver');
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [driversError, setDriversError] = useState(false);
  const [selectedDriverName, setSelectedDriverName] = useState(favoriteDriver || null);
  const [selectedTeamName, setSelectedTeamName] = useState(favoriteTeam || null);
  const [saving, setSaving] = useState(false);

  // Al abrir el modal, sincroniza la selección con los favoritos actuales (nombres).
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setTab('driver');
      setSelectedDriverName(favoriteDriver || null);
      setSelectedTeamName(favoriteTeam || null);
    }
  }

  // Carga la parrilla con la misma función que usa la página de pilotos.
  useEffect(() => {
    if (!open || drivers.length > 0) return;

    const controller = new AbortController();
    let ignore = false;

    const loadDrivers = async () => {
      setLoadingDrivers(true);
      setDriversError(false);
      try {
        const data = await fetchDriversFullNamesByYear(CURRENT_YEAR, 'latest', 'R', controller.signal);
        if (!ignore) setDrivers(data || []);
      } catch (e) {
        if (ignore || e.name === 'AbortError' || controller.signal.aborted) return;
        console.error('Error cargando pilotos:', e);
        setDriversError(true);
      } finally {
        if (!ignore) setLoadingDrivers(false);
      }
    };

    loadDrivers();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [open, drivers.length]);

  const teams = useMemo(() => {
    const map = new Map();
    drivers.forEach((d) => {
      if (d.team && !map.has(d.team)) {
        map.set(d.team, { name: d.team, team_color: d.team_color || null });
      }
    });
    return Array.from(map.values());
  }, [drivers]);

  // Resuelve el objeto del piloto a partir del nombre guardado (para el grid).
  const selectedDriver = useMemo(() => {
    if (!selectedDriverName) return null;
    const match = drivers.find((d) => d.label === selectedDriverName);
    return match ? normalizeDriver(match) : null;
  }, [drivers, selectedDriverName]);

  const handleDriverSelect = (driver) => {
    setSelectedDriverName(driver ? driver.label : null);
  };

  const handleTeamSelect = (team) => {
    setSelectedTeamName((prev) => (prev === team.name ? null : team.name));
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error('No se ha detectado un usuario logueado');
      return;
    }
    setSaving(true);
    try {
      const favorites = {
        favorite_driver: selectedDriverName,
        favorite_team: selectedTeamName,
      };
      await uploadFavoritesToSupabase(favorites, userId);
      toast.success('Favoritos actualizados');
      onSaved?.(favorites);
      onClose();
    } catch (error) {
      console.error('Error al guardar los favoritos:', error);
      toast.error('Error al guardar los favoritos');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className='sm:max-w-3xl bg-zinc-950 border-zinc-800 text-white max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-white'>Selecciona tus favoritos</DialogTitle>
        </DialogHeader>

        <div className='flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 w-fit'>
          {TABS.map((t) => (
            <button
              key={t.key}
              type='button'
              onClick={() => setTab(t.key)}
              className={`px-5 py-1.5 rounded-md font-bold uppercase tracking-widest text-xs transition-all cursor-pointer ${
                tab === t.key
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-transparent text-zinc-500 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'driver' && (
          <div className='min-h-[300px]'>
            {driversError && !loadingDrivers && (
              <p className='text-sm text-red-500 py-4'>
                Error al cargar la parrilla. Inténtalo de nuevo más tarde.
              </p>
            )}
            {!driversError && (
              <DriverGridSelector
                drivers={drivers}
                year={CURRENT_YEAR}
                mode='individual'
                selectedDriver={selectedDriver}
                comparisonList={[]}
                onSelect={handleDriverSelect}
                onRemove={() => {}}
                loading={loadingDrivers}
              />
            )}
          </div>
        )}

        {tab === 'team' && (
          <div className='min-h-[300px]'>
            {loadingDrivers ? (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className='h-24 rounded-xl bg-zinc-900/60 animate-pulse' />
                ))}
              </div>
            ) : teams.length === 0 ? (
              <div className='flex flex-col items-center justify-center text-zinc-500 gap-2 py-12'>
                <User className='size-8 opacity-30' />
                <p className='text-xs font-medium uppercase tracking-widest'>
                  No se encontraron equipos
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                {teams.map((team) => {
                  const selected = selectedTeamName === team.name;
                  const teamColor =
                    getTeamColor(team.name) ||
                    (team.team_color ? `#${team.team_color}` : '#dc2626');
                  const logo = getTeamLogo(team.name);
                  return (
                    <button
                      key={team.name}
                      type='button'
                      onClick={() => handleTeamSelect(team)}
                      className={`relative flex flex-col items-center justify-center gap-2 h-24 rounded-xl border bg-zinc-900/40 px-3 py-2 transition-all cursor-pointer ${
                        selected
                          ? 'border-white/40 ring-2 ring-white/30 scale-[1.02]'
                          : 'border-zinc-800 hover:border-zinc-700 hover:scale-[1.01]'
                      }`}
                      style={{ boxShadow: selected ? `0 0 20px ${teamColor}33` : undefined }}
                    >
                      <div
                        className='absolute inset-0 rounded-xl opacity-10 pointer-events-none'
                        style={{ background: `linear-gradient(135deg, ${teamColor}, transparent 80%)` }}
                      />
                      {logo && (
                        <img src={logo} alt={team.name} className='h-8 w-auto object-contain relative z-10' />
                      )}
                      <span className='text-xs font-bold uppercase tracking-wider text-white text-center truncate w-full relative z-10'>
                        {team.name}
                      </span>
                      {selected && (
                        <span className='absolute top-2 right-2 bg-white text-zinc-950 rounded-full size-5 flex items-center justify-center shadow-lg'>
                          <Check className='size-3.5 stroke-[3]' />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={onClose}
            className='text-black font-sans bg-gray-300 hover:bg-gray-400 cursor-pointer'
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className='bg-green-500 hover:bg-green-600 text-white font-sans cursor-pointer'
          >
            {saving ? 'Guardando...' : 'Guardar favoritos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
