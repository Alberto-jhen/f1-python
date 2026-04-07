import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { fetchH2HData } from '@/service/apiService';

export default function DriverH2Hcard({ driverData }) {
    const [comparisonList, setComparisonList] = useState([]);
    const [h2hData, setH2hData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAddDriver = () => {
        if (!driverData?.driverValue) return;

        if (comparisonList.length >= 2) {
            toast("Máximo 2 pilotos para la comparativa H2H.");
            return;
        }

        const isDuplicate = comparisonList.some(
            (driver) => driver.driverValue === driverData.driverValue && driver.year === driverData.year
        );
        if (isDuplicate) {
            toast("Este piloto ya está en la comparativa.");
            return;
        }

        setComparisonList([...comparisonList, driverData]);
    };

    const handleRemoveDriver = (indexToRemove) => {
        setComparisonList(comparisonList.filter((_, index) => index !== indexToRemove));
    };

    // Fetch H2H when we have exactly 2 drivers of the same year
    useEffect(() => {
        if (comparisonList.length !== 2 || comparisonList[0].year !== comparisonList[1].year) {
            setH2hData(null);
            return;
        }

        const [d1, d2] = comparisonList;
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
    }, [comparisonList]);

    // Compute H2H stats from the single pair response
    const stats = useMemo(() => {
        const s1 = { qualyWins: 0, raceAhead: 0, dnfs: 0, points: 0, wins: 0 };
        const s2 = { qualyWins: 0, raceAhead: 0, dnfs: 0, points: 0, wins: 0 };

        if (!h2hData?.events) return { s1, s2 };

        for (const ev of h2hData.events) {
            // Qualifying
            if (ev.driver1_qual != null && ev.driver2_qual != null) {
                if (ev.driver1_qual < ev.driver2_qual) s1.qualyWins++;
                else if (ev.driver2_qual < ev.driver1_qual) s2.qualyWins++;
            }

            // DNFs
            if (ev.driver1_race === 'DNF') s1.dnfs++;
            if (ev.driver2_race === 'DNF') s2.dnfs++;

            // Race ahead
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

            // Wins
            if (r1 === 1) s1.wins++;
            if (r2 === 1) s2.wins++;
        }

        // Season points from backend
        s1.points = h2hData?.driver1_season_points ?? 0;
        s2.points = h2hData?.driver2_season_points ?? 0;

        return { s1, s2 };
    }, [h2hData]);

    return (
        <>
            <div className="flex justify-center items-center">
                <button
                    onClick={handleAddDriver}
                    disabled={comparisonList.length >= 2}
                    className={`group w-full mx-6 px-8 py-2 cursor-pointer font-bold rounded-md transition-colors uppercase text-sm h-[40px] ${
                        comparisonList.length >= 2
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-800 text-white'
                    }`}
                >
                    <span className={comparisonList.length < 2 ? "group-hover:text-gray-400 transition-colors" : ""}>
                        {comparisonList.length >= 2 ? 'Comparativa completa' : 'Añade un piloto'}
                    </span>
                </button>
            </div>

            {comparisonList.length > 0 && (
                <Card
                    drivers={comparisonList}
                    onRemove={handleRemoveDriver}
                    stats={stats}
                    loading={loading}
                    h2hData={h2hData}
                />
            )}
        </>
    );
}

/* ---------- VS bar for a single stat ---------- */
function VsBar({ label, left, right, colorLeft, colorRight }) {
    const total = left + right || 1;
    const pctLeft = Math.round((left / total) * 100);
    const pctRight = 100 - pctLeft;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center">{label}</p>
            <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg w-8 text-right">{left}</span>
                <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-slate-800">
                    <div
                        className="h-full rounded-l-full transition-all duration-500"
                        style={{ width: `${pctLeft}%`, backgroundColor: colorLeft }}
                    />
                    <div
                        className="h-full rounded-r-full transition-all duration-500"
                        style={{ width: `${pctRight}%`, backgroundColor: colorRight }}
                    />
                </div>
                <span className="text-white font-black text-lg w-8 text-left">{right}</span>
            </div>
        </div>
    );
}

