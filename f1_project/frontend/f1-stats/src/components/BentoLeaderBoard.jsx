// src/components/Leaderboard.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchGlobalStandings } from '@/service/apiService';
import { Link } from 'react-router-dom';

const getTeamStyles = (teamName) => {
    const styles = {
        "Red Bull Racing": { color: "from-blue-900/40 to-transparent", border: "border-blue-900/50", textHover: "group-hover:text-blue-400" },
        "Red Bull": { color: "from-blue-900/40 to-transparent", border: "border-blue-900/50", textHover: "group-hover:text-blue-400" },
        "McLaren": { color: "from-orange-900/40 to-transparent", border: "border-orange-900/50", textHover: "group-hover:text-orange-400" },
        "Ferrari": { color: "from-red-900/40 to-transparent", border: "border-red-900/50", textHover: "group-hover:text-red-400" },
        "Mercedes": { color: "from-teal-900/40 to-transparent", border: "border-teal-900/50", textHover: "group-hover:text-teal-400" },
        "Aston Martin": { color: "from-green-900/40 to-transparent", border: "border-green-900/50", textHover: "group-hover:text-green-400" }
    };
    
    return styles[teamName] || { color: "from-zinc-800/40 to-transparent", border: "border-zinc-800/50", textHover: "group-hover:text-white" };
};

export default function BentoLeaderboard() {
    const [topDrivers, setTopDrivers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStandings() {
            setIsLoading(true);
            const data = await fetchGlobalStandings();
            
            if (data && data.length > 0) {
                // Only get the first 3 drivers.
                setTopDrivers(data.slice(0, 3));
            }
            setIsLoading(false);
        }
        
        loadStandings();
    }, []);

    return (
        <div className="bg-[#050505] px-6 py-20 pb-32">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-10 border-b border-zinc-800/50 pb-6">
                    <div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-4">
                            <span className="w-2 h-8 bg-red-600 block"></span>
                            Clasificación mundial de pilotos
                        </h3>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mt-2 ml-6">Top 3 pilotos</p>
                    </div>

                    <Link to="/leaderboard">
                        <button className="hidden cursor-pointer md:block text-zinc-400 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors">
                            Ver clasificación completa →
                        </button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {topDrivers.map((driver, i) => {
                            // Format the position: 1 -> 01
                            const posString = String(driver.position || i + 1).padStart(2, '0');
                            const teamStyle = getTeamStyles(driver.constructor || driver.team);
                            
                            return (
                                <motion.div 
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className={`bg-gradient-to-br ${teamStyle.color} bg-zinc-900/50 p-6 rounded-2xl border ${teamStyle.border} backdrop-blur-sm relative overflow-hidden group`}
                                >
                                    <div className="absolute -right-6 -top-10 text-[120px] font-black italic text-white/5 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
                                        {posString}
                                    </div>
                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-white/40 font-mono font-bold text-sm mb-2">{posString}</span>
                                            <h4 className={`text-xl font-black uppercase italic text-white transition-colors ${teamStyle.textHover}`}>
                                                {driver.driver || driver.name}
                                            </h4>
                                            <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1">
                                                {driver.constructor || driver.team}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black italic text-white block leading-none">
                                                {Math.round(driver.points)}
                                            </span>
                                            <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest">Puntos</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                
                <Link to="/leaderboard">
                    <button className="md:hidden cursor-pointer w-full mt-8 text-zinc-400 hover:text-white text-xs font-mono tracking-widest uppercase transition-colors py-4 border border-zinc-800 rounded-xl">
                        Ver clasificación completa.
                    </button>
                </Link>
            </div>
        </div>
    );
}