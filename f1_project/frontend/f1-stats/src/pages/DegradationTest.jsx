import { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { fetchDegradationPrediction } from '../service/apiService.js';

const formatLapTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

export const DegradationTest = () => {
    const [year, setYear] = useState(2025);
    const [track, setTrack] = useState('Monza');
    const [driver, setDriver] = useState('VER');
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLoad = async () => {
        setLoading(true);
        setError(null);
        setChartData(null);

        try {
            const response = await fetchDegradationPrediction(year, track, driver);
            const combined = response.real.map((point, index) => ({
                x: point.x,
                real: point.y,
                predicted: response.predicted[index]?.y ?? null,
            }));
            setChartData(combined);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 bg-slate-950 text-white">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-red-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                            ML Test
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                        Degradación de <span className="text-red-600">Neumáticos</span>
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                        Compara el stint real limpio contra la curva teórica predicha por el modelo.
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        placeholder="Año"
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-red-600 transition-colors"
                    />
                    <input
                        type="text"
                        value={track}
                        onChange={(e) => setTrack(e.target.value)}
                        placeholder="Circuito (ej. Monza)"
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-red-600 transition-colors"
                    />
                    <input
                        type="text"
                        value={driver}
                        onChange={(e) => setDriver(e.target.value.toUpperCase())}
                        placeholder="Piloto (ej. VER)"
                        className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-red-600 transition-colors uppercase"
                    />
                    <button
                        onClick={handleLoad}
                        disabled={loading}
                        className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold uppercase rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                        {loading ? 'Cargando...' : 'Cargar stint'}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {chartData && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    dataKey="x"
                                    stroke="#94a3b8"
                                    label={{ value: 'TyreLife (vueltas del neumático)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    stroke="#94a3b8"
                                    domain={['auto', 'auto']}
                                    tickFormatter={formatLapTime}
                                    label={{ value: 'Lap Time', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                                    formatter={(value) => [formatLapTime(value), 'Tiempo']}
                                    labelFormatter={(label) => `TyreLife: ${label}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="real"
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name="Real (limpio)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#38bdf8"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name="Predicción teórica"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};
