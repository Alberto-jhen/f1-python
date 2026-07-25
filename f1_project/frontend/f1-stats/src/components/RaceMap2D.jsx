import React, { useEffect, useRef, useState } from 'react';
import { deployReplayService, triggerDataIngestion, getReplayBounds } from '@/service/apiService';
import { TelemetryCharts } from './TelemetryCharts';

const lerp = (start, end, t) => start + (end - start) * t;

export const RaceMap2D = ({ year, track }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    
    const [telemetryData, setTelemetryData] = useState([]);
    const [driversList, setDriversList] = useState([]);
    
    // State to store the real-time leaderboard ranking
    const [liveStandings, setLiveStandings] = useState([]);
    
    // Refs to control update frequency and persist the physical order between renders
    const lastLeaderboardUpdate = useRef(0); 
    const previousStandings = useRef([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [selectedDriver, setSelectedDriver] = useState('ALL');
    const [replayTime, setReplayTime] = useState(0); 
    const [trackBounds, setTrackBounds] = useState(null);
    const [isUsingCachedData, setIsUsingCachedData] = useState(false);

    const [loadedUntil, setLoadedUntil] = useState(0);
    const [isFetchingBackground, setIsFetchingBackground] = useState(false);
    const CHUNK_SIZE = 300; 
    const BUFFER_THRESHOLD = 70; 

    const loadInitialData = async () => {
        setIsLoading(true);
        setIsUsingCachedData(false);
        try {
            // Step 1: Check if telemetry already exists in the database.
            let boundsRes = await getReplayBounds(year, track);
            const hasCachedData = boundsRes.end_time > 0 && boundsRes.end_time > boundsRes.start_time;

            if (!hasCachedData) {
                // No cached data: trigger ingestion from FastF1.
                console.log(`🚀 No cached data found. Triggering ingestion for ${track} (${year})...`);
                await triggerDataIngestion(year, track);
                boundsRes = await getReplayBounds(year, track);
            } else {
                console.log(`📦 Using cached telemetry for ${track} (${year}).`);
                setIsUsingCachedData(true);
            }

            const START_TIME = boundsRes.start_time;
            const END_TIME = START_TIME + CHUNK_SIZE;

            console.log(`⏱️ Bounds retrieved. Real start: ${START_TIME}s. Initial end: ${END_TIME}s.`);

            // Step 2: Load the first telemetry chunk.
            const response = await deployReplayService(year, track, START_TIME, END_TIME);
            const data = response.data;
            
            setTelemetryData(data);
            
            const drivers = [...new Set(data.map(d => d.driver))];
            setDriversList(drivers);
            setLiveStandings(drivers); // Initialize the leaderboard with the default order
            
            if (data.length > 0) {
                let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                data.forEach(p => {
                    if (p.x < minX) minX = p.x;
                    if (p.x > maxX) maxX = p.x;
                    if (p.y < minY) minY = p.y;
                    if (p.y > maxY) maxY = p.y;
                });
                setTrackBounds({ minX, maxX, minY, maxY });
            }

            // Step 3: Synchronize playback clock to real START_TIME.
            setReplayTime(START_TIME);
            setLoadedUntil(END_TIME); 
        } catch (error) {
            console.error("Error loading initial telemetry:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (
            isPlaying && 
            loadedUntil > 0 && 
            !isFetchingBackground && 
            replayTime >= (loadedUntil - BUFFER_THRESHOLD)
        ) {
            const fetchNextChunk = async () => {
                setIsFetchingBackground(true);
                try {
                    const response = await deployReplayService(year, track, loadedUntil, loadedUntil + CHUNK_SIZE);
                    if (response.data && response.data.length > 0) {
                        setTelemetryData(prevData => [...prevData, ...response.data]);
                        setLoadedUntil(loadedUntil + CHUNK_SIZE);
                    }
                } catch (error) {
                    console.error("Error fetching background chunk:", error);
                } finally {
                    setIsFetchingBackground(false);
                }
            };
            fetchNextChunk();
        }
    }, [replayTime, loadedUntil, isPlaying, isFetchingBackground, year, track]);


    const updateCanvas = (currentReplayTime) => {
        const canvas = canvasRef.current;
        if (!canvas || !trackBounds) return;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#09090b'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (telemetryData.length === 0) return;

        const padding = 40; 
        const trackWidth = trackBounds.maxX - trackBounds.minX;
        const trackHeight = trackBounds.maxY - trackBounds.minY;
        const scaleX = (canvas.width - padding * 2) / (trackWidth || 1);
        const scaleY = (canvas.height - padding * 2) / (trackHeight || 1);
        const scale = Math.min(scaleX, scaleY);

        const getCoords = (x, y) => {
            const scaledX = (x - trackBounds.minX) * scale;
            const scaledY = (trackBounds.maxY - y) * scale; 
            const cx = (canvas.width - (trackWidth * scale)) / 2;
            const cy = (canvas.height - (trackHeight * scale)) / 2;
            return { drawX: scaledX + cx, drawY: scaledY + cy };
        };

        // 1. Draw the base circuit layout
        if (driversList.length > 0) {
            const referenceDriverData = telemetryData.filter(d => d.driver === driversList[0]);
            if (referenceDriverData.length > 0) {
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'; 
                ctx.lineWidth = 12; 
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                referenceDriverData.forEach((point, index) => {
                    const { drawX, drawY } = getCoords(point.x, point.y);
                    if (index === 0) ctx.moveTo(drawX, drawY);
                    else ctx.lineTo(drawX, drawY);
                });
                ctx.stroke();
            }
        }

        // --- 2. CALCULATE STATES FOR ALL DRIVERS ---
        const currentCarStates = [];

        driversList.forEach(driver => {
            const driverData = telemetryData.filter(d => d.driver === driver);
            let point1 = null;
            let point2 = null;

            for (let i = 0; i < driverData.length - 1; i++) {
                if (driverData[i].timestamp <= currentReplayTime && driverData[i+1].timestamp > currentReplayTime) {
                    point1 = driverData[i];
                    point2 = driverData[i+1];
                    break;
                }
            }

            if (point1 && point2) {
                const timeDiff = point2.timestamp - point1.timestamp;
                const t = timeDiff === 0 ? 0 : (currentReplayTime - point1.timestamp) / timeDiff;

                const interpX = lerp(point1.x, point2.x, t);
                const interpY = lerp(point1.y, point2.y, t);
                
                // Calculate the exact interpolated distance for the current millisecond
                const interpDistance = lerp(point1.distance || 0, point2.distance || 0, t);

                const coords = getCoords(interpX, interpY);
                
                currentCarStates.push({ 
                    driver, 
                    drawX: coords.drawX, 
                    drawY: coords.drawY, 
                    metricToSort: interpDistance // Metric used for sorting the leaderboard
                });
            } else if (driverData.length > 0) {
                // FALLBACK: If data ends, use the last known distance
                const lastPoint = driverData[driverData.length - 1];
                const coords = getCoords(lastPoint.x, lastPoint.y);
                currentCarStates.push({ 
                    driver, 
                    drawX: coords.drawX, 
                    drawY: coords.drawY, 
                    metricToSort: lastPoint.distance || 0 
                });
            }
        });

        // --- 3. LEADERBOARD UPDATE (THROTTLING) ---
        // Throttle React state updates to every 0.5 simulated seconds to preserve FPS
        if (Math.abs(currentReplayTime - lastLeaderboardUpdate.current) > 0.5) {
            
            if (previousStandings.current.length === 0) {
                // Initial load: strict mathematical sort without thresholds
                const rawSorted = [...currentCarStates].sort((a, b) => b.metricToSort - a.metricToSort);
                setLiveStandings(rawSorted.map(s => s.driver));
                previousStandings.current = rawSorted;
            } else {
                // THRESHOLD: Minimum distance advantage (in meters) required to confirm an overtake
                const THRESHOLD = 40; 
                
                let currentOrder = [...previousStandings.current];

                // 1. Inject updated distances while maintaining the visual order from the previous frame
                currentOrder = currentOrder.map(prevCar => {
                    const newData = currentCarStates.find(c => c.driver === prevCar.driver);
                    return { ...prevCar, metricToSort: newData ? newData.metricToSort : prevCar.metricToSort };
                });

                // 2. Evaluate real overtakes using a modified Bubble Sort with hysteresis threshold
                let swapped;
                do {
                    swapped = false;
                    for (let i = 0; i < currentOrder.length - 1; i++) {
                        const carAhead = currentOrder[i];
                        const carBehind = currentOrder[i + 1];

                        // Swap positions only if the trailing car surpasses the leader by more than the threshold margin
                        if (carBehind.metricToSort > (carAhead.metricToSort + THRESHOLD)) {
                            currentOrder[i] = carBehind;
                            currentOrder[i + 1] = carAhead;
                            swapped = true;
                        }
                    }
                } while (swapped);

                // 3. Update the UI state
                setLiveStandings(currentOrder.map(s => s.driver));
                previousStandings.current = currentOrder;
            }
            
            lastLeaderboardUpdate.current = currentReplayTime;
        }

        // --- 4. DRAW THE CARS ---
        const carsToDraw = selectedDriver === 'ALL' 
            ? currentCarStates 
            : currentCarStates.filter(c => c.driver === selectedDriver);

        carsToDraw.forEach(car => {
            const isHighlighted = selectedDriver !== 'ALL' && selectedDriver === car.driver;

            ctx.beginPath();
            ctx.arc(car.drawX, car.drawY, isHighlighted ? 6 : 4, 0, Math.PI * 2);
            ctx.fillStyle = isHighlighted ? '#ef4444' : '#ffffff'; 
            ctx.fill();
            
            if (isHighlighted || selectedDriver === 'ALL') {
                ctx.fillStyle = isHighlighted ? '#ef4444' : 'rgba(255,255,255,0.7)';
                ctx.font = isHighlighted ? 'bold 12px monospace' : '10px monospace';
                ctx.fillText(car.driver, car.drawX + 8, car.drawY + 4);
            }
        });
    };

    useEffect(() => {
        let lastTime = performance.now();
        const animate = (time) => {
            if (isPlaying) {
                const deltaMs = time - lastTime;
                const deltaSecs = deltaMs / 1000;
                setReplayTime(prev => {
                    const newTime = prev + (deltaSecs * playbackSpeed);
                    updateCanvas(newTime);
                    return newTime;
                });
            }
            lastTime = time;
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, telemetryData, playbackSpeed, selectedDriver, trackBounds]);

    useEffect(() => {
        if (!isPlaying) updateCanvas(replayTime);
    }, [replayTime, telemetryData, isPlaying, selectedDriver, trackBounds]);

    return (
        <div className="flex flex-col w-full gap-6 mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/90 p-4 rounded-xl border border-zinc-800 shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={loadInitialData}
                        disabled={isLoading}
                        className="px-4 py-2 bg-zinc-800 text-white text-sm rounded-md hover:bg-zinc-700 font-bold transition-colors"
                    >
                        {isLoading ? "CARGANDO..." : "1. CARGAR TELEMETRÍA"}
                    </button>
                    {isUsingCachedData && telemetryData.length > 0 && (
                        <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            Datos en caché
                        </span>
                    )}
                    <div className="h-6 w-px bg-zinc-700 mx-2"></div>
                    <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={telemetryData.length === 0}
                        className="px-6 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors w-32"
                    >
                        {isPlaying ? "⏸ PAUSA" : "▶️ PLAY"}
                    </button>
                    
                    {isFetchingBackground && (
                        <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest animate-pulse flex items-center gap-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            Buffering...
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <label className="text-[10px] text-zinc-500 font-bold tracking-widest mb-1">VELOCIDAD</label>
                        <select 
                            value={playbackSpeed}
                            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                            className="bg-zinc-950 text-white text-xs rounded border border-zinc-700 px-2 py-1 outline-none"
                        >
                            <option value={0.5}>0.5x</option>
                            <option value={1}>1.0x NORMAL</option>
                            <option value={2}>2.0x</option>
                            <option value={5}>5.0x RÁPIDO</option>
                        </select>
                    </div>
                    <div className="text-right">
                        <label className="text-[10px] text-zinc-500 font-bold tracking-widest block mb-1">RELOJ DE SESIÓN</label>
                        <span className="text-red-500 font-mono text-xl font-bold">
                            T+ {replayTime.toFixed(2)}s
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
                <div className="flex-grow relative rounded-xl overflow-hidden bg-[#09090b] border border-zinc-800 shadow-2xl ring-1 ring-white/5">
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent opacity-50"></div>
                    <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs text-zinc-500 font-mono font-bold tracking-widest">LIVE TRACKING</span>
                    </div>
                    
                    <canvas 
                        ref={canvasRef} 
                        width={1200} 
                        height={800} 
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* --- DYNAMIC LEADERBOARD --- */}
                <div className="w-full lg:w-72 flex flex-col bg-zinc-900/80 rounded-xl border border-zinc-800 overflow-hidden shadow-xl backdrop-blur-sm">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-end">
                        <div>
                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Live Standings</h3>
                            <p className="text-[10px] text-zinc-600 mt-1">Sorted by telemetry data</p>
                        </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        <button
                            onClick={() => setSelectedDriver('ALL')}
                            className={`w-full text-left px-4 py-2 rounded-lg text-sm font-bold font-mono transition-all mb-2 ${
                                selectedDriver === 'ALL' 
                                ? 'bg-red-600/20 text-red-500 border border-red-500/30' 
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white border border-transparent'
                            }`}
                        >
                            VER TODOS
                        </button>
                        
                        {/* Map through liveStandings to reflect real-time order */}
                        {liveStandings.map((driver, index) => (
                            <button
                                key={driver}
                                onClick={() => setSelectedDriver(driver)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-mono transition-all mb-1 ${
                                    selectedDriver === driver 
                                    ? 'bg-zinc-800 text-white border border-zinc-600 shadow-inner' 
                                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 border border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Display the explicit position with conditional styling */}
                                    <span className={`font-black text-xs w-4 text-center ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-zinc-300' : index === 2 ? 'text-amber-700' : 'text-zinc-600'}`}>
                                        {index + 1}
                                    </span>
                                    <span className="font-bold">{driver}</span>
                                </div>
                                <span className={`w-2 h-2 rounded-full ${selectedDriver === driver ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-transparent'}`}></span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Live telemetry charts for the selected driver. */}
            {selectedDriver !== 'ALL' && (
                <TelemetryCharts
                    telemetryData={telemetryData}
                    driver={selectedDriver}
                    currentTime={replayTime}
                />
            )}
        </div>
    );
};
