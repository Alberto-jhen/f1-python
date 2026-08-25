import { useState, useMemo, useCallback } from 'react';
import RaceTimeline from './RaceTimeline';
import StandingsTable from './StandingsTable';

const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

function DriverOrderList({ order, onMove, pointsTable }) {
    return (
        <div className="space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
            {order.map((entry, i) => {
                const pts = i < pointsTable.length ? pointsTable[i] : 0;
                return (
                    <div
                        key={entry.driver}
                        className="flex items-center gap-2 bg-zinc-800/40 hover:bg-zinc-800/70 rounded-lg px-3 py-2 transition-colors group"
                    >
                        <span className={`w-6 text-center font-black italic text-sm ${
                            i === 0 ? 'text-yellow-500' :
                            i === 1 ? 'text-zinc-300' :
                            i === 2 ? 'text-amber-700' :
                            'text-zinc-600'
                        }`}>
                            {i + 1}
                        </span>
                        <span className="text-white text-sm font-bold uppercase tracking-tight flex-1">
                            {entry.driver}
                        </span>
                        {pts > 0 && (
                            <span className="text-green-400 text-[10px] font-bold mr-2">
                                +{pts}
                            </span>
                        )}
                        <div className="flex flex-col gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => onMove(i, -1)}
                                disabled={i === 0}
                                className="text-zinc-400 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => onMove(i, 1)}
                                disabled={i === order.length - 1}
                                className="text-zinc-400 hover:text-white disabled:opacity-20 text-xs leading-none px-1"
                            >
                                ▼
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Props:
 * - currentStandings: [{ position, driver, constructor, points }] (real standings)
 * - raceCalendar, raceDates, lastCompletedIndex: for timeline
 * - sprintEvents: Set<string> (event names that have sprint)
 */
export default function PredictionMode({ currentStandings, raceCalendar, raceDates, lastCompletedIndex, sprintEvents = new Set() }) {
    const firstFutureIndex = lastCompletedIndex + 1;
    const [selectedRace, setSelectedRace] = useState(
        firstFutureIndex < raceCalendar.length ? firstFutureIndex : -1
    );

    const isSprint = selectedRace >= 0 && sprintEvents.has(raceCalendar[selectedRace]?.value);

    // Prediction sub-tab for sprint weekends
    const [predictionTab, setPredictionTab] = useState('race');

    const initOrder = () => currentStandings.map(s => ({ driver: s.driver, constructor: s.constructor }));

    const [raceOrder, setRaceOrder] = useState(initOrder);
    const [sprintOrder, setSprintOrder] = useState(initOrder);

    const makeMover = useCallback((setter, length) => (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= length) return;
        setter(prev => {
            const next = [...prev];
            [next[index], next[newIndex]] = [next[newIndex], next[index]];
            return next;
        });
    }, []);

    const moveRace = useMemo(() => makeMover(setRaceOrder, raceOrder.length), [makeMover, raceOrder.length]);
    const moveSprint = useMemo(() => makeMover(setSprintOrder, sprintOrder.length), [makeMover, sprintOrder.length]);

    // Compute predicted standings (race + sprint if applicable)
    const predictedStandings = useMemo(() => {
        if (selectedRace === -1) return [];

        const pointsMap = {};
        currentStandings.forEach(s => {
            pointsMap[s.driver] = Number(s.points);
        });

        // Race points
        const diffMap = {};
        raceOrder.forEach((entry, i) => {
            const pts = i < RACE_POINTS.length ? RACE_POINTS[i] : 0;
            diffMap[entry.driver] = pts;
            pointsMap[entry.driver] = (pointsMap[entry.driver] || 0) + pts;
        });

        // Sprint points (only for sprint weekends)
        if (isSprint) {
            sprintOrder.forEach((entry, i) => {
                const pts = i < SPRINT_POINTS.length ? SPRINT_POINTS[i] : 0;
                diffMap[entry.driver] = (diffMap[entry.driver] || 0) + pts;
                pointsMap[entry.driver] = (pointsMap[entry.driver] || 0) + pts;
            });
        }

        return Object.entries(pointsMap)
            .map(([driver, points]) => {
                const original = currentStandings.find(s => s.driver === driver);
                return {
                    driver,
                    constructor: original?.constructor || '',
                    points,
                    diff: diffMap[driver] || 0,
                };
            })
            .sort((a, b) => b.points - a.points)
            .map((entry, i) => ({ ...entry, position: i + 1 }));
    }, [currentStandings, raceOrder, sprintOrder, selectedRace, isSprint]);

    const handleRaceSelect = (index) => {
        if (index !== firstFutureIndex) return;
        setSelectedRace(index);
        const fresh = currentStandings.map(s => ({ driver: s.driver, constructor: s.constructor }));
        setRaceOrder(fresh);
        setSprintOrder([...fresh]);
        setPredictionTab('race');
    };

    const predictionTabs = isSprint
        ? [{ key: 'sprint', label: 'Sprint' }, { key: 'race', label: 'Carrera' }]
        : [{ key: 'race', label: 'Carrera' }];

    return (
        <div className="space-y-6">
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
                    {/* Left: prediction ordering */}
                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400">
                                Tu predicción
                            </h3>
                            {isSprint && (
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-600/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded">
                                    Sprint Weekend
                                </span>
                            )}
                        </div>
                        <p className="text-[11px] text-zinc-600 mb-4">
                            {raceCalendar[selectedRace]?.value} — Ordena los pilotos con las flechas
                        </p>

                        {/* Sub-tabs for sprint weekends */}
                        {isSprint && (
                            <div className="flex bg-zinc-800/50 rounded-lg p-0.5 mb-4 border border-zinc-700/50">
                                {predictionTabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setPredictionTab(tab.key)}
                                        className={`flex-1 px-4 py-1.5 rounded-md font-bold uppercase tracking-widest text-[10px] transition-all ${
                                            predictionTab === tab.key
                                                ? tab.key === 'sprint'
                                                    ? 'bg-purple-600 text-white shadow-sm'
                                                    : 'bg-white text-black shadow-sm'
                                                : 'bg-transparent text-zinc-500 hover:text-white'
                                        }`}
                                    >
                                        {tab.label}
                                        <span className="ml-1.5 text-[8px] opacity-60">
                                            {tab.key === 'sprint' ? '(Top 8)' : '(Top 10)'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {predictionTab === 'sprint' && isSprint ? (
                            <DriverOrderList
                                order={sprintOrder}
                                onMove={moveSprint}
                                pointsTable={SPRINT_POINTS}
                            />
                        ) : (
                            <DriverOrderList
                                order={raceOrder}
                                onMove={moveRace}
                                pointsTable={RACE_POINTS}
                            />
                        )}
                    </div>

                    {/* Right: predicted standings */}
                    <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-1">
                            Clasificación predicha
                        </h3>
                        <p className="text-[11px] text-zinc-600 mb-2">
                            Standings actuales + puntos de tu predicción
                            {isSprint && ' (sprint + carrera)'}
                        </p>
                        <StandingsTable standings={predictedStandings} showDiff />
                    </div>
                </div>
            )}
        </div>
    );
}
