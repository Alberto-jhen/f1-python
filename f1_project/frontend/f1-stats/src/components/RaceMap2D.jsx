import React, { useEffect, useRef, useState } from 'react';
import { deployReplayService, triggerDataIngestion, getReplayBounds } from '@/service/apiService.ts';
import { TelemetryCharts } from './TelemetryCharts';
import { ArrowRight, Clock3, Database, Gauge, Info, LoaderCircle, Pause, Play } from 'lucide-react';
import { GenericCombobox } from '@/components/GenericComobobox';

const lerp = (start, end, t) => start + (end - start) * t;
const PLAYBACK_SPEED_OPTIONS = [
    { label: '0.5× LENTA', value: '0.5' },
    { label: '1× NORMAL', value: '1' },
    { label: '2× RÁPIDA', value: '2' },
    { label: '5× MUY RÁPIDA', value: '5' },
];

function formatRaceClock(elapsedSeconds) {
    const centiseconds = Math.floor(Math.max(0, elapsedSeconds) * 100);
    const hours = Math.floor(centiseconds / 360000);
    const minutes = Math.floor((centiseconds % 360000) / 6000);
    const seconds = Math.floor((centiseconds % 6000) / 100);
    const hundredths = String(centiseconds % 100).padStart(2, '0');
    const formattedSeconds = `${String(seconds).padStart(2, '0')}.${hundredths}`;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${formattedSeconds}`;
    }

    return `${String(minutes).padStart(2, '0')}:${formattedSeconds}`;
}

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
    const [replayStartTime, setReplayStartTime] = useState(0);
    const [trackBounds, setTrackBounds] = useState(null);
    const [isUsingCachedData, setIsUsingCachedData] = useState(false);

    const [loadedUntil, setLoadedUntil] = useState(0);
    const [isFetchingBackground, setIsFetchingBackground] = useState(false);
    const CHUNK_SIZE = 300; 
    const BUFFER_THRESHOLD = 70; 
    const displayedRaceTime = formatRaceClock(replayTime - replayStartTime);

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
            setReplayStartTime(START_TIME);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying, telemetryData, playbackSpeed, selectedDriver, trackBounds]);

    useEffect(() => {
        if (!isPlaying) updateCanvas(replayTime);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [replayTime, telemetryData, isPlaying, selectedDriver, trackBounds]);

    return (
        <div className="flex flex-col w-full gap-6 mt-8">
            <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/95 to-zinc-950 p-4 shadow-xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between lg:p-5">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={loadInitialData}
                        disabled={isLoading}
                        className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 text-xs font-bold tracking-wide text-zinc-100 transition-colors hover:border-zinc-600 hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60"
                    >
                        {isLoading ? (
                            <LoaderCircle className="size-4 animate-spin text-red-400" aria-hidden="true" />
                        ) : (
                            <Database className="size-4 text-zinc-400" aria-hidden="true" />
                        )}
                        {isLoading ? 'CARGANDO...' : 'CARGAR TELEMETRÍA'}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={telemetryData.length === 0}
                        className="inline-flex h-11 w-36 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-gradient-to-r from-red-600 to-red-700 px-4 text-xs font-black tracking-wider text-white shadow-lg shadow-red-950/40 transition-all hover:from-red-500 hover:to-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {isPlaying ? (
                            <Pause className="size-4 text-white" fill="currentColor" strokeWidth={2.5} aria-hidden="true" />
                        ) : (
                            <Play className="size-4 text-white" fill="currentColor" strokeWidth={2.5} aria-hidden="true" />
                        )}
                        {isPlaying ? 'PAUSAR' : 'REPRODUCIR'}
                    </button>
                    <div className="flex basis-full items-center gap-2 text-[11px] text-zinc-500 sm:basis-auto">
                        <Info className="size-4 shrink-0 text-red-400" aria-hidden="true" />
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span><strong className="text-zinc-300">1.</strong> Carga telemetría</span>
                            <ArrowRight className="size-3.5 text-zinc-600" aria-hidden="true" />
                            <span><strong className="text-zinc-300">2.</strong> Pulsa Play</span>
                        </div>
                    </div>
                    
                    {isFetchingBackground && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                            <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
                            Buffering...
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap items-end gap-3 sm:gap-4">
                    <div className="w-full max-w-[12rem] sm:w-44">
                        <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            <Gauge className="size-3.5 text-zinc-400" aria-hidden="true" />
                            Velocidad de replay
                        </label>
                        <GenericCombobox
                            options={PLAYBACK_SPEED_OPTIONS}
                            value={String(playbackSpeed)}
                            onChange={(value) => setPlaybackSpeed(Number(value))}
                            placeholder="Velocidad"
                            triggerBackgroundClassName="bg-zinc-950 hover:bg-zinc-900"
                            popoverBackgroundClassName="bg-zinc-900"
                        />
                    </div>

                    <div className="flex min-w-[10.5rem] flex-1 items-center gap-3 rounded-xl border border-red-500/20 bg-zinc-950/70 px-3 py-2 sm:flex-none">
                        <Clock3 className="size-5 shrink-0 text-red-400" aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Tiempo de carrera</p>
                            <p className="font-mono text-lg font-bold tabular-nums tracking-wide text-white">{displayedRaceTime}</p>
                            <p className="text-[9px] text-zinc-600">Desde el inicio de la replay</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
                <div className="flex-grow relative rounded-xl overflow-hidden bg-[#09090b] border border-zinc-800 shadow-2xl ring-1 ring-white/5">
                    <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent opacity-50"></div>
                    <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-zinc-700/70 bg-zinc-950/85 px-3 py-1.5 backdrop-blur">
                        <span
                            className={`size-2 rounded-full ${
                                isLoading
                                    ? 'animate-pulse bg-amber-400'
                                    : telemetryData.length > 0
                                        ? isPlaying
                                            ? 'animate-pulse bg-red-400'
                                            : 'bg-emerald-400'
                                        : 'bg-zinc-600'
                            }`}
                        />
                        <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-300">
                            {isLoading
                                ? 'CARGANDO TELEMETRÍA'
                                : telemetryData.length > 0
                                    ? isPlaying
                                        ? 'REPLAY EN CURSO'
                                        : 'REPLAY LISTA'
                                    : 'ESPERANDO TELEMETRÍA'}
                        </span>
                        {isUsingCachedData && telemetryData.length > 0 && (
                            <span className="border-l border-zinc-700 pl-2 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                Caché
                            </span>
                        )}
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
