import { useState, useMemo, useCallback } from 'react';
import RaceTimeline from './RaceTimeline';
import StandingsTable from './StandingsTable';

const F1_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

/**
 * Props:
 * - currentStandings: [{ position, driver, constructor, points }] (real standings)
 * - raceCalendar, raceDates, lastCompletedIndex: for timeline
 */
export default function PredictionMode({ currentStandings, raceCalendar, raceDates, lastCompletedIndex }) {
    const firstFutureIndex = lastCompletedIndex + 1;
    const [selectedRace, setSelectedRace] = useState(
        firstFutureIndex < raceCalendar.length ? firstFutureIndex : -1
    );

    // Initialize prediction order from current standings
    const [predictionOrder, setPredictionOrder] = useState(() =>
        currentStandings.map(s => ({ driver: s.driver, constructor: s.constructor }))
    );

    const moveDriver = useCallback((index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= predictionOrder.length) return;
        setPredictionOrder(prev => {
            const next = [...prev];
            [next[index], next[newIndex]] = [next[newIndex], next[index]];
            return next;
        });
    }, [predictionOrder.length]);

    // Compute predicted standings
    const predictedStandings = useMemo(() => {
        if (selectedRace === -1) return [];

        // Build a map of current points
        const pointsMap = {};
        currentStandings.forEach(s => {
            pointsMap[s.driver] = Number(s.points);
        });

        // Add predicted race points
        const racePointsMap = {};
        predictionOrder.forEach((entry, i) => {
            const pts = i < F1_POINTS.length ? F1_POINTS[i] : 0;
            racePointsMap[entry.driver] = pts;
            pointsMap[entry.driver] = (pointsMap[entry.driver] || 0) + pts;
        });

        // Build sorted standings
        const result = Object.entries(pointsMap)
            .map(([driver, points]) => {
                const original = currentStandings.find(s => s.driver === driver);
                return {
                    driver,
                    constructor: original?.constructor || '',
                    points,
                    diff: racePointsMap[driver] || 0,
                };
            })
            .sort((a, b) => b.points - a.points)
            .map((entry, i) => ({ ...entry, position: i + 1 }));

        return result;
    }, [currentStandings, predictionOrder, selectedRace]);

    const handleRaceSelect = (index) => {
        if (index !== firstFutureIndex) return; // Only the immediately next race
        setSelectedRace(index);
        // Reset prediction order when changing race
        setPredictionOrder(currentStandings.map(s => ({ driver: s.driver, constructor: s.constructor })));
    };

    return (
        <div className="space-y-6">
            {/* Timeline — only future races clickable */}
            <RaceTimeline
                raceCalendar={raceCalendar}
                raceDates={raceDates}
                selectedIndex={selectedRace}
                onSelect={handleRaceSelect}
                lastCompletedIndex={lastCompletedIndex}
                lockedFutureRaces={false}
                allowedFutureIndex={firstFutureIndex}
            />

            {selectedRace === -1 ? (
                <div className="text-center py-12 text-zinc-500 font-medium">
                    Selecciona una carrera futura en el timeline para hacer tu predicción.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: drag/reorder list */}
                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-1">
                            Tu predicción
                        </h3>
                        <p className="text-[11px] text-zinc-600 mb-4">
                            {raceCalendar[selectedRace]?.value} — Ordena los pilotos con las flechas
                        </p>

                        <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                            {predictionOrder.map((entry, i) => {
                                const pts = i < F1_POINTS.length ? F1_POINTS[i] : 0;
                                return (
                                    <div
                                        key={entry.driver}
                                        className="flex items-center gap-2 bg-zinc-800/40 hover:bg-zinc-800/70 rounded-lg px-3 py-2 transition-colors group"
                                    >
                                        {/* Position number */}
                                        <span className={`w-6 text-center font-black italic text-sm ${
                                            i === 0 ? 'text-yellow-500' :
                                            i === 1 ? 'text-zinc-300' :
                                            i === 2 ? 'text-amber-700' :
                                            'text-zinc-600'
                                        }`}>
                                            {i + 1}
                                        </span>

                                        {/* Driver name */}
                                        <span className="text-white text-sm font-bold uppercase tracking-tight flex-1">
                                            {entry.driver}
                                        </span>

                                        {/* Points to earn */}
                                        {pts > 0 && (
                                            <span className="text-green-400 text-[10px] font-bold mr-2">
                                                +{pts}
                                            </span>
                                        )}

                                        {/* Up/Down buttons */}
                                        <div className="flex flex-col gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => moveDriver(i, -1)}
                                                disabled={i === 0}
                                                className="text-zinc-400 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                                            >
                                                ▲
                                            </button>
                                            <button
                                                onClick={() => moveDriver(i, 1)}
                                                disabled={i === predictionOrder.length - 1}
                                                className="text-zinc-400 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                                            >
                                                ▼
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: predicted standings */}
                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-1">
                            Clasificación predicha
                        </h3>
                        <p className="text-[11px] text-zinc-600 mb-2">
                            Standings actuales + puntos de tu predicción
                        </p>
                        <div className="flex items-start gap-2 mt-3 mb-1 bg-yellow-500/5 border border-yellow-600/20 rounded-lg px-3 py-2">
                            <span className="text-yellow-500 text-xs mt-0.5">⚠</span>
                            <p className="text-[11px] text-yellow-600/80 leading-relaxed">
                                Los puntos de las carreras sprint se actualizan junto con los resultados de la carrera principal del Gran Premio.
                            </p>
                        </div>
                        <StandingsTable standings={predictedStandings} showDiff />
                    </div>
                </div>
            )}
        </div>
    );
}
