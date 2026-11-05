import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchSeasonForecast } from '@/service/apiService.ts';

function asNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function formatNumber(value, maximumFractionDigits = 0) {
    const number = asNumber(value);
    if (number === null) return '—';
    return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(number);
}

function formatPoints(value) {
    return formatNumber(value, 1);
}

function formatProbability(value) {
    const number = asNumber(value);
    if (number === null) return '—';
    const percentage = Math.abs(number) <= 1 ? number * 100 : number;
    return `${new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(percentage)}%`;
}


function RefreshButton({ busy, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={busy}
            aria-label={busy ? 'Actualizando proyección' : 'Actualizar proyección'}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/70 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800 hover:text-white disabled:cursor-wait disabled:opacity-60"
        >
            <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>{busy ? 'Actualizando' : 'Actualizar'}</span>
        </button>
    );
}


function ForecastTable({ standings = [], year }) {
    const orderedStandings = [...standings].sort(
        (a, b) => (asNumber(a.position) ?? Number.MAX_SAFE_INTEGER)
            - (asNumber(b.position) ?? Number.MAX_SAFE_INTEGER)
    );

    return (
        <div className="mt-5 overflow-x-auto rounded-xl border border-zinc-800/80">
            <table className="w-full min-w-[780px]" aria-label={`Proyección final de la temporada ${year}`}>
                <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/50 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        <th scope="col" className="px-3 py-3 text-center">Posición prevista</th>
                        <th scope="col" className="px-3 py-3 text-center">Posición actual</th>
                        <th scope="col" className="px-3 py-3 text-left">Piloto</th>
                        <th scope="col" className="px-3 py-3 text-left">Equipo</th>
                        <th scope="col" className="px-3 py-3 text-right">Puntos actuales</th>
                        <th scope="col" className="px-3 py-3 text-right">Puntos finales estimados</th>
                        <th scope="col" className="px-3 py-3 text-right">Probabilidad de ser campeón</th>
                    </tr>
                </thead>
                <tbody>
                    {orderedStandings.map((entry, index) => (
                        <tr
                            key={`${entry.driver}-${entry.constructor}-${entry.position ?? index}`}
                            className="border-b border-zinc-800/50 last:border-b-0 transition-colors hover:bg-zinc-800/30"
                        >
                            <td className="px-3 py-3 text-center">
                                <span className={`text-sm font-black italic ${
                                    index === 0 ? 'text-yellow-500' :
                                    index === 1 ? 'text-zinc-300' :
                                    index === 2 ? 'text-amber-700' :
                                    'text-zinc-500'
                                }`}>
                                    {formatNumber(entry.position)}
                                </span>
                            </td>
                            <td className="px-3 py-3 text-center text-xs font-semibold text-zinc-500">
                                {formatNumber(entry.current_position)}
                            </td>
                            <td className="px-3 py-3">
                                <span className="text-sm font-bold uppercase tracking-tight text-white">
                                    {entry.driver || '—'}
                                </span>
                            </td>
                            <td className="px-3 py-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                                {entry.constructor || '—'}
                            </td>
                            <td className="px-3 py-3 text-right text-sm font-semibold text-zinc-300">
                                {formatPoints(entry.current_points)}
                            </td>
                            <td className="px-3 py-3 text-right text-sm font-black italic text-white">
                                {formatPoints(entry.expected_final_points)}
                            </td>
                            <td className="px-3 py-3 text-right text-sm font-black text-red-400">
                                {formatProbability(entry.championship_probability)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function SeasonForecast({ year = new Date().getFullYear() }) {
    const [forecast, setForecast] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [refreshToken, setRefreshToken] = useState(0);
    const forecastRef = useRef(null);

    useEffect(() => {
        const controller = new AbortController();
        let isActive = true;
        const hasCurrentForecast = forecastRef.current?.year === Number(year);

        setLoading(!hasCurrentForecast);
        setRefreshing(hasCurrentForecast);
        setError('');

        const loadForecast = async () => {
            try {
                const result = await fetchSeasonForecast(year, controller.signal);
                if (!isActive) return;
                forecastRef.current = { year: Number(year), data: result };
                setForecast(result);
            } catch (requestError) {
                if (!isActive || controller.signal.aborted) return;
                console.error('Error al cargar la proyección de temporada:', requestError);
                setError('No se pudo cargar la proyección ahora mismo. Inténtalo de nuevo más tarde.');
            } finally {
                if (isActive) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        };

        void loadForecast();
        return () => {
            isActive = false;
            controller.abort();
        };
    }, [year, refreshToken]);

    const handleRefresh = () => setRefreshToken((token) => token + 1);
    const currentForecast = forecast && Number(forecast.year) === Number(year) ? forecast : null;
    const standings = Array.isArray(currentForecast?.standings) ? currentForecast.standings : [];

    return (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                        Proyección de temporada
                    </p>
                    <h2 className="mt-1 text-xl font-black uppercase italic tracking-tight text-white md:text-2xl">
                        Clasificación final estimada {year}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
                        El orden se basa en los puntos finales estimados. La posibilidad de ganar el campeonato es orientativa, no una garantía.
                    </p>
                </div>
                <RefreshButton busy={loading || refreshing} onClick={handleRefresh} />
            </div>

            {error && currentForecast && (
                <div role="alert" className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-200">
                    No se pudo actualizar la proyección: {error}. Se conservan los últimos datos disponibles.
                </div>
            )}

            {currentForecast?.is_stale && (
                <div
                    role="alert"
                    className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3"
                >
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-amber-300">
                            Datos desactualizados
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
                            La proyección usa una clasificación anterior y puede no incluir los resultados más recientes.
                        </p>
                    </div>
                </div>
            )}

            {loading && !currentForecast ? (
                <div role="status" aria-live="polite" className="mt-6 space-y-3">
                    <p className="text-xs font-semibold text-zinc-400">Cargando proyección de temporada…</p>
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="h-12 animate-pulse rounded-lg bg-zinc-800/60" />
                    ))}
                </div>
            ) : error && !currentForecast ? (
                <div role="alert" className="mt-6 rounded-xl border border-red-900/50 bg-red-950/20 px-5 py-8 text-center">
                    <p className="text-sm font-bold text-red-200">No se pudo cargar la proyección</p>
                    <p className="mt-2 text-xs text-zinc-400">{error}</p>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="mt-4 rounded-lg border border-zinc-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                    >
                        Reintentar
                    </button>
                </div>
            ) : !currentForecast || standings.length === 0 ? (
                <div role="status" className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-950/20 px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-zinc-300">
                        No hay una proyección disponible para la temporada {year}.
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                        Actualiza más tarde para volver a consultar los datos.
                    </p>
                </div>
            ) : (
                <>
                    <ForecastTable standings={standings} year={year} />
                </>
            )}
        </section>
    );
}
