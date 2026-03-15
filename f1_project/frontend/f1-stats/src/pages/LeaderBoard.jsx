import { useState, useEffect, useMemo } from 'react';
import {
    fetchYearSchedule,
    fetchEventRaceDate,
    fetchGlobalStandings,
    fetchStandingsByRound,
    fetchDriversFullNamesByYear,
} from '@/service/apiService';
import RaceTimeline from '@/components/leaderboard/RaceTimeline';
import StandingsTable from '@/components/leaderboard/StandingsTable';
import PredictionMode from '@/components/leaderboard/PredictionMode';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Normalize raw standings array from API into our internal format.
 * API shape: { posicion, puntos, victorias, piloto, constructor }
 */
function normalizeStandings(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((s, i) => ({
        position: Number(s.posicion ?? i + 1),
        driver: s.piloto,
        constructor: s.constructor,
        points: Number(s.puntos),
        wins: Number(s.victorias ?? 0),
    }));
}

/** Strip diacritics and lowercase for fuzzy name matching. */
function normalizeName(name) {
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Get the last word (surname) of a name. */
function surname(name) {
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1];
}

export default function LeaderBoard() {
    const [activeTab, setActiveTab] = useState('clasificacion');
    const [selectedRaceIndex, setSelectedRaceIndex] = useState(-1);

    const [raceCalendar, setRaceCalendar] = useState([]);
    const [raceDates, setRaceDates] = useState({});
    const [sprintEvents, setSprintEvents] = useState(new Set());

    // Standings state
    const [standings, setStandings] = useState([]);          // cumulative up to selected round
    const [racePoints, setRacePoints] = useState({});        // { driverName: points } for selected race
    const [loadingStandings, setLoadingStandings] = useState(true);

    // ---- Load schedule + dates on mount ----
    useEffect(() => {
        const loadSchedule = async () => {
            try {
                const scheduleData = await fetchYearSchedule(CURRENT_YEAR);
                let formattedTracks = [];
                if (scheduleData?.tracks) {
                    formattedTracks = scheduleData.tracks
                        .filter(track => track !== "Pre-Season Testing")
                        .map(track => ({
                            label: track.substring(0, 3).toUpperCase(),
                            value: track,
                        }));
                    setRaceCalendar(formattedTracks);
                }
                if (scheduleData?.sprint_events) {
                    setSprintEvents(new Set(scheduleData.sprint_events));
                }

                const dateResults = await Promise.all(
                    formattedTracks.map(track => fetchEventRaceDate(CURRENT_YEAR, track.value))
                );
                const datesMap = {};
                dateResults.forEach((result) => {
                    if (result?.event && result?.date) {
                        datesMap[result.event] = result.date;
                    }
                });
                setRaceDates(datesMap);
            } catch (error) {
                console.error("Error cargando el calendario", error);
            }
        };
        loadSchedule();
    }, []);

    // ---- Compute lastCompletedIndex from raceDates ----
    const lastCompletedIndex = useMemo(() => {
        const now = new Date();
        let last = -1;
        for (let i = 0; i < raceCalendar.length; i++) {
            const dateStr = raceDates[raceCalendar[i].value];
            if (dateStr && new Date(dateStr) < now) last = i;
        }
        return last;
    }, [raceCalendar, raceDates]);

    // ---- Auto-select last completed race on first load ----
    useEffect(() => {
        if (selectedRaceIndex === -1 && lastCompletedIndex >= 0) {
            setSelectedRaceIndex(lastCompletedIndex);
        }
    }, [lastCompletedIndex]);

    // ---- Fetch standings when selectedRaceIndex changes ----
    useEffect(() => {
        if (selectedRaceIndex < 0 || !raceCalendar.length) return;

        const round = selectedRaceIndex + 1; // Ergast rounds are 1-indexed
        const eventName = raceCalendar[selectedRaceIndex]?.value;

        const loadStandings = async () => {
            setLoadingStandings(true);
            try {
                // Fetch cumulative standings up to this round
                const [roundData, driversData] = await Promise.all([
                    fetchStandingsByRound(CURRENT_YEAR, round),
                    fetchDriversFullNamesByYear(CURRENT_YEAR, eventName, 'R').catch(() => []),
                ]);

                setStandings(normalizeStandings(roundData));

                // Build per-race points map from fastf1 driver data
                const rp = {};
                if (Array.isArray(driversData)) {
                    driversData.forEach(d => {
                        rp[d.label] = Number(d.points) || 0;
                    });
                }
                setRacePoints(rp);
            } catch (error) {
                console.error("Error cargando standings por ronda", error);
            } finally {
                setLoadingStandings(false);
            }
        };
        loadStandings();
    }, [selectedRaceIndex, raceCalendar]);

    // ---- Merge race-specific points into standings ----
    const standingsWithRacePoints = useMemo(() => {
        if (!standings.length) return standings;
        const rpKeys = Object.keys(racePoints);
        if (!rpKeys.length) return standings;

        // Build lookup maps: normalized name → points, surname → points
        const byNorm = {};
        const bySurname = {};
        rpKeys.forEach(name => {
            byNorm[normalizeName(name)] = racePoints[name];
            bySurname[normalizeName(surname(name))] = racePoints[name];
        });

        return standings.map(s => {
            // Try: exact → normalized full name → normalized surname
            const pts = racePoints[s.driver]
                ?? byNorm[normalizeName(s.driver)]
                ?? bySurname[normalizeName(surname(s.driver))]
                ?? 0;
            return { ...s, racePoints: pts };
        });
    }, [standings, racePoints]);

    const showRacePoints = Object.keys(racePoints).length > 0;

    // ---- Next race ----
    const nextRace = useMemo(() => {
        if (!raceCalendar.length || !Object.keys(raceDates).length) return null;
        const now = new Date();
        for (let i = 0; i < raceCalendar.length; i++) {
            const dateStr = raceDates[raceCalendar[i].value];
            if (!dateStr) continue;
            if (new Date(dateStr) > now) {
                return { name: raceCalendar[i].value, date: new Date(dateStr), round: i + 1 };
            }
        }
        return null;
    }, [raceCalendar, raceDates]);

    const tabs = [
        { key: 'clasificacion', label: 'Clasificación' },
        { key: 'prediccion', label: 'Predicción' },
    ];

    return (
        <div className="p-6 w-full max-w-7xl mx-auto font-sans">

            {/* Next race subtle banner */}
            {nextRace && (
                <div className="mb-6 flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-2.5 w-fit">
                    <span className="bg-red-600 w-2 h-2 rounded-full animate-pulse shrink-0"></span>
                    <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">
                        Próxima carrera
                    </span>
                    <span className="text-sm text-white font-black italic uppercase tracking-tight">
                        {nextRace.name}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium">
                        {nextRace.date.toLocaleString(undefined, {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
                        })}
                    </span>
                </div>
            )}

            {/* Header + tab toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div className="border-l-4 border-red-600 pl-4">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">
                        Clasificación Mundial
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 font-medium">
                        Visualiza la evolución y haz tu propia predicción del campeonato.
                    </p>
                </div>

                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800 shrink-0">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-2 rounded-md font-black uppercase tracking-widest text-xs transition-all ${
                                activeTab === tab.key
                                    ? 'bg-white text-black shadow-sm'
                                    : 'bg-transparent text-zinc-500 hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clasificación tab */}
            {activeTab === 'clasificacion' && (
                <div className="space-y-6">
                    <RaceTimeline
                        raceCalendar={raceCalendar}
                        raceDates={raceDates}
                        selectedIndex={selectedRaceIndex}
                        onSelect={setSelectedRaceIndex}
                        lastCompletedIndex={lastCompletedIndex}
                        lockedFutureRaces
                    />

                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6 md:p-8">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-1">
                            Clasificación de pilotos
                        </h3>
                        <p className="text-[11px] text-zinc-600">
                            Temporada {CURRENT_YEAR}
                            {selectedRaceIndex >= 0 && raceCalendar[selectedRaceIndex]
                                ? ` — Acumulado hasta ${raceCalendar[selectedRaceIndex].value} (R${selectedRaceIndex + 1})`
                                : ''}
                        </p>

                        <div className="flex items-start gap-2 mt-3 mb-1 bg-yellow-500/5 border border-yellow-600/20 rounded-lg px-3 py-2">
                            <span className="text-yellow-500 text-xs mt-0.5">⚠</span>
                            <p className="text-[11px] text-yellow-600/80 leading-relaxed">
                                Los puntos de las carreras sprint se actualizan junto con los resultados de la carrera principal del Gran Premio.
                            </p>
                        </div>

                        <StandingsTable
                            standings={standingsWithRacePoints}
                            loading={loadingStandings}
                            showRacePoints={showRacePoints}
                        />
                    </div>
                </div>
            )}

            {/* Predicción tab */}
            {activeTab === 'prediccion' && (
                <PredictionMode
                    currentStandings={standings}
                    raceCalendar={raceCalendar}
                    raceDates={raceDates}
                    lastCompletedIndex={lastCompletedIndex}
                    sprintEvents={sprintEvents}
                />
            )}
        </div>
    );
}
