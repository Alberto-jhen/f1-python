import React from 'react';

export const ImagePreview = ({ isOpen, onClose, imageSrc, fileName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-5xl w-full animate-in zoom-in-95 duration-200">
                
                {/* Preview header */}
                <div className="flex justify-between items-center mb-4 text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em]">
                            Python Matplotlib Engine Output
                        </span>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="hover:text-white transition-colors cursor-pointer text-xs font-bold uppercase tracking-widest"
                    >
                        Cerrar [X]
                    </button>
                </div>

                {/* Image container */}
                <div className="bg-white rounded-lg p-2 shadow-2xl relative group">
                    <img 
                        src={imageSrc} 
                        alt="F1 Analysis Python Report" 
                        className="w-full h-auto max-h-[75vh] object-contain rounded border border-slate-200" 
                    />
                </div>

                {/* Download action */}
                <div className="mt-8 flex flex-col items-center gap-4">
                    <a 
                        href={imageSrc} 
                        download={`F1-ANALYSIS-${fileName || 'DATA'}.png`}
                        className="group relative px-8 py-4 bg-red-600 text-white font-black italic uppercase text-xs tracking-[0.2em] overflow-hidden transition-all hover:bg-red-700 shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                    >
                        Descargar Reporte PNG
                    </a>
                    <p className="text-slate-500 text-[9px] uppercase tracking-tighter">
                        Formato: PNG // Resolución: 800x800 DPI (Aprox)
                    </p>
                </div>
            </div>
        </div>
    );
};