import { useState, useEffect, useMemo } from 'react';
import { fetchH2HData } from '@/service/apiService';
import { X, Users } from 'lucide-react';
import { toast } from 'sonner';

function buildImageUrl(year, surname) {
    const surnameNorm = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return `https://media.formula1.com/content/dam/fom-website/drivers/${year}Drivers/${surnameNorm}.jpg`;
}

function getDriverSurname(fullName) {
    const parts = fullName.split(' ');
    return parts[parts.length - 1];
}

export default function DriverH2Hcard({ drivers = [], year, onRemove }) {
    const [h2hData, setH2hData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [imageFallbacks, setImageFallbacks] = useState({});

    const [d1, d2] = [drivers[0] || null, drivers[1] || null];
    const sameYear = d1 && d2 && d1.year === d2.year;

    useEffect(() => {
        if (!sameYear) {
            setH2hData(null);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await fetchH2HData(d1.year, d1.driverValue, d2.driverValue);
                setH2hData(data);
            } catch (e) {
                console.error('Error fetching H2H:', e);
                toast('Error al cargar datos H2H.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [d1, d2, sameYear]);

    const stats = useMemo(() => {
        const s1 = { qualyWins: 0, raceAhead: 0, dnfs: 0, points: 0, wins: 0, podiums: 0 };
        const s2 = { qualyWins: 0, raceAhead: 0, dnfs: 0, points: 0, wins: 0, podiums: 0 };

        if (!h2hData?.events) return { s1, s2 };

        for (const ev of h2hData.events) {
            if (ev.driver1_qual != null && ev.driver2_qual != null) {
                if (ev.driver1_qual < ev.driver2_qual) s1.qualyWins++;
                else if (ev.driver2_qual < ev.driver1_qual) s2.qualyWins++;
            }

            if (ev.driver1_race === 'DNF') s1.dnfs++;
            if (ev.driver2_race === 'DNF') s2.dnfs++;

            const r1 = ev.driver1_race;
            const r2 = ev.driver2_race;
            if (r1 != null && r2 != null && r1 !== 'DNF' && r2 !== 'DNF') {
                if (r1 < r2) s1.raceAhead++;
                else if (r2 < r1) s2.raceAhead++;
            } else if (r1 != null && r1 !== 'DNF' && (r2 === 'DNF' || r2 == null)) {
                s1.raceAhead++;
            } else if (r2 != null && r2 !== 'DNF' && (r1 === 'DNF' || r1 == null)) {
                s2.raceAhead++;
            }

            if (r1 === 1) s1.wins++;
            if (r2 === 1) s2.wins++;
        }

        s1.points = h2hData?.driver1_season_points ?? 0;
        s2.points = h2hData?.driver2_season_points ?? 0;
        s1.podiums = h2hData?.driver1_podiums ?? 0;
        s2.podiums = h2hData?.driver2_podiums ?? 0;

        return { s1, s2 };
    }, [h2hData]);

    const handleImageError = (driverValue) => {
        setImageFallbacks((prev) => ({ ...prev, [driverValue]: true }));
    };

    const renderDriverPortrait = (driver) => {
        const surname = getDriverSurname(driver.driverLabel || '');
        const imageUrl = buildImageUrl(driver.year, surname);
        const fallback = imageFallbacks[driver.driverValue];
        const color = driver.team_color ? `#${driver.team_color}` : '#dc2626';

        return (
            <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 shadow-2xl" style={{ borderColor: color }}>
                {!fallback ? (
                    <img
                        src={imageUrl}
                        alt={driver.driverLabel}
                        onError={() => handleImageError(driver.driverValue)}
                        className="w-full h-full object-cover object-top"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 font-black italic text-2xl">
                        {driver.driverNumber}
                    </div>
                )}
            </div>
        );
    };

    const color1 = d1?.team_color ? `#${d1.team_color}` : '#dc2626';
    const color2 = d2?.team_color ? `#${d2.team_color}` : '#3b82f6';

    return (
        <div className="flex flex-col gap-6 animate-fade-in-up h-full">
            {/* Empty state */}
            {!d1 && !d2 && (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-600 border border-dashed border-slate-800 rounded-3xl bg-slate-950/50 min-h-[400px]">
                    <Users className="size-16 opacity-30" />
                    <p className="text-lg font-black uppercase tracking-widest text-slate-500">Comparativa H2H</p>
                    <p className="text-sm text-slate-600 text-center max-w-xs">Selecciona hasta dos pilotos de la misma temporada en el panel izquierdo.</p>
                </div>
            )}

            {/* One driver selected */}
            {d1 && !d2 && (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-950/50 min-h-[400px]">
                    {renderDriverPortrait(d1)}
                    <p className="text-lg font-black uppercase tracking-widest text-white">{d1.driverLabel}</p>
                    <p className="text-sm text-slate-600 text-center max-w-xs">Selecciona un segundo piloto para completar la comparativa.</p>
                </div>
            )}

            {/* Different years warning */}
            {d1 && d2 && !sameYear && (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-amber-500 border border-dashed border-amber-900/30 rounded-3xl bg-slate-950/50 min-h-[400px]">
                    <p className="text-lg font-black uppercase tracking-widest">Ambos pilotos deben ser de la misma temporada</p>
                    <p className="text-sm text-amber-500/70 text-center max-w-xs">{d1.year} ≠ {d2.year}</p>
                </div>
            )}

            {/* Full H2H */}
            {d1 && d2 && sameYear && (
                <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
                    {/* Header with portraits */}
                    <div className="relative p-6 md:p-10 bg-slate-950/80">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
                        <div className="relative flex items-center justify-between gap-4">
                            <div className="flex flex-col items-center gap-3 flex-1">
                                {renderDriverPortrait(d1)}
                                <div className="text-center">
                                    <p className="text-xl md:text-2xl font-black uppercase italic text-white">{d1.driverLabel}</p>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{d1.team}</p>
                                </div>
                                <button
                                    onClick={() => onRemove?.(0)}
                                    className="text-slate-500 hover:text-red-500 transition-colors"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-4xl md:text-6xl font-black italic text-slate-700">VS</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{year}</span>
                            </div>

                            <div className="flex flex-col items-center gap-3 flex-1">
                                {renderDriverPortrait(d2)}
                                <div className="text-center">
                                    <p className="text-xl md:text-2xl font-black uppercase italic text-white">{d2.driverLabel}</p>
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{d2.team}</p>
                                </div>
                                <button
                                    onClick={() => onRemove?.(1)}
                                    className="text-slate-500 hover:text-red-500 transition-colors"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-10 flex flex-col gap-8">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
                                <span className="ml-3 text-slate-400 text-sm font-medium">Cargando datos H2H…</span>
                            </div>
                        ) : (
                            <>
                                {/* Stat bars */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <VsBar label="Puntos temporada" left={stats.s1.points} right={stats.s2.points} colorLeft={color1} colorRight={color2} />
                                    <VsBar label="Victorias" left={stats.s1.wins} right={stats.s2.wins} colorLeft={color1} colorRight={color2} />
                                    <VsBar label="Mejor Qualy" left={stats.s1.qualyWins} right={stats.s2.qualyWins} colorLeft={color1} colorRight={color2} />
                                    <VsBar label="Terminó por delante" left={stats.s1.raceAhead} right={stats.s2.raceAhead} colorLeft={color1} colorRight={color2} />
                                    <VsBar label="Abandonos (DNF)" left={stats.s1.dnfs} right={stats.s2.dnfs} colorLeft={color1} colorRight={color2} />
                                    <VsBar label="Podios" left={stats.s1.podiums} right={stats.s2.podiums} colorLeft={color1} colorRight={color2} />
                                </div>

                                {/* Summary stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <SummaryBox label="Puntos" value={stats.s1.points} color={color1} sub={`${d1.driverLabel}`} />
                                    <SummaryBox label="Eventos" value={h2hData?.events?.length ?? 0} color="#52525b" sub={`Temporada ${year}`} />
                                    <SummaryBox label="Puntos" value={stats.s2.points} color={color2} sub={`${d2.driverLabel}`} />
                                </div>

                                <p className="text-slate-600 text-[10px] text-center uppercase tracking-widest">
                                    Basado en {h2hData?.events?.length ?? 0} eventos de la temporada {d1.year}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function VsBar({ label, left, right, colorLeft, colorRight }) {
    const total = left + right || 1;
    const pctLeft = Math.round((left / total) * 100);
    const pctRight = 100 - pctLeft;

    return (
        <div className="flex flex-col gap-2 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 hover:bg-slate-950/60 transition-colors">
            <div className="flex items-center justify-center gap-2 text-slate-500">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center">{label}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-white font-black text-xl w-10 text-right">{left}</span>
                <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-slate-800 shadow-inner">
                    <div
                        className="h-full rounded-l-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                        style={{ width: `${pctLeft}%`, backgroundColor: colorLeft }}
                    />
                    <div
                        className="h-full rounded-r-full transition-all duration-500 shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                        style={{ width: `${pctRight}%`, backgroundColor: colorRight }}
                    />
                </div>
                <span className="text-white font-black text-xl w-10 text-left">{right}</span>
            </div>
        </div>
    );
}

function SummaryBox({ label, value, color, sub }) {
    return (
        <div className="flex flex-col items-center justify-center gap-1 bg-slate-950/40 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
            <span className="text-3xl md:text-4xl font-black italic" style={{ color }}>{value}</span>
            <span className="text-[9px] text-slate-600 uppercase tracking-wider text-center truncate w-full">{sub}</span>
        </div>
    );
}
