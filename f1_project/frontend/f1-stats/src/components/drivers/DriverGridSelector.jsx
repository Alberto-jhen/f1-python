import { useState, useMemo } from 'react';
import { Search, Check, X, User, Filter } from 'lucide-react';
import { GenericCombobox } from '@/components/GenericComobobox';
import { getInitials } from '@/lib/utils.js';

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

export default function DriverGridSelector({
  drivers = [],
  year,
  mode,
  selectedDriver,
  comparisonList = [],
  onSelect,
  onRemove,
  loading,
}) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [imageFallbacks, setImageFallbacks] = useState({});

  const teamOptions = useMemo(() => {
    const map = new Map();
    drivers.forEach((d) => {
      if (d.team && !map.has(d.team)) {
        map.set(d.team, d.team_color);
      }
    });
    const allTeams = Array.from(map.entries()).map(([team, color]) => ({ team, color }));
    return [
      { value: 'all', label: 'Todos los equipos' },
      ...allTeams.map(({ team, color }) => ({ value: team, label: team, team_color: color })),
    ];
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return drivers.filter((d) => {
      const matchesSearch =
        !term ||
        d.label?.toLowerCase().includes(term) ||
        d.team?.toLowerCase().includes(term) ||
        String(d.number).includes(term);
      const matchesTeam = teamFilter === 'all' || d.team === teamFilter;
      return matchesSearch && matchesTeam;
    });
  }, [drivers, search, teamFilter]);

  const handleImageError = (driverValue) => {
    setImageFallbacks((prev) => ({ ...prev, [driverValue]: true }));
  };

  const isSelected = (driver) => {
    if (mode === 'individual') return selectedDriver?.driverValue === driver.value;
    return comparisonList.some((d) => d.driverValue === driver.value && d.year === year);
  };

  const selectionOrder = (driver) => {
    if (mode !== 'h2h') return 0;
    return comparisonList.findIndex((d) => d.driverValue === driver.value && d.year === year) + 1;
  };

  const handleCardClick = (driver) => {
    if (mode === 'individual') {
      onSelect(selectedDriver?.driverValue === driver.value ? null : driver);
      return;
    }
    const existingIndex = comparisonList.findIndex(
      (d) => d.driverValue === driver.value && d.year === year
    );
    if (existingIndex >= 0) {
      onRemove(existingIndex);
    } else if (comparisonList.length < 2) {
      onSelect(driver);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar piloto o equipo..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-600/60 focus:ring-1 focus:ring-red-600/60 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-slate-500 shrink-0" />
          <div className="flex-1">
            <GenericCombobox
              options={teamOptions}
              value={teamFilter}
              onChange={setTeamFilter}
              placeholder="Filtrar por equipo"
            />
          </div>
          {teamFilter !== 'all' && (
            <button
              onClick={() => setTeamFilter('all')}
              className="text-slate-500 hover:text-red-500 transition-colors"
              title="Quitar filtro"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="min-h-[200px]">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-slate-900/40 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 py-12">
            <User className="size-8 opacity-30" />
            <p className="text-xs font-medium uppercase tracking-widest">No se encontraron pilotos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredDrivers.map((driver) => {
              const selected = isSelected(driver);
              const order = selectionOrder(driver);
              const teamColor = driver.team_color ? `#${driver.team_color}` : '#dc2626';
              const surname = getDriverSurname(driver.label || '');
              const imageUrl = buildDriverImageUrl(year, surname);
              const fallback = imageFallbacks[driver.value];

              return (
                <button
                  key={driver.value}
                  onClick={() => handleCardClick(driver)}
                  disabled={mode === 'h2h' && !selected && comparisonList.length >= 2}
                  className={`group relative h-24 rounded-xl overflow-hidden text-left transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed ${
                    selected
                      ? 'ring-2 ring-white/30 scale-[1.02]'
                      : 'hover:ring-1 hover:ring-slate-700/50 hover:scale-[1.01]'
                  }`}
                >
                  {/* Team accent background */}
                  <div
                    className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
                    style={{ background: `linear-gradient(135deg, ${teamColor}, transparent 80%)` }}
                  />
                  <div className="absolute inset-0 bg-slate-900/50" />

                  {/* Photo */}
                  {!fallback ? (
                    <img
                      src={imageUrl}
                      alt={driver.label}
                      onError={() => handleImageError(driver.value)}
                      className="absolute inset-0 w-full h-full object-cover object-top opacity-70 group-hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                      <span className="text-3xl font-black italic text-slate-700">{getInitials(driver.label)}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                  {/* Check / order badge */}
                  {selected && (
                    <div className="absolute top-2 right-2 z-20 bg-white text-slate-950 rounded-full size-5 flex items-center justify-center shadow-lg">
                      {mode === 'h2h' ? (
                        <span className="text-[10px] font-black">{order}</span>
                      ) : (
                        <Check className="size-3.5 stroke-[3]" />
                      )}
                    </div>
                  )}

                  {/* Number watermark */}
                  <div
                    className="absolute bottom-0 right-1.5 text-4xl font-black italic leading-none opacity-10 pointer-events-none select-none"
                    style={{ color: teamColor }}
                  >
                    {driver.number}
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 z-10">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: teamColor }}
                      />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 truncate">
                        {driver.team}
                      </span>
                    </div>
                    <p className="text-xs font-black uppercase italic text-white leading-tight truncate">
                      {driver.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* H2H helper */}
      {mode === 'h2h' && comparisonList.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Comparativa {comparisonList.length}/2
          </p>
          <div className="flex flex-wrap gap-2">
            {comparisonList.map((driver, idx) => (
              <div
                key={`${driver.driverValue}-${idx}`}
                className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs text-white"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: driver.team_color ? `#${driver.team_color}` : '#dc2626' }}
                />
                <span className="font-bold uppercase">{driver.driverLabel}</span>
                <button
                  onClick={() => onRemove(idx)}
                  className="text-slate-500 hover:text-red-500"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
