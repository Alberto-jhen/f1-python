import { RatingSelection } from "../components/ratings/RatingSelection";
import { CustomCard } from "../components/custom/CustomCard";
import { useState } from "react";
import { X, Users, Flag } from "lucide-react";

export function Ratings() {
    const [raceSelection, setRaceSelection] = useState(null);
    const [driverSelection, setDriverSelection] = useState(null);

    const handleBack = () => {
        setRaceSelection(null);
        setDriverSelection(null);
    };

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
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300">
                            Comunidad
                        </span>
                    </div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-white italic">
                        Haz tus <span className="text-red-600">valoraciones</span>
                    </h1>
                    <p className="text-zinc-400 text-sm mt-2 font-medium max-w-xl leading-relaxed">
                        Analiza el rendimiento, valora a cada integrante de la parrilla y compara tu criterio con la tendencia global.
                    </p>
                </div>

                {/* Botón dinámico para volver */}
                {isAnySelected && (
                    <button 
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-zinc-900/40 px-4 py-2 rounded-lg border border-zinc-800 hover:border-red-900/50 hover:bg-red-950/20"
                    >
                        <X className="size-4 group-hover:rotate-90 transition-transform duration-300" /> Cambiar selección
                    </button>
                )}
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

            {/* Contenedor del contenido desplegado */}
            <div className={`transition-all duration-700 ease-out origin-top ${isAnySelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 hidden'}`}>
                {isDriverSelected && (
                    <div className="animate-in fade-in slide-in-from-top-8 duration-700">
                        <RatingSelection mode="driver" selection={{ name: "Parrilla Actual" }} onBack={handleBack} />
                    </div>
                )}
                {isRaceSelected && (
                    <div className="animate-in fade-in slide-in-from-top-8 duration-700">
                        <RatingSelection mode="race" selection={{ name: "Calendario" }} onBack={handleBack} />
                    </div>
                )}
            </div>
        </div>
    );
}