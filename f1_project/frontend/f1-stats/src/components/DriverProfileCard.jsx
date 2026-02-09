import { fetchDriverSeasonStandings } from '../service/apiService.js'
import { useState, useEffect } from 'react'; 

export default function DriverProfileCard({ data }) {
    const { year, driverLabel, driverNumber, team, team_color, country = "Sin dato", points } = data;
    const [standings, setStandings] = useState({ position: '-', points: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    const imageUrl = `https://media.formula1.com/content/dam/fom-website/drivers/${year}Drivers/${driverLabel.split(' ').pop().toLowerCase()}.jpg`;
    const nameParts = driverLabel.split(' ');
    const surname = nameParts[nameParts.length - 1];

    useEffect(() => {
        async function getStats() {
            setLoadingStats(true);
            try {
                const res = await fetchDriverSeasonStandings(year, driverNumber);
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
                    className="w-full h-full object-cover mask-[linear-gradient(to_right,black_65%,transparent)]"
                />
                <span className="absolute bottom-0 left-4 text-8xl font-black italic uppercase text-white opacity-40 pointer-events-none select-none">
                    {surname}
                </span>
            </div>
            <div className="w-1/2 p-8 text-white font-black flex flex-col gap-4 mt-14">
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
                <div className='grid grid-cols-2 grid-rows-2 gap-5 mt-9'>
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
            </div>
        </div>
    );
}