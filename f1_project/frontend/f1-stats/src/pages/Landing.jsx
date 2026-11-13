import React, { useEffect, useRef, useState } from 'react';
import loginVideo from '../assets/login-video3.mp4';
import fallbackPoster from '../assets/m_naco_japanese_ink_20260604_024047.png';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import useNextRace from '@/hooks/useNextRace';
import BentoLeaderboard from '@/components/BentoLeaderBoard';
import PosterCard from '../components/PosterCard';
import MoltenMetal from '@/components/MoltenMetal';
import { Link } from "react-router-dom";
import { Helmet } from 'react-helmet-async';

import { getCircuitVisualInfo } from '@/service/apiService.ts'; 

export default function Landing() {
    const rollingRef = useRef(null);
    const { nextRace } = useNextRace();
    const [countdown, setCountdown] = useState({ days: '--', hours: '--', mins: '--', secs: '--' });
    
    const [circuitVisuals, setCircuitVisuals] = useState(null);

    const redirectRef = useRef(null);

    const redirectToSection = () => {
        redirectRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }


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

    useEffect(() => {
        async function fetchVisuals() {
            if (nextRace?.round && nextRace?.date) {
                const year = nextRace.date.getFullYear();
                const round = nextRace.round;
                
                const data = await getCircuitVisualInfo(year, round);
                if (data) {
                    setCircuitVisuals(data);
                }
            }
        }
        fetchVisuals();
    }, [nextRace]);

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
        <>
            <Helmet>
                <title>F1 Insights - Inicio</title>
                <meta name="description" content="Explora F1 Insights: visualización de telemetría, estadísticas de pilotos, predicciones de resultados a través de modelos de IA y mucho más." />
                <meta name="keywords" content="F1, Fórmula 1, telemetría, estadísticas, pilotos, predicciones, IA, análisis de carreras" />
                <meta name="robots" content="index, follow" />
                <meta name="theme-color" content="#050505" />

                <meta property="og-type" content="website" />
                <meta property="og-title" content="F1 Insights - Inicio" />
                <meta property="og-description" content="Explora F1 Insights: visualización de telemetría, estadísticas de pilotos, predicciones de resultados a través de modelos de IA y mucho más." />
                
            </Helmet>
            <div className="relative isolate min-h-screen bg-[#050505] font-sans selection:bg-red-600 selection:text-white">
                <div className="fixed inset-0 z-0 overflow-hidden bg-[#050505] pointer-events-none" aria-hidden="true">
                    <MoltenMetal
                        colors={['#d42d23', '#d42d23', '#f3b51c', '#e75b23']}
                        coreColor="#ffffff"
                        backgroundColor="transparent"
                        colorMode="ember"
                        speed={0.20}
                        scale={3.4}
                        detail={3}
                        glow={1.55}
                        thickness={0.85}
                        turbulence={0.25}
                        haze={0.7}
                        brightness={0.80}
                        opacity={0.62}
                        dpr={1.25}
                        intro={false}
                        mouseInteraction={false}
                        flareOnClick={false}
                        className="pointer-events-none"
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>

                <div className="relative z-10">
                
                {/* HERO SECTION */}
                <div className="relative isolate h-screen w-full overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute inset-0 z-0 bg-[#050505] pointer-events-none" aria-hidden="true" />
                    <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-[1] opacity-40 mix-blend-screen">
                        <source src={loginVideo} type="video/mp4" />
                    </video>
                    
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:24px_24px] z-10 mask-[radial-gradient(ellipse_80%_50%_at_50%_50%,#000_20%,transparent_100%)]"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-[#050505]/75 z-10"></div>
                    
                    <div className="relative z-20 flex flex-col items-center text-center px-4 mt-20">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <span className="h-[1px] w-12 bg-red-600"></span>
                                <span className="text-red-500 text-xs font-mono tracking-[0.3em] uppercase font-bold">Motor de telemetría</span>
                                <span className="h-[1px] w-12 bg-red-600"></span>
                            </div>
                            <h1 className="text-7xl md:text-[9rem] font-black italic tracking-tighter mb-2 text-white leading-none">
                                F1<span className="text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]">INSIGHTS</span>
                            </h1>
                            <p className="text-sm md:text-lg uppercase tracking-[0.6em] font-light text-zinc-400 mb-12">
                                Precisión en cada milisegundo
                            </p>
                            
                            <button 
                            onClick={redirectToSection}
                            className="cursor-pointer group relative px-8 py-4 bg-transparent overflow-hidden rounded-none border border-zinc-700 hover:border-red-600 transition-colors duration-300">
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
                    </motion.div>
                </div>

                {/* ROLLING TEAMS */}
                <div className='w-full bg-transparent h-[40vh] flex flex-col justify-center overflow-hidden relative border-t border-zinc-900 pt-10'>
                    <div className='absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none' />
                    <div className='absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none' />
                    <div className="absolute top-5 left-6 z-30 flex items-center gap-3">
                        <span className="h-px w-6 bg-red-500" />
                        <span className="text-[#e5dfd3] text-[9px] font-mono font-bold uppercase tracking-[0.24em]">La parrilla de F1</span>
                    </div>
                    
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
                                    <span className='text-zinc-950 text-[10px] uppercase font-bold tracking-widest font-mono bg-[#f2efe8]/95 px-3 py-1.5 rounded-md border border-white/70 backdrop-blur-md'>
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
                <div 
                ref={redirectRef}
                className="bg-transparent pt-24 px-6 relative border-t border-zinc-900/50">
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
                                        <span className="text-[#c9c1b5] text-xs uppercase font-mono tracking-widest">
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
                                <p className="text-zinc-300 text-sm md:text-base mb-10 leading-relaxed max-w-xl">
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
                                            <div key={i} className="bg-[#f2efe8] p-4 rounded-2xl border border-[#ded6c9] text-center shadow-inner relative overflow-hidden group-hover:border-white transition-colors">
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <span className="text-3xl font-black italic text-zinc-950 block mb-1">{item.val}</span>
                                                <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">{item.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-24 w-full max-w-lg bg-[#f2efe8]/10 border border-[#f2efe8]/10 rounded-2xl animate-pulse mb-10" />
                                )}

                                {/* 6. ESTADÍSTICAS TÉCNICAS DINÁMICAS DESDE SUPABASE */}
                                <div className="flex flex-wrap gap-8 items-center border-t border-[#f2efe8]/20 pt-8">
                                    <div>
                                        <p className="text-white font-mono font-black text-xl">
                                            {circuitVisuals?.length_km ? `${circuitVisuals.length_km} km` : '--'}
                                        </p>
                                        <p className="text-[#c9c1b5] text-[10px] uppercase font-bold tracking-widest mt-1">Circuit Length</p>
                                    </div>
                                    <div className="h-8 w-px bg-[#f2efe8]/20" />
                                    <div>
                                        <p className="text-white font-mono font-black text-xl">
                                            {circuitVisuals?.lap_record || '--'}
                                        </p>
                                        <p className="text-[#c9c1b5] text-[10px] uppercase font-bold tracking-widest mt-1">Lap Record</p>
                                    </div>
                                    <div className="h-8 w-px bg-zinc-800" />
                                    <div>
                                        <p className="text-white font-mono font-black text-xl">
                                            {circuitVisuals?.total_laps ? `${circuitVisuals.total_laps} Laps` : '--'}
                                        </p>
                                        <p className="text-[#c9c1b5] text-[10px] uppercase font-bold tracking-widest mt-1">Race Distance</p>
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
                <div className="relative z-10 px-6 py-7 md:py-9">
                    <div className="max-w-7xl mx-auto flex items-center gap-4">
                        <span className="text-red-500 font-mono text-sm" aria-hidden="true">↘</span>
                        <p className="text-[#e5dfd3] text-[10px] md:text-xs font-mono uppercase tracking-[0.18em]">
                            La clasificación cuenta el resultado. La pista, cómo se llegó hasta ahí.
                        </p>
                        <span className="hidden sm:block h-px flex-1 bg-gradient-to-r from-[#e5dfd3]/25 to-transparent" aria-hidden="true" />
                    </div>
                </div>

                {/* RACE STORIES */}
                <section className="relative overflow-hidden bg-transparent py-20 md:py-28">
                    <div className="absolute top-1/4 left-0 h-72 w-72 rounded-full bg-red-950/20 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-950/20 blur-[140px] pointer-events-none" />

                    <div className="relative z-10 space-y-8 md:space-y-10">
                        <motion.div
                            whileInView={{ opacity: 1, x: 0 }}
                            initial={{ opacity: 0, x: -40 }}
                            viewport={{ once: true }}
                            className="w-[calc(100%-1rem)] md:w-[94%] bg-[#f2efe8] py-6 pl-5 pr-5 sm:py-8 sm:pl-8 sm:pr-8 md:py-10 md:pl-12 md:pr-10 xl:py-14 xl:pl-16 xl:pr-14 rounded-r-[1.75rem] text-zinc-950"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 lg:gap-10 xl:gap-14 items-center">
                                <div>
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-red-600 font-mono text-[10px] font-black">01</span>
                                        <span className="h-px w-6 bg-red-500" />
                                        <span className="text-zinc-800 font-mono uppercase tracking-[0.22em] text-[10px] font-bold">Dentro de la pista</span>
                                    </div>
                                    <h2 className="text-5xl md:text-6xl xl:text-7xl font-black italic uppercase tracking-tighter leading-[0.88]">
                                        La Fórmula <br />de la emoción.
                                    </h2>
                                    <p className="mt-5 max-w-lg text-sm md:text-base text-zinc-600 leading-relaxed">
                                        Cada milésima cuenta. Sigue el calendario, revive los resultados y descubre dónde se decide cada carrera.
                                    </p>

                                    <div className="mt-8 border-t border-zinc-900/10">
                                        {[
                                            { title: "Calendario de Grandes Premios", detail: "Cada cita, cada circuito", to: "/globe-calendar" },
                                            { title: "Resultados y clasificación", detail: "La lucha por el título", to: "/leaderboard" },
                                            { title: "Explora la pista", detail: "Curva a curva", to: "/replays" },
                                        ].map((item) => (
                                            <Link
                                                key={item.title}
                                                to={item.to}
                                                className="group flex items-center gap-3 border-b border-zinc-900/10 py-3 text-sm"
                                            >
                                                <span className="font-semibold">{item.title}</span>
                                                <span className="ml-auto hidden text-xs text-zinc-500 sm:block">{item.detail}</span>
                                                <span className="text-red-600 transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative aspect-[16/10] min-h-[240px] overflow-hidden rounded-xl bg-zinc-900">
                                    <img
                                        src="https://media.formula1.com/image/upload/t_16by9North/c_lfill,w_3392/q_auto/v1740000001/trackside-images/2026/F1_Grand_Prix_of_Italy/2293801891.webp"
                                        alt="Un monoplaza en plena carrera"
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-4 sm:p-6">
                                        <div>
                                            <span className="mb-3 block h-1 w-8 bg-red-500" />
                                            <p className="text-xl md:text-2xl font-black italic uppercase text-white leading-tight">Puro instinto.<br />Máxima precisión.</p>
                                        </div>
                                        <span className="shrink-0 text-[9px] font-mono uppercase tracking-[0.18em] text-white/80">F1 / En pista</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="mx-auto flex w-[calc(100%-2rem)] max-w-7xl items-center justify-center gap-4 py-2 sm:w-[86%]">
                            <span className="h-px w-5 shrink-0 animate-pulse bg-gradient-to-r from-transparent to-red-500/80 shadow-[0_0_8px_rgba(255,45,45,0.35)] sm:w-auto sm:flex-1" aria-hidden="true" />
                            <p className="whitespace-nowrap text-center text-[8px] font-mono uppercase tracking-[0.08em] text-[#e5dfd3] sm:text-[10px] sm:tracking-[0.16em]">
                                Del semáforo <span className="text-red-400">→</span> a la bandera a cuadros
                            </p>
                            <span className="h-px w-5 shrink-0 animate-pulse bg-gradient-to-l from-transparent to-red-500/80 shadow-[0_0_8px_rgba(255,45,45,0.35)] [animation-delay:900ms] sm:w-auto sm:flex-1" aria-hidden="true" />
                        </div>

                        <motion.div
                            whileInView={{ opacity: 1, x: 0 }}
                            initial={{ opacity: 0, x: 40 }}
                            viewport={{ once: true }}
                            className="ml-auto w-[calc(100%-1rem)] md:w-[92%] rounded-l-[1.75rem] bg-[#e9e7e0] py-6 pl-5 pr-5 sm:py-8 sm:pl-8 sm:pr-8 md:py-10 md:pl-10 md:pr-12 xl:py-14 xl:pl-14 xl:pr-16 text-zinc-950"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-10 xl:gap-14 items-center">
                                <div className="relative order-2 lg:order-1 aspect-[16/10] min-h-[240px] overflow-hidden rounded-xl bg-zinc-900">
                                    <img
                                        src="https://media.formula1.com/image/upload/t_16by9North/c_lfill,w_3392/q_auto/v1740000001/trackside-images/2026/F1_Grand_Prix_of_Mexico/2303041340.webp"
                                        alt={`${nextRace?.name || "Gran Premio"}: el otro lado de la carrera`}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-4 sm:p-6">
                                        <div>
                                            <span className="mb-3 block h-1 w-8 bg-red-500" />
                                            <p className="text-xl md:text-2xl font-black italic uppercase text-white leading-tight">Nadie llega<br />solo a la meta.</p>
                                        </div>
                                        <span className="shrink-0 text-[9px] font-mono uppercase tracking-[0.18em] text-white/80">F1 / Entre bastidores</span>
                                    </div>
                                </div>

                                <div className="order-1 lg:order-2">
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-red-600 font-mono text-[10px] font-black">02</span>
                                        <span className="h-px w-6 bg-red-500" />
                                        <span className="text-zinc-800 font-mono uppercase tracking-[0.22em] text-[10px] font-bold">Más allá del asfalto</span>
                                    </div>
                                    <h2 className="text-5xl md:text-6xl xl:text-7xl font-black italic uppercase tracking-tighter leading-[0.88]">
                                        El otro lado <br />de la gloria.
                                    </h2>
                                    <p className="mt-5 max-w-lg text-sm md:text-base text-zinc-600 leading-relaxed">
                                        El talento al volante, el trabajo en equipo y las historias de quienes convierten la velocidad en leyenda.
                                    </p>

                                    <div className="mt-8 border-t border-zinc-900/10">
                                        {[
                                            { title: "Conoce a los pilotos", detail: "Talento sin límites", to: "/drivers" },
                                            { title: "Vota a tus favoritos", detail: "Tu voz en el paddock", to: "/ratings" },
                                            { title: "Revive momentos clave", detail: "Vuelve a la carrera", to: "/replays" },
                                        ].map((item) => (
                                            <Link
                                                key={item.title}
                                                to={item.to}
                                                className="group flex items-center gap-3 border-b border-zinc-900/10 py-3 text-sm"
                                            >
                                                <span className="font-semibold">{item.title}</span>
                                                <span className="ml-auto hidden text-xs text-zinc-500 sm:block">{item.detail}</span>
                                                <span className="text-red-600 transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

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
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-[0.2em]">F1Insights © 2026 • Vive cada vuelta</p>
                </footer>
                </div>
            </div>
        </>
    );
}