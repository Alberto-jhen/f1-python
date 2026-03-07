import { useState } from 'react';

export default function DriverH2Hcard({ driverData }) {
    // Estado para guardar la lista de pilotos a comparar (máximo 3)
    const [comparisonList, setComparisonList] = useState([]);

    const handleAddDriver = () => {
        // 1. Evitar añadir si no hay piloto seleccionado en el input
        if (!driverData?.driverValue) return;

        // 2. Limitar a un máximo de 3 pilotos
        if (comparisonList.length >= 3) {
            alert("Has alcanzado el límite máximo de 3 pilotos para la comparativa.");
            return;
        }

        // 3. Evitar duplicados exactos (mismo piloto en el mismo año)
        const isDuplicate = comparisonList.some(
            (driver) => driver.driverValue === driverData.driverValue && driver.year === driverData.year
        );

        if (isDuplicate) {
            alert("Este piloto y temporada ya están en la comparativa.");
            return;
        }

        // Si pasa las validaciones, lo añadimos al array
        setComparisonList([...comparisonList, driverData]);
    };

    // Función extra para poder quitar un piloto si te equivocas (opcional pero muy útil)
    const handleRemoveDriver = (indexToRemove) => {
        setComparisonList(comparisonList.filter((_, index) => index !== indexToRemove));
    };

    return (
        <>
            <div className="flex justify-center items-center">
                {/* Botón original intacto, solo con la llamada al onClick */}
                <button
                    onClick={handleAddDriver}
                    className="group w-full mx-6 px-8 py-2 cursor-pointer bg-green-600 hover:bg-green-800 text-white font-bold rounded-md transition-colors uppercase text-sm h-[40px]"
                >
                    <span className="group-hover:text-gray-400 transition-colors">Añade un piloto</span>
                </button>
            </div>

            {/* Solo mostramos la Card si hay al menos 1 piloto en la lista */}
            {comparisonList.length > 0 && (
                <Card drivers={comparisonList} onRemove={handleRemoveDriver} />
            )}
        </>
    );
}

function Card({ drivers, onRemove }) {
    // Si no hay pilotos, no renderizamos nada
    if (drivers.length === 0) return null;

    return (
        <div className="flex bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 m-6 p-8 animate-fade-in-up flex-col gap-8 shadow-2xl">

            {/* 1. HEADER: MINIATURAS DE LOS PILOTOS */}
            <div className="flex flex-col gap-4">
                <h3 className="text-white font-black italic uppercase text-2xl border-l-4 border-red-600 pl-4">
                    Comparativa Analítica ({drivers.length}/3)
                </h3>

                <div className="flex flex-wrap gap-4">
                    {drivers.map((driver, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-full border border-slate-800 relative group pr-10 transition-all hover:bg-slate-800"
                        >
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: driver.team_color ? `#${driver.team_color}` : '#fff' }}
                            ></div>
                            <span className="text-white font-bold uppercase tracking-widest text-sm">
                                {driver.driverLabel} ({driver.year})
                            </span>

                            {/* Botón de quitar en miniatura */}
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

            {/* 2. BODY: DASHBOARD DE COMPARACIÓN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* WIDGET A: EVOLUCIÓN DEL CAMPEONATO (GRÁFICO) */}
                <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Evolución de Puntos</h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">Ergast API</span>
                    </div>

                    {/* Placeholder del Gráfico (Aquí irá Recharts o Chart.js) */}
                    <div className="flex-1 min-h-[250px] flex items-center justify-center border border-dashed border-slate-700 rounded-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent"></div>
                        <div className="text-center z-10">
                            <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <p className="text-slate-500 font-medium text-sm">Gráfico de líneas (Puntos vs Carreras)</p>
                            <p className="text-slate-600 text-xs mt-1 max-w-xs mx-auto">Muestra cómo se acumulan los puntos ronda a ronda.</p>
                        </div>

                        {/* Líneas falsas de diseño para dar aspecto de gráfico */}
                        {drivers.map((d, i) => (
                            <div key={i} className="absolute bottom-0 left-0 w-full h-1/2 opacity-20" style={{ borderTop: `2px solid #${d.team_color || 'fff'}`, transform: `translateY(-${(i + 1) * 20}px) rotate(-5deg)` }}></div>
                        ))}
                    </div>
                </div>

                {/* WIDGET B: MÉTRICAS DE RITMO Y CLASIFICACIÓN */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Ritmo Promedio</h4>
                        <span className="text-[10px] bg-red-900/30 text-red-500 px-2 py-1 rounded uppercase tracking-widest">FastF1</span>
                    </div>

                    <div className="flex flex-col gap-4 flex-1">
                        {drivers.map((driver, index) => (
                            <div key={index} className="bg-slate-900 p-4 rounded-xl border-l-2" style={{ borderLeftColor: driver.team_color ? `#${driver.team_color}` : '#fff' }}>
                                <p className="text-white font-black italic text-lg uppercase leading-none">{driver.driverLabel}</p>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-500 tracking-widest uppercase text-[9px] mb-1">Qualy Delta</p>
                                        <p className="text-slate-300 font-mono">+0.124s</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 tracking-widest uppercase text-[9px] mb-1">Race Pace</p>
                                        <p className="text-slate-300 font-mono">1:23.450</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {drivers.length < 2 && (
                            <div className="flex-1 flex items-center justify-center text-slate-600 text-xs text-center border border-dashed border-slate-800 rounded-xl p-4">
                                Añade otro piloto para ver el diferencial de tiempo.
                            </div>
                        )}
                    </div>
                </div>

                {/* WIDGET C: TABLA DE DUELOS DIRECTOS (HEAD TO HEAD) */}
                <div className="lg:col-span-3 bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                        <h4 className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em]">Duelos Directos (H2H)</h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded uppercase tracking-widest">Ergast API</span>
                    </div>
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase tracking-widest">
                            <tr>
                                <th className="px-6 py-3 font-medium">Piloto</th>
                                <th className="px-6 py-3 font-medium text-center">Mejor Qualy</th>
                                <th className="px-6 py-3 font-medium text-center">Terminó por delante</th>
                                <th className="px-6 py-3 font-medium text-right">Abandonos (DNF)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {drivers.map((driver, index) => (
                                <tr key={index} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: driver.team_color ? `#${driver.team_color}` : '#fff' }}></div>
                                        <span className="font-black italic text-white text-lg uppercase">{driver.driverLabel}</span>
                                    </td>
                                    {/* Placeholders realistas */}
                                    <td className="px-6 py-4 text-center font-bold">12 <span className="text-slate-600 text-xs font-normal">veces</span></td>
                                    <td className="px-6 py-4 text-center font-bold">14 <span className="text-slate-600 text-xs font-normal">veces</span></td>
                                    <td className="px-6 py-4 text-right font-mono text-red-400">2</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}