/* ---------- Main card ---------- */
function Card({ drivers, onRemove, stats, loading, h2hData }) {
    if (drivers.length === 0) return null;

    const d1 = drivers[0];
    const d2 = drivers[1] ?? null;
    const color1 = d1?.team_color ? `#${d1.team_color}` : '#fff';
    const color2 = d2?.team_color ? `#${d2.team_color}` : '#fff';

    const sameYear = d2 && d1.year === d2.year;

    return (
        <div className="flex bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 m-6 p-8 animate-fade-in-up flex-col gap-8 shadow-2xl">

            {/* HEADER: Driver pills */}
            <div className="flex flex-col gap-4">
                <h3 className="text-white font-black italic uppercase text-2xl border-l-4 border-red-600 pl-4">
                    Head to Head
                </h3>

                <div className="flex flex-wrap gap-4">
                    {drivers.map((driver, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-full border border-slate-800 relative pr-10 transition-all hover:bg-slate-800"
                        >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: driver.team_color ? `#${driver.team_color}` : '#fff' }} />
                            <span className="text-white font-bold uppercase tracking-widest text-sm">
                                {driver.driverLabel} ({driver.year})
                            </span>
                            <button
                                onClick={() => onRemove(index)}
                                className="absolute right-3 text-slate-500 hover:text-red-500 font-bold"
                                title="Quitar piloto"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* BODY */}
            {!d2 ? (
                <div className="flex items-center justify-center py-12 text-slate-600 text-sm border border-dashed border-slate-800 rounded-xl">
                    Añade un segundo piloto de la misma temporada para ver la comparativa.
                </div>
            ) : !sameYear ? (
                <div className="flex items-center justify-center py-12 text-amber-500/70 text-sm border border-dashed border-amber-900/30 rounded-xl">
                    Ambos pilotos deben ser de la misma temporada.
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500" />
                    <span className="ml-3 text-slate-400 text-sm">Cargando datos H2H…</span>
                </div>
            ) : (
                <div className="flex flex-col gap-6">

                    {/* VS Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col items-start">
                            <span className="text-white font-black italic text-2xl uppercase">{d1.driverLabel}</span>
                            <span className="text-slate-500 text-xs uppercase tracking-widest">{d1.team}</span>
                        </div>
                        <span className="text-slate-600 font-black italic text-4xl">VS</span>
                        <div className="flex flex-col items-end">
                            <span className="text-white font-black italic text-2xl uppercase">{d2.driverLabel}</span>
                            <span className="text-slate-500 text-xs uppercase tracking-widest">{d2.team}</span>
                        </div>
                    </div>

                    {/* VS Bars */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
                        <VsBar label="Puntos temporada" left={stats.s1.points} right={stats.s2.points} colorLeft={color1} colorRight={color2} />
                        <VsBar label="Victorias" left={stats.s1.wins} right={stats.s2.wins} colorLeft={color1} colorRight={color2} />
                        <VsBar label="Mejor Qualy" left={stats.s1.qualyWins} right={stats.s2.qualyWins} colorLeft={color1} colorRight={color2} />
                        <VsBar label="Terminó por delante" left={stats.s1.raceAhead} right={stats.s2.raceAhead} colorLeft={color1} colorRight={color2} />
                        <VsBar label="Abandonos (DNF)" left={stats.s1.dnfs} right={stats.s2.dnfs} colorLeft={color1} colorRight={color2} />
                    </div>

                    {/* Event count */}
                    <p className="text-slate-600 text-[10px] text-center uppercase tracking-widest">
                        Basado en {h2hData?.events?.length ?? 0} eventos de la temporada {d1.year}
                    </p>
                </div>
            )}
        </div>
    );
}
