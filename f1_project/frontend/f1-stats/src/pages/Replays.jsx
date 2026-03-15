import { GenericCombobox } from "@/components/GenericComobobox"

export default function Replays() {
    return (
        <div className="p-6 w-full mx-auto">
            <div className="mb-8 border-l-4 border-red-600 pl-4">
                <h1 className="text-3xl font-bold uppercase tracking-tighter text-white">
                    Race Replay
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                    Selecciona la temporada y el circuito para revivir la telemetría.
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
        </div>
    )
}