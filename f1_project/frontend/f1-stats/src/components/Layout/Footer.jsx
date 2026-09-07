import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faInstagram, faYoutube, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';

export const Footer = () => {
    // Estado para controlar la visibilidad del modal legal
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

    const socialLinks = [
        { icon: faTwitter, url: "https://twitter.com/tu_usuario" },
        { icon: faInstagram, url: "https://instagram.com/tu_usuario" },
        { icon: faYoutube, url: "https://youtube.com/@tu_canal" },
        { icon: faGithub, url: "https://github.com/tu_usuario" },
        { icon: faLinkedin, url: "https://www.linkedin.com/in/alberto-mor%C3%A1n-reina-489150337/" }
    ];

    return (
        <footer className="bg-[#09090b] text-slate-400 py-12 border-t border-slate-800 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <h3 className="text-white text-2xl font-black italic tracking-tighter mb-4">
                            F1<span className="text-red-600">INSIGHTS</span>
                        </h3>
                        <p className="text-sm leading-relaxed">
                            Estadísticas avanzadas y telemetría histórica. 
                            La fuente definitiva para el análisis de Racing.
                        </p>
                    </div>                    

                    {/* Legal Section */}
                    <div>
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm flex flex-col items-start">
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacidad</a></li>
                            {/* Cambiamos el enlace estático por un botón que abre el modal */}
                            <li>
                                <button 
                                    onClick={() => setIsLegalModalOpen(true)}
                                    className="hover:text-cyan-400 transition-colors text-left"
                                >
                                    Términos y Licencias
                                </button>
                            </li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Cookies</a></li>
                        </ul>
                    </div>

                    {/* Soporte Section */}
                    <div>
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Soporte</h4>
                        <ul className="space-y-4 text-sm">
                            <Link to="/form" className="block">
                                <li className="hover:text-cyan-400 transition-colors">Formulario de contacto</li>
                            </Link>
                        </ul>
                    </div>

                    {/* Sobre mí Section */}
                    <div className="lg:col-span-1">
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Sobre mí</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Trayectoria</a></li>
                        </ul>
                    </div>

                    {/* Social Section */}
                    <div className="flex flex-col items-start lg:items-end">
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Social</h4>
                        <div className="flex flex-wrap gap-4">
                            {socialLinks.map((item, index) => (
                                <a 
                                    key={index} 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-cyan-400 hover:text-slate-950 transition-all duration-300"
                                >
                                    <FontAwesomeIcon icon={item.icon} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>© 2026 F1 INSIGHTS. DATA PROVIDED BY FASTF1 & OPENF1.</p>
                    <p className="tracking-widest uppercase text-slate-500">Keep Pushing.</p>
                </div>
            </div>

            {/* MODAL LEGAL */}
            {isLegalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#09090b] border border-slate-800 text-slate-300 rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                        
                        {/* Header del Modal */}
                        <div className="flex justify-between items-center p-6 border-b border-slate-800">
                            <h2 className="text-xl font-black italic tracking-tight text-white uppercase">Aviso Legal y <span className="text-red-600">Licencias</span></h2>
                            <button 
                                onClick={() => setIsLegalModalOpen(false)}
                                className="text-slate-500 hover:text-white text-2xl leading-none transition-colors"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Contenido Scrolleable */}
                        <div className="p-6 overflow-y-auto space-y-8 text-sm">
                            <section>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-white mb-3">Proyecto Académico</h3>
                                <p className="leading-relaxed">
                                    F1 Insights es un Trabajo de Fin de Grado (TFG) desarrollado para el Grado en Ingeniería Informática de la Universidad de León. 
                                    Esta plataforma es de carácter estrictamente académico, educativo y sin fines de lucro.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-white mb-3">Disclaimer (FIA / FOM)</h3>
                                <p className="leading-relaxed text-slate-400 italic">
                                    This website is unofficial and is not associated in any way with the Formula 1 companies. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trade marks of Formula One Licensing B.V.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-white mb-3">Fuentes de Datos</h3>
                                <ul className="space-y-2 text-slate-400">
                                    <li><span className="text-cyan-400 font-semibold">FastF1:</span> Utilizado para el análisis de telemetría y tiempos por vuelta.</li>
                                    <li><span className="text-cyan-400 font-semibold">OpenF1 & Jolpica:</span> Proveedores de datos históricos y clasificaciones oficiales.</li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold tracking-widest uppercase text-white mb-3">Licencia MIT</h3>
                                <p className="leading-relaxed text-slate-400 font-mono text-xs bg-slate-900 p-4 rounded border border-slate-800">
                                    Copyright (c) 2026 Alberto Morán Reina<br/><br/>
                                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...
                                </p>
                            </section>
                        </div>

                        {/* Footer del Modal */}
                        <div className="p-6 border-t border-slate-800 flex justify-end">
                            <button 
                                onClick={() => setIsLegalModalOpen(false)}
                                className="bg-white hover:bg-cyan-400 text-slate-950 font-bold px-6 py-2 rounded transition-colors uppercase tracking-widest text-xs"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </footer>
    );
}