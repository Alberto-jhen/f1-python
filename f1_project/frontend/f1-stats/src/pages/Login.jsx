import React, { useEffect, useRef } from 'react';
import loginVideo from '../assets/login-video3.mp4';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

export default function Login() {
    const rollingRef = useRef(null);
    
    const drivers = [
        { name: "Norris", team: "McLaren", color: "border-orange-500" },
        { name: "Verstappen", team: "Red Bull", color: "border-blue-600" },
        { name: "Piastri", team: "McLaren", color: "border-orange-400" },
        { name: "Leclerc", team: "Ferrari", color: "border-red-600" },
        { name: "Hamilton", team: "Ferrari", color: "border-red-800" },
        { name: "Alonso", team: "Aston Martin", color: "border-green-600" },
    ];

    const items = [...drivers, ...drivers];

    useEffect(() => {
        const el = rollingRef.current;
        const animation = gsap.to(el, {
            xPercent: -50,
            duration: 12,
            ease: "none",
            repeat: -1,
        });

        const handleMouseEnter = (e) => {
            animation.pause();
            const card = e.target.closest('.f1-card');
            if (card) gsap.to(card, { scale: 1.05, duration: 0.3 });
        };

        const handleMouseLeave = (e) => {
            animation.play();
            const card = e.target.closest('.f1-card');
            if (card) gsap.to(card, { scale: 1, duration: 0.3 });
        };

        el.addEventListener("mouseenter", handleMouseEnter, true);
        el.addEventListener("mouseleave", handleMouseLeave, true);

        return () => {
            animation.kill();
            el.removeEventListener("mouseenter", handleMouseEnter, true);
            el.removeEventListener("mouseleave", handleMouseLeave, true);
        };
    }, []);

    return (
        <div className="bg-black min-h-screen font-sans selection:bg-red-600 selection:text-white">
            {/* HERO SECTION */}
            <div className="relative h-screen w-full overflow-hidden">
                <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-60">
                    <source src={loginVideo} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50 z-10"></div>
                <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-7xl md:text-9xl font-black italic tracking-tighter mb-4 text-white"
                    >
                        F1<span className="text-red-600">INSIGHTS</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-lg uppercase tracking-[0.5em] font-light text-slate-300"
                    >
                        Precision in every millisecond
                    </motion.p>
                    <button className="mt-8 px-10 py-3 bg-red-600 hover:bg-red-700 font-bold uppercase italic tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-600/20 text-white">
                        Entrar al Paddock
                    </button>
                </div>
            </div>

            {/* SECCIÓN 1: LIVE DATA TICKER */}
            <div className="border-y border-zinc-800 bg-zinc-900/30 backdrop-blur-md py-4">
                <div className="max-w-7xl mx-auto flex justify-around items-center px-6">
                    {[
                        { label: "Track Temp", val: "42.5°C" },
                        { label: "Humidity", val: "12%" },
                        { label: "Wind", val: "14.2 km/h" },
                        { label: "Air Temp", val: "28.1°C" }
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">{stat.label}</span>
                            <span className="text-xl font-black italic text-white uppercase">{stat.val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ROLLING DRIVERS */}
            <div className='w-full bg-black h-[40vh] flex flex-col justify-center overflow-hidden relative'>
                <div className='absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-black via-black/80 to-transparent z-10' />
                <div className='absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-black via-black/80 to-transparent z-10' />
                <div ref={rollingRef} className='flex w-fit gap-6 px-3'>
                    {items.map((driver, index) => (
                        <div key={index} className={`f1-card w-72 h-48 shrink-0 bg-zinc-900 border-b-4 ${driver.color} rounded-xl p-8 flex flex-col justify-end group hover:bg-zinc-800 transition-colors cursor-pointer`}>
                            <span className='text-zinc-500 text-[10px] uppercase font-bold tracking-tighter italic'>{driver.team}</span>
                            <h3 className='text-white text-4xl font-black italic uppercase tracking-tighter'>{driver.name}</h3>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN DE CONTRASTE: EL PROYECTO (FONDO BLANCO) */}
            <div className="bg-white py-24 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div 
                        whileInView={{ opacity: 1, x: 0 }}
                        initial={{ opacity: 0, x: -50 }}
                        className="relative"
                    >
                        {/* Imagen con fondo blanco / mock de telemetría */}
                        <div className="bg-slate-100 rounded-2xl p-4 shadow-2xl border border-slate-200">
                            <img 
                                src="https://images.unsplash.com/photo-1547915720-307cc299b8b7?q=80&w=2070&auto=format&fit=crop" 
                                alt="F1 Telemetry Insight"
                                className="rounded-xl grayscale hover:grayscale-0 transition-all duration-700"
                            />
                            <div className="absolute -bottom-6 -right-6 bg-red-600 p-6 text-white shadow-xl hidden md:block">
                                <p className="text-4xl font-black italic leading-none">0.001</p>
                                <p className="text-[10px] uppercase font-bold tracking-widest mt-1">Delta precision</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileInView={{ opacity: 1, x: 0 }}
                        initial={{ opacity: 0, x: 50 }}
                        className="text-black"
                    >
                        <h4 className="text-red-600 font-bold uppercase tracking-[0.3em] text-xs mb-4">Inside the platform</h4>
                        <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-8 leading-[0.9]">
                            Más allá del <span className="text-slate-400">espectáculo</span> visual.
                        </h2>
                        <div className="space-y-6 text-slate-600 leading-relaxed font-medium">
                            <p>
                                <strong>F1INSIGHTS</strong> no es solo una página de resultados. Es una herramienta de ingeniería que procesa miles de puntos de datos por segundo utilizando la API de <strong>FastF1</strong> y algoritmos personalizados en <strong>Python</strong>.
                            </p>
                            <p>
                                Desde la degradación de neumáticos en tiempo real hasta el análisis comparativo de telemetría en curvas lentas, nuestra plataforma traduce la complejidad del Paddock en visualizaciones interactivas de alto rendimiento.
                            </p>
                        </div>
                        
                        <div className="mt-10 grid grid-cols-2 gap-8 border-t border-slate-200 pt-10">
                            <div>
                                <p className="text-black font-black italic text-2xl tracking-tighter">PYTHON + REACT</p>
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Core Architecture</p>
                            </div>
                            <div>
                                <p className="text-black font-black italic text-2xl tracking-tighter">100% RAW DATA</p>
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Official Telemetry</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* SECCIÓN 2: NEXT RACE & STANDINGS PREVIEW */}
            <div className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <motion.div 
                    whileInView={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-[150px] font-black italic leading-none text-white">GP</span>
                    </div>
                    <span className="bg-red-600 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full mb-6 inline-block text-white">Next Race</span>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white mb-2">Abu Dhabi</h2>
                    <p className="text-zinc-400 font-medium mb-8 uppercase tracking-widest">Yas Marina Circuit • Dec 5-7</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                            <span className="text-[10px] text-zinc-500 uppercase block font-bold mb-1">Distance</span>
                            <span className="text-xl font-bold text-white italic uppercase">306.18 km</span>
                        </div>
                        <div className="bg-black/50 p-4 rounded-xl border border-zinc-800">
                            <span className="text-[10px] text-zinc-500 uppercase block font-bold mb-1">Laps</span>
                            <span className="text-xl font-bold text-white italic uppercase">58</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div 
                    whileInView={{ opacity: 1, x: 0 }}
                    initial={{ opacity: 0, x: 50 }}
                    className="flex flex-col justify-center"
                >
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-6 border-l-4 border-red-600 pl-4">Championship Leaderboard</h3>
                    <div className="space-y-3">
                        {[
                            { pos: "01", name: "Max Verstappen", pts: "393", team: "Red Bull" },
                            { pos: "02", name: "Lando Norris", pts: "331", team: "McLaren" },
                            { pos: "03", name: "Charles Leclerc", pts: "307", team: "Ferrari" },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center bg-zinc-900/30 p-4 rounded-xl hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700 group">
                                <span className="text-red-600 font-black italic mr-6 text-xl">{item.pos}</span>
                                <div className="flex-1">
                                    <p className="text-white font-bold uppercase text-sm group-hover:text-red-500 transition-colors">{item.name}</p>
                                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{item.team}</p>
                                </div>
                                <span className="text-white font-black italic">{item.pts} PTS</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* FOOTER BANNER ACCIÓN */}
            <div className="w-full bg-red-600 py-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                     <div className="flex whitespace-nowrap text-9xl font-black italic uppercase text-black">
                        RACE MODE ON • RACE MODE ON • RACE MODE ON • RACE MODE ON • 
                     </div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">¿Listo para el análisis técnico?</h2>
                    <button className="px-12 py-4 bg-white text-black font-black uppercase italic tracking-widest hover:bg-black hover:text-white transition-all transform hover:skew-x-2">
                        Explorar Datos
                    </button>
                </div>
            </div>
            
            <footer className="py-12 bg-black border-t border-zinc-900 text-center">
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em]">F1Insights © 2026 • Powered by FastF1 & React</p>
            </footer>
        </div>
    );
}