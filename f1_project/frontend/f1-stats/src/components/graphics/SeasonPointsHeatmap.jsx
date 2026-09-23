import React, { useMemo } from 'react';

const getHeatmapColor = (value, max) => {
    if (max === 0) return 'rgb(30, 41, 59)';
    const ratio = value / max;
    // Blue scale: light slate -> deep blue
    const r = Math.round(30 + (59 - 30) * ratio);
    const g = Math.round(41 + (130 - 41) * ratio);
    const b = Math.round(59 + (246 - 59) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
};

const getTextColor = (value, max) => {
    if (max === 0) return '#94a3b8';
    return value / max > 0.5 ? '#ffffff' : '#e2e8f0';
};

export const SeasonPointsHeatmap = ({ data }) => {
    const maxPoints = useMemo(() => {
        if (!data || !data.points) return 0;
        return Math.max(...data.points.flat().map(Number), 0);
    }, [data]);

    const isValid = data && Array.isArray(data.drivers) && Array.isArray(data.races) && Array.isArray(data.points);

    if (!isValid) {
        return (
            <div className="text-slate-400 text-sm">
                <p className="font-bold mb-2">No se pudieron pintar los datos del heatmap.</p>
                <pre className="text-xs bg-slate-900 p-2 rounded border border-slate-800 overflow-auto max-h-40">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        );
    }

    const { drivers, races, points } = data;

    return (
        <div className="w-full min-h-[24rem] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-white font-bold uppercase text-sm tracking-widest">
                    Puntos por carrera - Temporada {data.year || ''}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>0</span>
                    <div
                        className="w-24 h-3 rounded"
                        style={{
                            background: 'linear-gradient(to right, rgb(30,41,59), rgb(30,59,130), rgb(30,100,200), rgb(30,130,246))',
                        }}
                    />
                    <span>{maxPoints}</span>
                </div>
            </div>

            <div className="overflow-x-auto flex-1 min-h-0">
                <table className="border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-10 bg-slate-900 p-2 text-left text-xs font-bold text-slate-300 uppercase tracking-wider border border-slate-800">
                                Driver
                            </th>
                            {races.map((race, idx) => (
                                <th
                                    key={idx}
                                    className="p-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider border border-slate-800 min-w-[3.5rem]"
                                >
                                    <div className="transform -rotate-45 origin-bottom-left translate-x-2 whitespace-nowrap">
                                        {race}
                                    </div>
                                </th>
                            ))}
                            <th className="p-2 text-center text-xs font-bold text-slate-300 uppercase tracking-wider border border-slate-800 min-w-[4rem]">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {drivers.map((driver, driverIdx) => {
                            const row = points[driverIdx] || [];
                            const total = row.reduce((sum, val) => sum + Number(val || 0), 0);
                            return (
                                <tr key={driverIdx}>
                                    <td className="sticky left-0 z-10 bg-slate-900 p-2 text-xs font-black text-white uppercase border border-slate-800">
                                        {driver}
                                    </td>
                                    {races.map((race, raceIdx) => {
                                        const value = Number(row[raceIdx] || 0);
                                        return (
                                            <td
                                                key={raceIdx}
                                                className="p-0 text-center text-[10px] font-bold border border-slate-800 cursor-help transition-transform hover:scale-110"
                                                style={{
                                                    backgroundColor: getHeatmapColor(value, maxPoints),
                                                    color: getTextColor(value, maxPoints),
                                                }}
                                                title={`${driver} - ${race}: ${value} pts`}
                                            >
                                                <div className="w-10 h-8 flex items-center justify-center">
                                                    {value}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 text-center text-xs font-black text-white border border-slate-800 bg-slate-800">
                                        {total}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
