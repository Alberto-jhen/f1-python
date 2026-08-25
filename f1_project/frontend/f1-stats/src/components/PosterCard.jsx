// src/components/PosterCard.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // Añadimos esta importación
import { motion as Motion, AnimatePresence } from 'framer-motion';

export default function PosterCard({ posterSrc, altText = "Collector Poster" }) {
    const [isPosterOpen, setIsPosterOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Evita errores de hidratación asegurando que estamos en el cliente
    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(id);
    }, []);

    // Controlar el scroll del body cuando el modal se abre
    useEffect(() => {
        if (isPosterOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => { document.body.style.overflow = 'unset'; };
    }, [isPosterOpen]);

    return (
        <>
            {/* TARJETA BENTO DEL PÓSTER */}
            <Motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
                onClick={() => setIsPosterOpen(true)}
                className="lg:col-span-4 rounded-3xl border border-zinc-800/80 shadow-2xl relative overflow-hidden group cursor-zoom-in min-h-[400px] lg:min-h-full"
            >
                {/* Overlay para hacer hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full border-2 border-white/50 flex items-center justify-center mb-3">
                        <span className="text-white text-2xl font-light">+</span>
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-[0.2em]">View Artwork</span>
                </div>

                {/* Etiquetas sobre la imagen */}
                <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 pointer-events-none">
                    <span className="bg-black/80 backdrop-blur-md text-white px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md border border-white/10 w-fit">
                        Featured
                    </span>
                    <span className="text-white drop-shadow-md text-xs font-black italic uppercase tracking-widest">
                        Japanese Ink Collection
                    </span>
                </div>

                <img 
                    src={posterSrc} 
                    alt={altText}
                    className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transform group-hover:scale-105 transition-all duration-700 z-0"
                />
            </Motion.div>

            {/* MODAL DEL PÓSTER AMPLIADO (TELETRANSPORTADO AL BODY) */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isPosterOpen && (
                        <Motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-12 cursor-zoom-out"
                            onClick={() => setIsPosterOpen(false)}
                        >
                            <button className="absolute top-8 right-8 text-zinc-500 hover:text-white font-mono text-sm tracking-widest uppercase transition-colors flex items-center gap-2 z-50">
                                <span>Close</span>
                                <div className="w-8 h-px bg-current"></div>
                            </button>
                            <Motion.img
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                src={posterSrc}
                                alt={`${altText} Full`}
                                className="max-h-full max-w-full object-contain rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.15)] border border-zinc-800 relative z-40"
                            />
                        </Motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}