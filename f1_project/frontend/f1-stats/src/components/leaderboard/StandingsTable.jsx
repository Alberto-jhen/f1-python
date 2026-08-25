import { useMemo } from 'react';

/** Normalize a string: strip diacritics and lowercase. */
function norm(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Map Ergast/Jolpi constructor names → F1 CDN team slugs.
 * Update when new teams appear or names change.
 */
const TEAM_SLUG = {
    'mclaren': 'mclaren',
    'red bull': 'redbullracing',
    'ferrari': 'ferrari',
    'mercedes': 'mercedes',
    'aston martin': 'astonmartin',
    'williams': 'williams',
    'alpine f1 team': 'alpine',
    'haas f1 team': 'haas',
    'rb f1 team': 'racingbulls',
    'audi': 'audi',
    'sauber': 'audi',
    'cadillac f1 team': 'cadillac',
};

function teamSlug(constructor) {
    return TEAM_SLUG[constructor?.toLowerCase()] || constructor?.toLowerCase().replace(/\s+/g, '') || '';
}

/** Build the F1 CDN driver code: first 3 chars of first name + first 3 of last name + "01". */
function driverCode(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const first = norm(parts[0]).slice(0, 3);
    const last = norm(parts[parts.length - 1]).slice(0, 3);
    return `${first}${last}01`;
}

const YEAR = new Date().getFullYear();

function buildF1ImageUrl(fullName, constructor) {
    const team = teamSlug(constructor);
    const code = driverCode(fullName);
    return `https://media.formula1.com/image/upload/c_lfill,w_64/q_auto/d_common:f1:${YEAR}:fallback:driver:${YEAR}fallbackdriverright.webp/v1740000000/common/f1/${YEAR}/${team}/${code}/${YEAR}${team}${code}right.webp`;
}

function DriverAvatar({ name, constructor }) {
    const src = useMemo(() => buildF1ImageUrl(name, constructor), [name, constructor]);

    return (
        <img
            src={src}
            alt={name}
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
                                    <DriverAvatar name={entry.driver} constructor={entry.constructor} />
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
