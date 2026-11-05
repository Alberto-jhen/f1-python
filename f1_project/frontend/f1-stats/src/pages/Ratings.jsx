import { RatingSelection } from "../components/ratings/RatingSelection";
import { CustomCard } from "../components/custom/CustomCard";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, X, Users, Flag, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export function Ratings() {
    const [raceSelection, setRaceSelection] = useState(null);
    const [driverSelection, setDriverSelection] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleBack = () => {
        setRaceSelection(null);
        setDriverSelection(null);
    };

    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [navigate, user]);

    const isDriverSelected = !!driverSelection;
    const isRaceSelected = !!raceSelection;
    const isAnySelected = isDriverSelected || isRaceSelected;

    return (
        <div className="flex flex-col p-6 md:p-12 mb-10 gap-8 relative min-h-screen">
            {/* Fondo decorativo principal */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-900/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Cabecera */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800/80 pb-6 gap-4">
                <div className="border-l-4 border-red-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-600" />
                        <span className="text-red-600 text-[10px] font-bold uppercase tracking-[0.3em]">Comunidad</span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                        Haz tus <span className="text-red-600">valoraciones</span>
                    </h1>
                    <p className="text-zinc-400 text-sm mt-2 font-medium max-w-xl leading-relaxed">
                        Analiza el rendimiento, valora a cada integrante de la parrilla y compara tu criterio con la tendencia global.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {isAnySelected && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-zinc-900/40 px-4 py-2 rounded-lg border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/20"
                        >
                            <X className="size-4 group-hover:rotate-90 transition-transform duration-300" /> Cambiar selección
                        </button>
                    )}
                </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 origin-top ${isAnySelected ? 'mb-2' : 'mt-4'}`}>
                <CustomCard
                    icon={Users}
                    title="Rendimiento de Pilotos"
                    description="Puntúa el nivel de conducción, gestión de neumáticos y consistencia de cada corredor."
                    selected={isDriverSelected}
                    dimmed={isRaceSelected}
                    onClick={() => { setDriverSelection(true); setRaceSelection(null); }}
                />
                <CustomCard
                    icon={Flag}
                    title="Espectáculo en Pista"
                    description="Valora la acción, los adelantamientos y la estrategia global de los Grandes Premios."
                    selected={isRaceSelected}
                    dimmed={isDriverSelected}
                    onClick={() => { setRaceSelection(true); setDriverSelection(null); }}
                />
            </div>

            {!isAnySelected && (
                <div className="w-full -mt-3 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Link
                        to="/ratings/community"
                        aria-label="Ver valoraciones de la comunidad"
                        className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/85 bg-white/85 px-6 py-3.5 text-sm font-black uppercase tracking-widest text-zinc-950 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-red-600/98 hover:bg-red-600/98 hover:text-white hover:shadow-md active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                        <Eye
                            className="size-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-12"
                            aria-hidden="true"
                        />
                        <span>Ver valoraciones</span>
                        <ArrowUpRight
                            className="size-4 opacity-60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                            aria-hidden="true"
                        />
                    </Link>
                </div>
            )}
            {/* Contenedor del contenido desplegado */}
            <div className={`transition-all duration-700 ease-out origin-top ${isAnySelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 hidden'}`}>
                {isDriverSelected && (
                    <div className="animate-in fade-in slide-in-from-top-8 duration-700">
                        <RatingSelection mode="driver" onBack={handleBack} />
                    </div>
                )}
                {isRaceSelected && (
                    <div className="animate-in fade-in slide-in-from-top-8 duration-700">
                        <RatingSelection mode="race" onBack={handleBack} />
                    </div>
                )}
            </div>
        </div>
    );
}