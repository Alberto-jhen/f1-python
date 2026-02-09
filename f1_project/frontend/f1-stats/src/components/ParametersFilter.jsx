import { GenericCombobox } from "./GenericComobobox";
import { useState, useEffect} from 'react'
import { fetchYearSchedule, fetchDriversFullNamesByYear } from "@/service/apiService";

export const ParametersFilter = ({ isOpen, onClose, config, tempParams, onInputChange, onSave }) => {
    if (!isOpen) return null;
    const [loadingDrivers, setLoadingDrivers] = useState(false);

    const [options, setOptions] = useState({
        year: [
            {label: "2026", value: 2026},
            {label: "2025", value: 2025},
            {label: "2024", value: 2024},
            {label: "2023", value: 2023},
            {label: "2022", value: 2022},
            {label: "2021", value: 2021},
            {label: "2020", value: 2020},
            {label: "2019", value: 2019},
            {label: "2018", value: 2018},
        ], 
        driver: [], 
        track: [],
        session: [
            { label: "Carrera (R)", value: "R" },
            { label: "Clasificación completa", value: "Q" },
            { label: "Clasificación 1", value: "Q1" },
            { label: "Clasificación 2", value: "Q2" },
            { label: "Clasificación 3", value: "Q3" },
            { label: "Prácticas 1 (FP1)", value: "FP1" },
            { label: "Prácticas 2 (FP2)", value: "FP2" },
            { label: "Prácticas 3 (FP3)", value: "FP3" }
        ]
    });

    useEffect(() => {
        const loadData = async () => {
            // Load the tracks and sessions only if the year is configured.
            if (tempParams.year) {
                try {
                    const scheduleData = await fetchYearSchedule(tempParams.year);
                    const uniqueTracks = Array.from(new Set(scheduleData.tracks))
                        .map(trackName => ({
                            label: trackName,
                            value: trackName
                        }));

                    setOptions(prev => ({
                        ...prev,
                        track: uniqueTracks
                    }));
                } catch (error) {
                    console.error("Error cargando circuitos:", error);
                }
            }

            // 2. Allow to configure the drivers only if the rest is configured.
            if (tempParams.year && tempParams.track && tempParams.session) {
                setLoadingDrivers(true); 
                try {
                    const driversData = await fetchDriversFullNamesByYear(
                        tempParams.year,
                        tempParams.track,   
                        tempParams.session 
                    );

                    setOptions(prev => ({
                        ...prev,
                        driver: driversData 
                    }));
                } catch (error) {
                    console.error("Error cargando pilotos:", error);
                } finally {
                    setLoadingDrivers(false); 
                }
            } else {
                setOptions(prev => ({ ...prev, driver: [] }));
            }
        };

        loadData();
        // Add the parameters that need to be checked
    }, [tempParams.year, tempParams.track, tempParams.session]);
    
    const placeholders = {
        driver: 'Verstappen, Hamilton, Alonso...',
        track: 'Monaco, Monza, Spa...',
        session: 'R, Q, FP1, FP2...',
        year: '2024',
        num_drivers: 'Ej: 10 (1-20)'
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-white text-xl font-bold uppercase mb-6 tracking-tight">
                    Configurar <span className="text-red-600">{config.title}</span>
                </h3>
                
                <div className="space-y-5">
                    {config.params.map(param => (
                        <div key={param} className="flex flex-col gap-2">
                            <label className="text-slate-400 text-[10px] uppercase font-black tracking-widest">
                                {param === 'year' ? 'Temporada' : 
                                param === 'track' ? 'Circuito' : 
                                param === 'driver' ? 'Piloto' :
                                param === 'num_drivers' ? 'Nº de Pilotos' : 
                                param }
                            </label>

                            {param === 'num_drivers' ? (
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    placeholder={placeholders[param]}
                                    value={tempParams[param] || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (isNaN(val)) onInputChange(param, '');
                                        else if (val >= 0 && val <= 20) onInputChange(param, val);
                                    }}
                                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-red-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            ) : (
                            <GenericCombobox 
                                placeholder={
                                    param === 'driver' && loadingDrivers 
                                        ? "Buscando en boxes..." 
                                        : placeholders[param]
                                }
                                options={options[param] || []} 
                                value={tempParams[param] || ''}
                                onChange={(val) => onInputChange(param, val)}
                                disabled={
                                    (param === 'driver' && loadingDrivers) || 
                                    (param === 'year' ? false : 
                                    param === 'track' ? !tempParams.year : 
                                    param === 'session' ? !tempParams.track : 
                                    param === 'driver' ? !tempParams.session : !tempParams.year)
                                }
                            />
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 px-4 py-3 rounded-lg bg-slate-800 text-white font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onSave}
                        className="flex-1 px-4 py-3 rounded-lg bg-red-600 text-white font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};