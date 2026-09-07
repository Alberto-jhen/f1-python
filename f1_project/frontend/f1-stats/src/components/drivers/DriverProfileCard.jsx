import { fetchDriverCareerStandings, fetchDriverSeasonStandings } from '@/service/apiService.js';
import { useState, useEffect } from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

const IMAGE_FALLBACK_YEARS = [2025, 2024];

function buildImageUrl(year, surname) {
    return `https://media.formula1.com/content/dam/fom-website/drivers/${year}Drivers/${surname}.jpg`;
}

function getDriverSurname(fullName) {
    const parts = fullName.split(' ');
    return parts[parts.length - 1];
}

export default function DriverProfileCard({ data }) {
    const { year, driverLabel, driverNumber, team, team_color, country = 'Sin dato', value: driverCode } = data;

    const [seasonStats, setSeasonStats] = useState({ position: '-', points: 0 });
    const [careerStats, setCareerStats] = useState({ titles: 0, wins: 0, podiums: 0 });
    const [loading, setLoading] = useState(true);

    const surname = getDriverSurname(driverLabel);
    const surnameNorm = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const [imageUrl, setImageUrl] = useState(buildImageUrl(year, surnameNorm));
    const [fallbackIdx, setFallbackIdx] = useState(0);

    const color = team_color ? `#${team_color}` : '#dc2626';

    useEffect(() => {
        setImageUrl(buildImageUrl(year, surnameNorm));
        setFallbackIdx(0);
    }, [year, surnameNorm]);

    const handleImageError = () => {
        if (fallbackIdx < IMAGE_FALLBACK_YEARS.length) {
            setImageUrl(buildImageUrl(IMAGE_FALLBACK_YEARS[fallbackIdx], surnameNorm));
            setFallbackIdx((prev) => prev + 1);
        }
    };

    useEffect(() => {
        async function loadAllStats() {
            setLoading(true);
            try {
                const [seasonRes, careerRes] = await Promise.all([
                    fetchDriverSeasonStandings(year, driverNumber, driverCode),
                    fetchDriverCareerStandings(driverLabel)
                ]);

                if (seasonRes) setSeasonStats({ position: seasonRes.position, points: seasonRes.points });
                if (careerRes) setCareerStats({ titles: careerRes.titles, wins: careerRes.wins, podiums: careerRes.podiums });
            } catch (error) {
                console.error('Error cargando estadísticas', error);
            } finally {
                setLoading(false);
            }
        }
        if (driverNumber && year && driverLabel) loadAllStats();
    }, [driverNumber, year, driverLabel, driverCode]);

    return (
        <div className="relative w-full h-auto min-h-[600px] rounded-3xl overflow-hidden shadow-2xl group animate-fade-in-up border border-slate-800/50 bg-slate-950 flex flex-col lg:flex-row">
            {/* Driver image */}
            <div className="relative w-full lg:w-2/5 h-[55vh] lg:h-[75vh] min-h-[450px] overflow-hidden flex items-start justify-center bg-slate-950 shrink-0">
                <img
                    src={imageUrl}
                    alt={driverLabel}
                    onError={handleImageError}
                    className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-slate-950/10 to-slate-950/80 lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/10 lg:to-slate-950/90" />
                <div
                    className="absolute bottom-2 right-4 lg:bottom-8 lg:right-8 text-[80px] lg:text-[120px] tall-screen:text-[160px] font-black italic leading-none opacity-20 pointer-events-none select-none"
                    style={{ color }}
                >
                    {driverNumber}
                </div>
            </div>

            {/* Info */}
            <div className="relative z-10 w-full lg:w-3/5 h-auto flex flex-col p-6 md:p-8 lg:p-10 bg-slate-950 gap-4 overflow-y-auto">
                {/* Header */}
                <div className="space-y-2 short-screen:space-y-1 shrink-0">
                    <div
                        className="w-fit px-3 py-1 rounded-full text-[10px] short-screen:text-[9px] font-bold uppercase tracking-widest text-white"
                        style={{ backgroundColor: `${color}` }}
                    >
                        {team || 'Cargando equipo…'}
                    </div>
                    <h1 className="text-[clamp(1.75rem,3vw+1.2vh,3.5rem)] font-black uppercase italic tracking-tighter text-white drop-shadow-2xl leading-none flex flex-wrap items-baseline gap-x-3">
                        {driverLabel}
                        <span
                            className="text-[clamp(1.5rem,2.8vw+1.1vh,3.5rem)] font-black italic flex items-baseline gap-x-1.5"
                            style={{ color: `${color}` }}
                        >
                            <span className="text-[clamp(1rem,1.6vw+0.6vh,2rem)]">#</span>
                            {driverNumber}
                        </span>
                    </h1>
                </div>

                {/* Estadísticas en lista unificada */}
                <div className="flex flex-col gap-3 short-screen:gap-2 my-4 short-screen:my-2 shrink-0">
                    <StatRow label="País" value={country} color={color} />
                    <div className="w-full h-px bg-slate-600/80" />
                    <StatRow label="Temporada" value={year} color={color} />
                    <div className="w-full h-px bg-slate-600/80" />
                    <StatRow label="Posición Mundial" value={`${seasonStats.position || '-'}º`} color={color} />
                    <div className="w-full h-px bg-slate-600/80" />
                    <StatRow label="Puntos Temporada" value={seasonStats.points || '0'} color={color} />
                    <div className="w-full h-px bg-slate-600/80" />
                </div>

                {/* Career history accordion */}
                <div className="flex-1 min-h-0 flex flex-col mt-auto">
                    <DriverHistoryAccordion
                        teamColor={team_color}
                        titles={careerStats.titles}
                        wins={careerStats.wins}
                        podiums={careerStats.podiums}
                    />
                </div>

                {/* Loading */}
                {loading && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 text-slate-500 text-xs">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                        Cargando estadísticas…
                    </div>
                )}
            </div>
        </div>
    );
}

