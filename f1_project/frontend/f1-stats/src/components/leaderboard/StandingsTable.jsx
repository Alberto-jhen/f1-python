import { useState } from 'react';

const F1_IMAGE_YEARS = [2025, 2024];

function driverSurname(fullName) {
    return fullName
        .trim()
        .split(/\s+/)
        .pop()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function DriverAvatar({ name }) {
    const surname = driverSurname(name);
    const [yearIdx, setYearIdx] = useState(0);
    const [failed, setFailed] = useState(false);

    const handleError = () => {
        if (yearIdx + 1 < F1_IMAGE_YEARS.length) {
            setYearIdx(prev => prev + 1);
        } else {
            setFailed(true);
        }
    };

    if (failed) {
        return (
            <span className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase shrink-0">
                {name.charAt(0)}
            </span>
        );
    }

    return (
        <img
            src={`https://media.formula1.com/content/dam/fom-website/drivers/${F1_IMAGE_YEARS[yearIdx]}Drivers/${surname}.jpg`}
            alt={name}
            onError={handleError}
            className="w-7 h-7 rounded-full object-cover object-top shrink-0 bg-zinc-800"
        />
    );
}

/**
 * Props:
 * - standings: [{ position, driver, constructor, points, diff?, racePoints? }]
 * - loading: boolean
 * - showDiff: boolean (show the diff column for predictions)
 * - showRacePoints: boolean (show points earned at selected race)
 */
export default function StandingsTable({ standings = [], loading = false, showDiff = false, showRacePoints = false }) {
    if (loading) {
        return (
            <div className="space-y-3 mt-6">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-12 bg-zinc-800/50 rounded-lg animate-pulse"></div>
                ))}
            </div>
        );
    }

    if (!standings.length) {
        return (
            <div className="text-center py-12 text-zinc-500 font-medium">
                No hay datos de clasificación disponibles.
            </div>
        );
    }

    return (
        <div className="mt-6 overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                        <th className="py-3 px-3 text-left w-12">Pos</th>
                        <th className="py-3 px-3 text-left">Piloto</th>
                        <th className="py-3 px-3 text-left hidden md:table-cell">Constructor</th>
                        <th className="py-3 px-3 text-right">Puntos</th>
                        {showRacePoints && <th className="py-3 px-3 text-right">Carrera</th>}
                        {showDiff && <th className="py-3 px-3 text-right w-20">Dif</th>}
                    </tr>
                </thead>
                <tbody>
                    {standings.map((entry, i) => (
                        <tr
                            key={entry.driver}
                            className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors group"
                        >
                            {/* Position */}
                            <td className="py-3 px-3">
                                <span className={`font-black italic text-base ${
                                    i === 0 ? 'text-yellow-500' :
                                    i === 1 ? 'text-zinc-300' :
                                    i === 2 ? 'text-amber-700' :
                                    'text-zinc-500'
                                }`}>
                                    {entry.position}
                                </span>
                            </td>

                            {/* Driver */}
                            <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                    <DriverAvatar name={entry.driver} />
                                    <span className="text-white font-bold text-sm uppercase tracking-tight group-hover:text-red-500 transition-colors">
                                        {entry.driver}
                                    </span>
                                </div>
                            </td>

                            {/* Constructor */}
                            <td className="py-3 px-3 hidden md:table-cell">
                                <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
                                    {entry.constructor}
                                </span>
                            </td>

                            {/* Points */}
                            <td className="py-3 px-3 text-right">
                                <span className="text-white font-black italic text-sm">
                                    {entry.points}
                                </span>
                            </td>

                            {/* Race-specific points */}
                            {showRacePoints && (
                                <td className="py-3 px-3 text-right">
                                    <span className={`text-xs font-bold ${
                                        entry.racePoints > 0 ? 'text-green-400' : 'text-zinc-600'
                                    }`}>
                                        {entry.racePoints > 0 ? `+${entry.racePoints}` : '—'}
                                    </span>
                                </td>
                            )}

                            {/* Diff (prediction) */}
                            {showDiff && (
                                <td className="py-3 px-3 text-right">
                                    {entry.diff > 0 ? (
                                        <span className="text-green-400 text-xs font-bold">+{entry.diff}</span>
                                    ) : entry.diff === 0 || entry.diff == null ? (
                                        <span className="text-zinc-600 text-xs">—</span>
                                    ) : (
                                        <span className="text-red-400 text-xs font-bold">{entry.diff}</span>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
