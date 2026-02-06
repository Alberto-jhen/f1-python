export const ParametersFilter = ({ isOpen, onClose, config, tempParams, onInputChange, onSave }) => {
    if (!isOpen) return null;

    const placeholders = {
        driver: 'Verstappen, Hamilton, Alonso...',
        track: 'Monaco, Monza, Spa...',
        session: 'R, Q, FP1, FP2...',
        year: '2024',
        num_drivers: 'Ej: 10'
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
                                {param}
                            </label>
                            <input 
                                className="bg-slate-950 border border-slate-700 text-white p-3 rounded-lg focus:border-red-600 outline-none text-sm transition-colors"
                                placeholder={placeholders[param] || `Introduce ${param}...`}
                                value={tempParams[param] || ''}
                                onChange={(e) => onInputChange(param, e.target.value)}
                            />
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