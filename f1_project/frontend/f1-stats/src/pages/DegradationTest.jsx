import { useState, useEffect } from 'react';
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
import { GenericCombobox } from '@/components/GenericComobobox';
import { fetchDegradationPrediction, fetchYearSchedule, fetchDriversFullNamesByYear } from '../service/apiService.js';

const formatLapTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

export const DegradationTest = () => {
    const [year, setYear] = useState(2025);
    const [track, setTrack] = useState('');
    const [driver, setDriver] = useState('');
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [trackOptions, setTrackOptions] = useState([]);
    const [driverOptions, setDriverOptions] = useState([]);
    const [isLoadingTracks, setIsLoadingTracks] = useState(false);
    const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);

    const yearOptions = [
        { label: '2026', value: 2026 },
        { label: '2025', value: 2025 },
        { label: '2024', value: 2024 },
        { label: '2023', value: 2023 },
        { label: '2022', value: 2022 },
        { label: '2021', value: 2021 },
        { label: '2020', value: 2020 },
        { label: '2019', value: 2019 },
        { label: '2018', value: 2018 },
    ];

    // Load the race calendar for the selected year, then reset the dependent fields.
    useEffect(() => {
        const loadTracks = async () => {
            if (year) {
                setIsLoadingTracks(true);
                try {
                    const schedule = await fetchYearSchedule(year);
                    setTrackOptions(schedule.tracks.map((trackName) => ({ label: trackName, value: trackName })));
                } catch (err) {
                    console.error('Error loading tracks:', err);
                    setTrackOptions([]);
                } finally {
                    setIsLoadingTracks(false);
                }
            } else {
                setTrackOptions([]);
            }
            setTrack('');
            setDriver('');
        };

        loadTracks();
    }, [year]);

    // Load the race entry list for the selected year and track, then reset the driver.
    useEffect(() => {
        const loadDrivers = async () => {
            if (year && track) {
                setIsLoadingDrivers(true);
                try {
                    const data = await fetchDriversFullNamesByYear(year, track, 'R');
                    setDriverOptions(data);
                } catch (err) {
                    console.error('Error loading drivers:', err);
                    setDriverOptions([]);
                } finally {
                    setIsLoadingDrivers(false);
                }
            } else {
                setDriverOptions([]);
            }
            setDriver('');
        };

        loadDrivers();
    }, [year, track]);

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
                <div className="mb-8 border-l-4 border-red-600 pl-4">
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

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="w-full md:w-1/4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                            Temporada
                        </label>
                        <GenericCombobox
                            options={yearOptions}
                            value={year}
                            onChange={setYear}
                            placeholder="Selecciona año"
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                            Circuito
                        </label>
                        <GenericCombobox
                            options={trackOptions}
                            value={track}
                            onChange={setTrack}
                            placeholder={isLoadingTracks ? 'Cargando circuitos...' : 'Selecciona circuito'}
                            disabled={!year || isLoadingTracks}
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">
                            Piloto
                        </label>
                        <GenericCombobox
                            options={driverOptions}
                            value={driver}
                            onChange={setDriver}
                            placeholder={isLoadingDrivers ? 'Cargando pilotos...' : 'Selecciona piloto'}
                            disabled={!track || isLoadingDrivers}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleLoad}
                            disabled={loading || !year || !track || !driver}
                            className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold uppercase rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            {loading ? 'Cargando...' : 'Cargar stint'}
                        </button>
                    </div>
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
