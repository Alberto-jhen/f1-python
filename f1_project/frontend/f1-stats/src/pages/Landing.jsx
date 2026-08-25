import React, { useEffect, useRef, useState } from 'react';
import loginVideo from '../assets/login-video3.mp4';
import fallbackPoster from '../assets/m_naco_japanese_ink_20260604_024047.png';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import useNextRace from '@/hooks/useNextRace';
import BentoLeaderboard from '@/components/BentoLeaderBoard';
import PosterCard from '../components/PosterCard';
import { Link } from "react-router-dom";

import { getCircuitVisualInfo } from '@/service/apiService'; 

export default function Landing() {
    const rollingRef = useRef(null);
    const { nextRace } = useNextRace();
    const [countdown, setCountdown] = useState({ days: '--', hours: '--', mins: '--', secs: '--' });
    
    // 2. NUEVO ESTADO PARA LA INFO DINÁMICA DEL CIRCUITO
    const [circuitVisuals, setCircuitVisuals] = useState(null);

    // Live countdown to the next race
    useEffect(() => {
        if (!nextRace?.date) return;

        const tick = () => {
            const diff = nextRace.date - new Date();
            if (diff <= 0) {
                setCountdown({ days: '0', hours: '0', mins: '0', secs: '0' });
                return;
            }
            setCountdown({
                days: String(Math.floor(diff / 86400000)),
                hours: String(Math.floor((diff % 86400000) / 3600000)),
                mins: String(Math.floor((diff % 3600000) / 60000)),
                secs: String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'),
            });
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [nextRace]);

    // 3. FETCH DE DATOS VISUALES AL DETECTAR LA PRÓXIMA CARRERA
    useEffect(() => {
        async function fetchVisuals() {
            if (nextRace?.round && nextRace?.date) {
                const year = nextRace.date.getFullYear();
                const round = nextRace.round;
                
                // Llamamos a la API de FastAPI que consulta a Supabase
                const data = await getCircuitVisualInfo(year, round);
                if (data) {
                    setCircuitVisuals(data);
                }
            }
        }
        fetchVisuals();
    }, [nextRace]);

    // Las 11 escuderías de la parrilla 2026
    const teams = [
        { name: "Ferrari", drivers: "Leclerc - Hamilton", gradient: "from-red-600/20", border: "border-red-600", short: "FER", logo: "/logos/ferrari.png" },
        { name: "McLaren", drivers: "Norris - Piastri", gradient: "from-orange-500/20", border: "border-orange-500", short: "MCL", logo: "/logos/mclaren.svg" },
        { name: "Red Bull", drivers: "Verstappen - Hadjar", gradient: "from-blue-600/20", border: "border-blue-600", short: "RBR", logo: "/logos/redbull.svg" },
        { name: "Mercedes", drivers: "Russell - Antonelli", gradient: "from-teal-500/20", border: "border-teal-500", short: "MER", logo: "/logos/mercedes.png" },
        { name: "Aston Martin", drivers: "Alonso - Stroll", gradient: "from-green-600/20", border: "border-green-600", short: "AMR", logo: "/logos/aston-martin.svg" },
        { name: "Williams", drivers: "Albon - Sainz", gradient: "from-blue-400/20", border: "border-blue-400", short: "WIL", logo: "/logos/williams.png" },
        { name: "Alpine", drivers: "Gasly - Colapinto", gradient: "from-pink-500/20", border: "border-pink-500", short: "ALP", logo: "/logos/alpine.png" },
        { name: "Haas", drivers: "Ocon - Bearman", gradient: "from-gray-500/20", border: "border-gray-500", short: "HAA", logo: "/logos/haas.png" },
        { name: "Racing Bulls", drivers: "Lawson - Lindblad", gradient: "from-blue-500/20", border: "border-blue-500", short: "VCARB", logo: "/logos/vcarb.png" },
        { name: "Audi", drivers: "Hülkenberg - Bortoleto", gradient: "from-slate-400/20", border: "border-slate-400", short: "AUD", logo: "/logos/audi.svg" },
        { name: "Cadillac", drivers: "Bottas - Pérez", gradient: "from-yellow-500/20", border: "border-yellow-500", short: "CAD", logo: "/logos/cadillac.png" },
    ];

    const items = [...teams, ...teams];

    useEffect(() => {
        const el = rollingRef.current;
        const animation = gsap.to(el, {
            xPercent: -50,
            duration: 30,
            ease: "none",
            repeat: -1,
        });

        const handleMouseEnter = (e) => {
            animation.pause();
            const card = e.target.closest('.f1-card');
            if (card) gsap.to(card, { y: -10, scale: 1.02, duration: 0.4, ease: "power2.out" });
        };

        const handleMouseLeave = (e) => {
            animation.play();
            const card = e.target.closest('.f1-card');
            if (card) gsap.to(card, { y: 0, scale: 1, duration: 0.4, ease: "power2.out" });
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
        <div className="bg-[#050505] min-h-screen font-sans selection:bg-red-600 selection:text-white relative">
            
            {/* HERO SECTION */}
            <div className="relative h-screen w-full overflow-hidden flex flex-col items-center justify-center">
                <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-40 mix-blend-screen">
                    <source src={loginVideo} type="video/mp4" />
                </video>
                
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:24px_24px] z-10 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_20%,transparent_100%)]"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-[#050505] z-10"></div>
                
                <div className="relative z-20 flex flex-col items-center text-center px-4 mt-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="flex flex-col items-center"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="h-[1px] w-12 bg-red-600"></span>
                            <span className="text-red-500 text-xs font-mono tracking-[0.3em] uppercase font-bold">Telemetry Engine</span>
                            <span className="h-[1px] w-12 bg-red-600"></span>
                        </div>
                        <h1 className="text-7xl md:text-[9rem] font-black italic tracking-tighter mb-2 text-white leading-none">
                            F1<span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]">INSIGHTS</span>
                        </h1>
                        <p className="text-sm md:text-lg uppercase tracking-[0.6em] font-light text-zinc-400 mb-12">
                            Precision in every millisecond
                        </p>
                        
                        <button className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-none border border-zinc-700 hover:border-red-600 transition-colors duration-300">
                            <div className="absolute inset-0 w-0 bg-red-600 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
                            <span className="relative text-white font-mono font-bold uppercase tracking-widest text-xs group-hover:text-black transition-colors duration-300 flex items-center gap-3">
                                Entrar al Paddock <span className="text-lg leading-none group-hover:translate-x-1 transition-transform">→</span>
                            </span>
                        </button>
                    </motion.div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl z-30"
                >
                    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-wrap justify-around items-center gap-4">
                        {[
                            { label: "Track Temp", val: "42.5°C", icon: "🌡️" },
                            { label: "Humidity", val: "12%", icon: "💧" },
                            { label: "Wind", val: "14.2 km/h", icon: "💨" },
                            { label: "Air Temp", val: "28.1°C", icon: "☁️" }
                        ].map((stat, i) => (
                            <div key={i} className="flex items-center gap-4 group">
                                <span className="text-xl opacity-50 grayscale group-hover:grayscale-0 transition-all">{stat.icon}</span>
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest font-mono mb-1">{stat.label}</span>
                                    <span className="text-lg md:text-xl font-black italic text-white uppercase tracking-tight">{stat.val}</span>
                                </div>
                                {i !== 3 && <div className="hidden md:block w-px h-8 bg-zinc-800 ml-8"></div>}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ROLLING TEAMS */}
            <div className='w-full bg-[#050505] h-[40vh] flex flex-col justify-center overflow-hidden relative border-t border-zinc-900 pt-10'>
                <div className='absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none' />
                <div className='absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none' />
                
                <div ref={rollingRef} className='flex w-fit gap-6 px-3 items-center h-full'>
                    {items.map((team, index) => (
                        <div key={index} className={`f1-card w-[320px] h-48 shrink-0 bg-gradient-to-br ${team.gradient} to-zinc-900/50 border border-zinc-800/80 border-b-4 ${team.border} rounded-2xl p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden backdrop-blur-sm`}>
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 opacity-10 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none flex items-center justify-center">
                                <img 
                                    src={team.logo} 
                                    alt={`${team.name} Logo`} 
                                    className="w-full h-full object-contain invert brightness-0" 
                                    onError={(e) => { 
                                        e.currentTarget.style.display = 'none'; 
                                        e.currentTarget.nextElementSibling.style.display = 'block'; 
                                    }} 
                                />
                                <span className="hidden text-[100px] font-black italic text-white">{team.short}</span>
                            </div>
                            
                            <div className="flex justify-between items-start z-10">
                                <span className='text-zinc-300 text-[10px] uppercase font-bold tracking-widest font-mono bg-black/60 px-3 py-1.5 rounded-md border border-zinc-700/50 backdrop-blur-md'>
                                    {team.drivers}
                                </span>
                                <div className="w-2 h-2 rounded-full bg-current group-hover:bg-red-500/40 transition-colors -translate-y-2 translate-x-2"></div>
                            </div>
                            
                            <div className="z-10">
                                <span className="text-zinc-500 font-mono text-[9px] font-bold block mb-1 uppercase tracking-widest">F1 Team</span>
                                <h3 className='text-white text-3xl font-black italic uppercase tracking-tighter group-hover:translate-x-2 transition-transform leading-none'>
                                    {team.name}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* BENTO GRID HUB */}
            <div className="bg-[#050505] pt-24 px-6 relative border-t border-zinc-900/50">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                    
                    {/* BENTO ITEM 1: THE EVENT & COUNTDOWN */}
                    <motion.div 
                        whileInView={{ opacity: 1, y: 0 }}
                        initial={{ opacity: 0, y: 20 }}
                        viewport={{ once: true }}
                        className="lg:col-span-8 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 p-8 md:p-12 shadow-2xl relative overflow-hidden group flex flex-col justify-center"
                    >
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-500/20 via-transparent to-transparent pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                        <div className="relative z-10">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                                    Next Race
                                </span>
                                {nextRace && (
                                    <span className="text-zinc-500 text-xs uppercase font-mono tracking-widest">
                                        Round {nextRace.round} • {nextRace.date.toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                )}
                            </div>
                            
                            {/* 4. TÍTULO DEL CIRCUITO DINÁMICO */}
                            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white mb-4 leading-none">
                                {nextRace ? nextRace.name : 'Loading Event...'} <br />
                                <span className="text-red-600">{nextRace ? nextRace.date.getFullYear() : '2026'}</span>
                            </h2>
                            
                            {/* 5. DESCRIPCIÓN DINÁMICA DESDE SUPABASE */}
                            <p className="text-zinc-400 text-sm md:text-base mb-10 leading-relaxed max-w-xl">
                                {circuitVisuals?.description || "Iniciando sistemas de telemetría para el próximo Gran Premio. En cuanto caiga la bandera a cuadros, procesaremos los datos para que puedas diseccionar cada milisegundo de la carrera en nuestro motor interactivo."}
                            </p>

                            {nextRace ? (
                                <div className="grid grid-cols-4 gap-4 mb-10 w-full max-w-lg">
                                    {[
                                        { label: 'Days', val: countdown.days },
                                        { label: 'Hours', val: countdown.hours },
                                        { label: 'Mins', val: countdown.mins },
                                        { label: 'Secs', val: countdown.secs },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-black/60 p-4 rounded-2xl border border-zinc-800 text-center backdrop-blur-sm shadow-inner relative overflow-hidden group-hover:border-zinc-700 transition-colors">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            <span className="text-3xl font-black italic text-white block mb-1">{item.val}</span>
                                            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-24 w-full max-w-lg bg-zinc-800/50 rounded-2xl animate-pulse mb-10" />
                            )}

                            {/* 6. ESTADÍSTICAS TÉCNICAS DINÁMICAS DESDE SUPABASE */}
                            <div className="flex flex-wrap gap-8 items-center border-t border-zinc-800/50 pt-8">
                                <div>
                                    <p className="text-white font-mono font-black text-xl">
                                        {circuitVisuals?.length_km ? `${circuitVisuals.length_km} km` : '--'}
                                    </p>
                                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest mt-1">Circuit Length</p>
                                </div>
                                <div className="h-8 w-px bg-zinc-800" />
                                <div>
                                    <p className="text-white font-mono font-black text-xl">
                                        {circuitVisuals?.lap_record || '--'}
                                    </p>
                                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest mt-1">Lap Record</p>
                                </div>
                                <div className="h-8 w-px bg-zinc-800" />
                                <div>
                                    <p className="text-white font-mono font-black text-xl">
                                        {circuitVisuals?.total_laps ? `${circuitVisuals.total_laps} Laps` : '--'}
                                    </p>
                                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest mt-1">Race Distance</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* BENTO ITEM 2: POSTER ARTWORK DINÁMICO */}
                    <PosterCard 
                        posterSrc={circuitVisuals?.poster_url || fallbackPoster} 
                        altText={`${nextRace?.name || 'Grand Prix'} Poster`} 
                    />
                </div>
            </div>

            {/* SECCIÓN STANDINGS */}
            <BentoLeaderboard />

            {/* INSIDE THE PLATFORM */}
            <div className="bg-[#050505] py-32 px-6 relative overflow-hidden border-t border-zinc-900/50">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                    <motion.div 
                        whileInView={{ opacity: 1, x: 0 }}
                        initial={{ opacity: 0, x: -50 }}
                        viewport={{ once: true }}
                        className="order-2 lg:order-1"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                            <h4 className="text-zinc-400 font-mono uppercase tracking-[0.3em] text-xs font-bold">Inside the platform</h4>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 leading-[0.9] text-white">
                            Más allá del <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-500 to-zinc-700">espectáculo visual.</span>
                        </h2>
                        <div className="space-y-6 text-zinc-400 leading-relaxed font-medium text-lg">
                            <p>
                                <strong className="text-white">F1INSIGHTS</strong> no es solo una página de resultados. Es una herramienta de ingeniería que procesa miles de puntos de datos por segundo utilizando la API de <strong className="text-red-500">FastF1</strong> y algoritmos personalizados.
                            </p>
                            <p>
                                Traducimos la complejidad técnica del Paddock en visualizaciones interactivas de alto rendimiento renderizadas a 60FPS.
                            </p>
                        </div>
                        
                        <div className="mt-12 grid grid-cols-2 gap-6">
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-600 transition-colors">
                                <div className="text-red-500 mb-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                                </div>
                                <p className="text-white font-black italic text-xl tracking-tighter">PYTHON + REACT</p>
                                <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mt-1">Core Architecture</p>
                            </div>
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-600 transition-colors">
                                <div className="text-red-500 mb-2">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                                </div>
                                <p className="text-white font-black italic text-xl tracking-tighter">100% RAW DATA</p>
                                <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mt-1">Official Telemetry</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileInView={{ opacity: 1, scale: 1 }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        viewport={{ once: true }}
                        className="order-1 lg:order-2 relative"
                    >
                        <div className="relative rounded-3xl p-2 bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-800 shadow-2xl">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500/50 -translate-x-1 -translate-y-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500/50 translate-x-1 -translate-y-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500/50 -translate-x-1 translate-y-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500/50 translate-x-1 translate-y-1"></div>
                            
                            <img
                                src="https://images.unsplash.com/photo-1547915720-307cc299b8b7?q=80&w=2070&auto=format&fit=crop" 
                                alt="F1 Telemetry Insight"
                                className="rounded-2xl grayscale-[0.5] hover:grayscale-0 transition-all duration-700 w-full"
                            />
                            
                            <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md border border-zinc-700/50 p-6 rounded-xl flex justify-between items-center">
                                <div>
                                    <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest font-mono mb-1">Delta Precision</p>
                                    <p className="text-3xl font-black italic text-white leading-none">0.001<span className="text-red-500 text-lg ml-1">sec</span></p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-1 h-8 bg-red-600 rounded-full animate-pulse"></div>
                                    <div className="w-1 h-12 bg-red-600/60 rounded-full"></div>
                                    <div className="w-1 h-6 bg-red-600/30 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* FOOTER BANNER ACCIÓN */}
            <div className="w-full bg-gradient-to-r from-red-700 to-red-600 py-20 relative overflow-hidden">
                <div className="absolute top-1/2 left-0 w-[120%] -translate-y-1/2 -rotate-3 opacity-10 pointer-events-none mix-blend-overlay">
                    <div className="flex whitespace-nowrap text-[8rem] font-black italic uppercase text-black">
                        TELEMETRY LIVE • RAW DATA • LERP ENGINE • TELEMETRY LIVE • 
                    </div>
                </div>
                
                <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-2">¿Listo para el análisis?</h2>
                        <p className="text-red-200 font-mono text-sm uppercase tracking-widest">Entra al simulador 2D interactivo.</p>
                    </div>
                    <Link to="/replays">
                        <button className="group cursor-pointer relative px-10 py-5 bg-black overflow-hidden rounded-xl border border-transparent hover:border-white/20 transition-colors duration-300 shadow-2xl">
                            <div className="absolute inset-0 w-full h-full bg-white scale-x-0 origin-left transition-transform duration-300 ease-out group-hover:scale-x-100"></div>
                            <span className="relative text-white font-black uppercase italic tracking-widest group-hover:text-black transition-colors duration-300 flex items-center gap-3">
                                Explorar Replays
                            </span>
                        </button>
                    </Link>
                </div>
            </div>
            
            <footer className="py-12 bg-black border-t border-zinc-900 text-center flex flex-col items-center gap-4">
                <div className="flex gap-4">
                    <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                    <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                    <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                </div>
                <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em]">F1Insights © 2026 • Powered by FastF1 & React</p>
            </footer>
        </div>
    );
}