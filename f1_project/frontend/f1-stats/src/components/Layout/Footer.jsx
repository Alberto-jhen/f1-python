import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faInstagram, faYoutube, faGithub } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';

export const Footer = () => {
    return (
        // Usamos zinc-950 para un negro con clase y un borde sutil en slate-800
        <footer className="bg-[#09090b] text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-1">
                        <h3 className="text-white text-2xl font-black italic tracking-tighter mb-4">
                            F1<span className="text-red-600">INSIGHTS</span>
                        </h3>
                        <p className="text-sm leading-relaxed">
                            Estadísticas avanzadas y telemetría histórica. 
                            La fuente definitiva para el análisis de Racing.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Privacidad</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Términos</a></li>
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Cookies</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Soporte</h4>
                        <ul className="space-y-4 text-sm">
                            <Link to="/form">
                                <li><p className="hover:text-cyan-400 transition-colors">Formulario de contacto</p></li>
                            </Link>
                        </ul>
                    </div>

                    {/* Social - Iconos con un fondo circular sutil */}
                    <div className="flex flex-col items-start md:items-end">
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Social</h4>
                        <div className="flex gap-4">
                            {[faTwitter, faInstagram, faYoutube, faGithub].map((icon, index) => (
                                <a key={index} href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center hover:bg-cyan-400 hover:text-slate-950 transition-all duration-300">
                                    <FontAwesomeIcon icon={icon} />
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
        </footer>
    );
}