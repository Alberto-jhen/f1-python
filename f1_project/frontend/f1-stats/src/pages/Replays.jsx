import { GenericCombobox } from "@/components/GenericComobobox"

export default function Replays() {
    return (
        <div className="p-6 md:p-12 w-full mx-auto max-w-7xl relative min-h-[80vh]">
            {/* Decorative background */}
            <div className="absolute top-10 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(220, 38, 38, 0.06)' }} />
            <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(100, 116, 139, 0.08)' }} />

            <div className="mb-10 border-l-4 border-red-600 pl-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em]">En desarrollo</span>
                </div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                    Race Replay
                </h1>
                <p className="text-zinc-400 text-sm mt-1 font-medium">
                    Selecciona la temporada y el circuito para revivir la telemetría en 3D.
                </p>
            </div>

            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-end gap-6">
                    
                    <div className="flex flex-col gap-2 w-full md:w-1/3">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            Temporada
                        </label>
                        <GenericCombobox />
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-2/3">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            Gran Premio / Circuito
                        </label>
                        <GenericCombobox />
                    </div>

                    <button className="w-full md:w-auto px-8 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors uppercase text-sm h-[40px]">
                        Cargar
                    </button>
                </div>
            </div>

            {/* Coming soon visual */}
            <div className="mt-12 flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
                <div className="relative z-10 text-center">
                    <div className="mb-6">
                        <svg className="w-16 h-16 text-zinc-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-white font-black italic uppercase text-2xl tracking-tighter mb-2">Próximamente</p>
                    <p className="text-zinc-500 text-sm max-w-md mx-auto">
                        Visualización 3D interactiva de la telemetría de carrera con posiciones en tiempo real, velocidad, marchas y DRS.
                    </p>
                    <div className="mt-8 flex gap-6 justify-center">
                        {['Posición GPS', 'Velocidad', 'Marchas', 'DRS'].map((feat, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                <span className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
