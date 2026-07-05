import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// 1. Añadimos faLinkedin a la importación
import { faTwitter, faInstagram, faYoutube, faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';

export const Footer = () => {

    const socialLinks = [
        { icon: faTwitter, url: "https://twitter.com/tu_usuario" },
        { icon: faInstagram, url: "https://instagram.com/tu_usuario" },
        { icon: faYoutube, url: "https://youtube.com/@tu_canal" },
        { icon: faGithub, url: "https://github.com/tu_usuario" },
        { icon: faLinkedin, url: "https://www.linkedin.com/in/alberto-mor%C3%A1n-reina-489150337/" }
    ];

    return (
        <footer className="bg-[#09090b] text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6">
                {/* 2. Cambiamos el grid para adaptarlo a 5 columnas en pantallas grandes (lg) */}
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

                    <div className="lg:col-span-1">
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Sobre mí</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-cyan-400 transition-colors">Trayectoria</a></li>
                        </ul>
                    </div>

                    <div className="flex flex-col items-start lg:items-end">
                        <h4 className="text-white font-bold uppercase text-xs tracking-widest mb-6">Social</h4>
                        <div className="flex flex-wrap gap-4">
                            {/* 2. Mapeas el nuevo array de objetos */}
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
        </footer>
    );
}