function StatRow({ label, value, color }) {
    return (
        <div className="group/stat flex items-center gap-4 w-full cursor-default">
            <span
                className="inline-block h-3 w-3 shrink-0 rounded-full transition-all duration-300 ease-out group-hover/stat:w-16 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                style={{ backgroundColor: color }}
            />
            <p className="flex flex-1 items-baseline justify-between text-slate-300 font-black uppercase tracking-tighter text-base short-screen:text-sm tall-screen:text-lg whitespace-nowrap">
                {label}
                <span className="text-white text-xl short-screen:text-lg tall-screen:text-2xl ml-4">
                    {value}
                </span>
            </p>
        </div>
    );
}

function DriverHistoryAccordion({ teamColor, wins, podiums, titles }) {
    const darkenColor = (hex, percent) => {
    const num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) - amt,
        G = ((num >> 8) & 0x00FF) - amt,
        B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? (R < 0 ? 0 : R) : 255) * 0x10000 + (G < 255 ? (G < 0 ? 0 : G) : 255) * 0x100 + (B < 255 ? (B < 0 ? 0 : B) : 255)).toString(16).slice(1);
    };

    const baseColor = teamColor ? `#${teamColor}` : '#1e293b';
    const brighterColor = darkenColor(baseColor, -3);

    return (
        <Accordion type="single" collapsible>
            <AccordionItem value="item-1" className="border-none">
                <div 
                    className='mb-0 pb-0 mt-1 rounded-md shadow-lg px-4 py-0 h-auto hover:brightness-105 hover:-translate-y-1 transition duration-350' 
                    style={{ 
                        backgroundImage: `linear-gradient(135deg, ${baseColor} 0%, ${brighterColor} 100%)` 
                    }}
                >
                    <AccordionTrigger
                        className='py-1.5 text-sm short-screen:text-xs tall-screen:text-lg uppercase font-black hover:no-underline items-center hover:cursor-pointer text-slate-900'
                    >
                        Trayectoria
                    </AccordionTrigger>
                </div>
                <AccordionContent className="pt-4">
                    <div className="mb-0 pb-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                        <table className="mb-0 pb-0 w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/80 border-b border-slate-800">
                                    <th className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Estadística</th>
                                    <th className="px-4 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                <tr className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-3 py-2 short-screen:px-2 short-screen:py-1.5 text-sm short-screen:text-xs tall-screen:text-base font-medium text-slate-300">Títulos Mundiales</td>
                                    <td className="px-3 py-2 short-screen:px-2 short-screen:py-1.5 text-right font-black text-2xl short-screen:text-xl tall-screen:text-3xl italic" style={{color: baseColor}}>
                                        {titles}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-3 py-2 short-screen:px-2 short-screen:py-1.5 text-sm short-screen:text-xs tall-screen:text-base font-medium text-slate-300">Victorias en Grandes Premios</td>
                                    <td className="px-3 py-2 short-screen:px-2 short-screen:py-1.5 text-right font-black text-2xl short-screen:text-xl tall-screen:text-3xl italic" style={{color: baseColor}}>
                                        {wins}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-3 py-2 short-screen:px-2 short-screen:py-1.5 text-sm short-screen:text-xs tall-screen:text-base font-medium text-slate-300">Podios Totales</td>
                                    <td className="px-3 py-2 short-screen:px-2 short-screen:py-1.5 text-right font-black text-2xl short-screen:text-xl tall-screen:text-3xl italic" style={{color: baseColor}}>
                                        {podiums}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}