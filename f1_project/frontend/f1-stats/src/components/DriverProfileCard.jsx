import { fetchDriverCareerStandings, fetchDriverSeasonStandings } from '../service/apiService.js'
import { useState, useEffect } from 'react'; 
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const IMAGE_FALLBACK_YEARS = [2025, 2024];

function buildImageUrl(year, surname) {
    return `https://media.formula1.com/content/dam/fom-website/drivers/${year}Drivers/${surname}.jpg`;
}

export default function DriverProfileCard({ data }) {
    const { year, driverLabel, driverNumber, team, team_color, country = "Sin dato", points, value: driverCode } = data;
    const [standings, setStandings] = useState({ position: '-', points: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    const nameParts = driverLabel.split(' ');
    const surname = nameParts[nameParts.length - 1];
    const surnameNorm = surname.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const [imageUrl, setImageUrl] = useState(buildImageUrl(year, surnameNorm));
    const [fallbackIdx, setFallbackIdx] = useState(0);

    // Reset image state when driver changes
    useEffect(() => {
        setImageUrl(buildImageUrl(year, surnameNorm));
        setFallbackIdx(0);
    }, [year, surnameNorm]);

    const handleImageError = () => {
        if (fallbackIdx < IMAGE_FALLBACK_YEARS.length) {
            setImageUrl(buildImageUrl(IMAGE_FALLBACK_YEARS[fallbackIdx], surnameNorm));
            setFallbackIdx(prev => prev + 1);
        }
    };

    useEffect(() => {
        async function getStats() {
            setLoadingStats(true);
            try {
                const res = await fetchDriverSeasonStandings(year, driverNumber, driverCode);
                if (res) {
                    setStandings({
                        position: res.position, 
                        points: res.points     
                    });
                }
            } catch (error) {
                console.error("Error cargando standings:", error);
                setStandings({ position: 'N/A', points: 0 });
            } finally {
                setLoadingStats(false);
            }
        }

        if (driverNumber && year) {
            getStats();
        }
    }, [driverNumber, year]);

    return (
        <div className="flex bg-slate-900 rounded-3xl overflow-hidden border m-6 animate-fade-in-up"
        style={{ borderColor: team_color ? `#${team_color}` : '#1e293b' }}>
            <div className="w-1/2 relative">
                <img 
                    src={imageUrl} 
                    alt={driverLabel}
                    onError={handleImageError}
                    className="w-full h-full object-cover mask-[linear-gradient(to_right,black_65%,transparent)]"
                />
                <span className="absolute bottom-0 left-4 text-8xl font-black italic uppercase text-white opacity-40 pointer-events-none select-none">
                    {surname}
                </span>
            </div>
            <div className="w-1/2 p-8 text-white font-black flex flex-col gap-4">
                <div className='flex flex-row items-center gap-4'>
                    <div className="w-fit px-3 py-1 rounded-md shadow-lg" 
                    style={{ backgroundColor: team_color ? `#${team_color}` : '#1e293b' }}>
                        <span className="uppercase font-bold text-slate-900">
                            {team || 'Cargando...'}
                        </span>
                    </div>
                    <div className="h-px center flex-1 bg-slate-700"></div>
                </div>
                <div className='flex flex-row items-baseline gap-6'>
                    <h2 className="text-5xl">{driverLabel}</h2>
                    <span className='italic text-4xl' style={{color: team_color ? `#${team_color}` : '#1e293b'}}>#{driverNumber}</span>
                </div>
                <div className='grid grid-cols-2 grid-rows-2 gap-5 mt-3'>
                    <div className='bg-slate-950/50 border rounded-xl border-slate-800 p-4 h-24 flex flex-col justify-center'>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Nacionalidad</span>
                        <span className="text-2xl uppercase">{country || 'N/A'}</span>
                    </div>
                    
                    <div className='bg-slate-950/50 border rounded-xl border-slate-800 p-4 h-24 flex flex-col justify-center'>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Puntos</span>
                        <span className="text-2xl uppercase"
                        style={{color: team_color ? `#${team_color}` : '#1e293b'}}>
                            {standings.points || '0'}
                        </span>
                    </div>

                    <div className='bg-slate-950/50 border rounded-xl border-slate-800 p-4 h-24 flex flex-col justify-center'>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Posición en el mundial</span>
                        <span className="text-2xl uppercase">{standings.position || 'N/A'}</span>
                    </div>

                    <div className='bg-slate-950/50 border rounded-xl border-slate-800 p-4 h-24 flex flex-col justify-center'>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Temporada</span>
                        <span className="text-2xl uppercase">{year}</span>
                    </div>
                </div>
                <div>
                    <DriverHistoryAccordion teamColor={team_color} driverName={driverLabel}/>
                </div>
            </div>
        </div>
    );
}


function DriverHistoryAccordion({ teamColor, driverName }) {
    // Function to make a hex color darker/brighter
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
    const [driverCareerStandings, setDriverCareerStandings] = useState({
        titles: 0,
        wins: 0,
        podiums: 0
    });

    useEffect(() => {
        const loadCareerStandings = async () => {
            try {
                const res = await fetchDriverCareerStandings(driverName);
                if(res) {
                    setDriverCareerStandings({
                        titles: res.titles,
                        wins: res.wins,
                        podiums: res.podiums
                    })
                }
            } catch (error) {
                console.error('Error al hacer el fetch de estadisticas de carrera en el componente');
                setDriverCareerStandings({titles: 0, wins: 0, podiums: 0})
            }
        }

        if(driverName) {
            loadCareerStandings()
        }
    }, [driverName])
    console.log(driverName);
    console.log(driverCareerStandings.titles);

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
                        className='py-1.5 text-lg uppercase font-black hover:no-underline items-center hover:cursor-pointer text-slate-900'
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
                                    <td className="px-4 py-3 text-sm font-medium text-slate-300">Títulos Mundiales</td>
                                    <td className="px-4 py-3 text-right font-black text-xl italic" style={{color: baseColor}}>
                                        {driverCareerStandings.titles}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-300">Victorias en Grandes Premios</td>
                                    <td className="px-4 py-3 text-right font-black text-xl italic" style={{color: baseColor}}>
                                        {driverCareerStandings.wins}
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-800/20 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-slate-300">Podios Totales</td>
                                    <td className="px-4 py-3 text-right font-black text-xl italic" style={{color: baseColor}}>
                                        {driverCareerStandings.podiums}
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