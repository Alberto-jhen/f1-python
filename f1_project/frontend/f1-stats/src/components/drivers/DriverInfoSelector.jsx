import { GenericCombobox } from "@/components/GenericComobobox";
import { SlidersHorizontal } from "lucide-react";

export default function DriverInfoSelector({
    year,
    mode,
    onYearChange,
    onModeChange,
    selectedDriver,
    comparisonList = []
}) {
    const visualizationOptions = [
        { label: "Piloto individual", value: "individual" },
        { label: "Comparativa H2H", value: "h2h" }
    ];

    const selectableYears = [
        { label: "2026", value: 2026 }, { label: "2025", value: 2025 },
        { label: "2024", value: 2024 }, { label: "2023", value: 2023 },
        { label: "2022", value: 2022 }, { label: "2021", value: 2021 },
        { label: "2020", value: 2020 }, { label: "2019", value: 2019 },
    ];

    return (
        <div className="flex flex-col gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm w-full">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <SlidersHorizontal className="size-5 text-red-600" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Controles</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Modo</label>
                    <GenericCombobox
                        placeholder="Modo"
                        options={visualizationOptions}
                        value={mode}
                        onChange={onModeChange}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Temporada</label>
                    <GenericCombobox
                        placeholder="Temporada"
                        options={selectableYears}
                        value={year}
                        onChange={onYearChange}
                    />
                </div>
            </div>

            {mode === "individual" && selectedDriver && (
                <div className="pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Piloto seleccionado</p>
                    <div className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedDriver.team_color ? `#${selectedDriver.team_color}` : '#dc2626' }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black uppercase italic text-white truncate">{selectedDriver.driverLabel}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{selectedDriver.team}</p>
                        </div>
                        <span className="text-xl font-black italic text-slate-600">{selectedDriver.driverNumber}</span>
                    </div>
                </div>
            )}

            {mode === "h2h" && comparisonList.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        Comparativa activa {comparisonList.length}/2
                    </p>
                    <div className="flex flex-col gap-2">
                        {comparisonList.map((driver, idx) => (
                            <div
                                key={`${driver.driverValue}-${idx}`}
                                className="flex items-center gap-3 bg-slate-900 px-3 py-2 rounded-xl border border-slate-800"
                            >
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: driver.team_color ? `#${driver.team_color}` : '#dc2626' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black uppercase italic text-white truncate">{driver.driverLabel}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">{driver.team}</p>
                                </div>
                                <span className="text-xs font-black text-slate-500">#{idx + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
