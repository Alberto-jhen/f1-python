import React, { useState, useEffect } from 'react';
import { GenericCombobox } from "@/components/GenericComobobox";
import { RaceMap2D } from "../components/RaceMap2D"; 
import { fetchYearSchedule } from "@/service/apiService";

const PageHeader = () => (
    <div className="mb-10 border-l-4 border-red-600 pl-4">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em]">En desarrollo</span>
        </div>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            Race Replay
        </h1>
        <p className="text-zinc-400 text-sm mt-1 font-medium">
            Selecciona la temporada y el circuito para revivir la telemetría en 2D.
        </p>
    </div>
);

export const Replays = () => {
    // States to save user selected options.
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedTrack, setSelectedTrack] = useState('');
    const [isLoadingTracks, setIsLoadingTracks] = useState(false);

    // State for the combobox options.
    const [options, setOptions] = useState({
        year: [
            {label: "2026", value: 2026},
            {label: "2025", value: 2025},
            {label: "2024", value: 2024},
            {label: "2023", value: 2023},
            {label: "2022", value: 2022},
            {label: "2021", value: 2021},
            {label: "2020", value: 2020},
            {label: "2019", value: 2019},
            {label: "2018", value: 2018}
        ],
        track: []
    });

    // Effect to load the tracks dynamically.
    useEffect(() => {
        const loadTracks = async () => {
            if (selectedYear) {
                setIsLoadingTracks(true);
                try {
                    const scheduleData = await fetchYearSchedule(selectedYear);
                    // Map the API data to adapt it for the combobox format.
                    const uniqueTracks = Array.from(new Set(scheduleData.tracks))
                        .map(trackName => ({
                            label: trackName,
                            value: trackName
                        }));

                    setOptions(prev => ({
                        ...prev,
                        track: uniqueTracks
                    }));
                    
                    // Reset in case the user changes year.
                    setSelectedTrack('');
                } catch (error) {
                    console.error("Error cargando circuitos:", error);
                } finally {
                    setIsLoadingTracks(false);
                }
            } else {
                // If the year is deleted, delete the tracks in consequence.
                setOptions(prev => ({ ...prev, track: [] }));
                setSelectedTrack('');
            }
        };

        loadTracks();
    }, [selectedYear]);

    return (
        <div className="p-6 md:p-12 w-full mx-auto max-w-7xl relative min-h-[80vh]">
            <PageHeader />

            <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 backdrop-blur-sm relative z-10">
                <div className="flex flex-col md:flex-row items-end gap-6">
                    {/* SEASON COMBOBOX */}
                    <div className="flex flex-col gap-2 w-full md:w-1/3">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            Temporada
                        </label>
                        <GenericCombobox 
                            options={options.year}
                            value={selectedYear}
                            onChange={setSelectedYear}
                            placeholder="Ej: 2023"
                        />
                    </div>

                    {/* TRACK COMBOBOX */}
                    <div className="flex flex-col gap-2 w-full md:w-2/3">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                            Gran Premio / Circuito
                        </label>
                        <GenericCombobox 
                            options={options.track}
                            value={selectedTrack}
                            onChange={setSelectedTrack}
                            placeholder={
                                isLoadingTracks 
                                ? "Buscando circuitos..." 
                                : selectedYear 
                                    ? "Ej: Monaco, Monza..." 
                                    : "Selecciona una temporada primero"
                            }
                            disabled={!selectedYear || isLoadingTracks}
                        />
                    </div>
                </div>
            </div>

            {/* Conditional rendering: only show map if theres a year and track selected */}
            {selectedYear && selectedTrack ? (
                <RaceMap2D 
                    key={`${selectedYear}-${selectedTrack}`} // Recreate the component if the selected year is changed.
                    year={selectedYear} 
                    track={selectedTrack} 
                />
            ) : (
                <div className="mt-12 flex items-center justify-center py-20 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 backdrop-blur-sm">
                    <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest">
                        Selecciona una temporada y un circuito para iniciar la simulación
                    </p>
                </div>
            )}
            
        </div>
    );
};