import { GenericCombobox } from "./GenericComobobox"
import { useState, useEffect } from 'react';
import { fetchDriversFullNamesByYear } from "@/service/apiService";

export default function DriverInfoSelector({ onSelectionChange }) {

    const [viewMode, setViewMode] = useState("individual");
    const [selectedYear, setSelectedYear] = useState();
    const [selectedDriver, setSelectedDriver] = useState();

    const [driverOptions, setDriverOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const visualizationOptions = [
        { label: "H2H", value: "h2h" },
        { label: "Piloto individual", value: "individual" }
    ];

    const selectableYears = [
        { label: "2026", value: 2026 },
        { label: "2025", value: 2025 },
        { label: "2024", value: 2024 },
        { label: "2023", value: 2023 },
        { label: "2022", value: 2022 },
        { label: "2021", value: 2021 },
        { label: "2020", value: 2020 },
        { label: "2019", value: 2019 },
        { label: "2018", value: 2018 },
    ]

    //useEffect for communicating the father the selected info.
    useEffect(() => {
        if (onSelectionChange) {
            const selectedDriverData = driverOptions.find(d => d.value === selectedDriver);

            onSelectionChange({
                ...selectedDriverData,
                selection: viewMode,
                year: selectedYear,
                driverValue: selectedDriver,
                driverLabel: selectedDriverData?.label,
                driverNumber: selectedDriverData?.number,
                mode: viewMode
            });
        }
    }, [selectedYear, selectedDriver, viewMode, driverOptions]);

    useEffect(() => {
        const loadDrivers = async () => {
            if (selectedYear) {
                setIsLoading(true);
                try {
                    const data = await fetchDriversFullNamesByYear(selectedYear);
                    setDriverOptions(data);
                    if (selectedDriver) {
                        setSelectedDriver(null);
                    }
                } catch (error) {
                    console.error("Error al cargar pilotos:", error);
                    setDriverOptions([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setDriverOptions([]);
                setSelectedDriver(null);
            }
        };

        loadDrivers();
    }, [selectedYear]);

    return (
        <div className="flex flex-wrap gap-4 m-6 mb-10 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div className="flex flex-col gap-2 flex-1 min-w-50">
                <label className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    Modo Visualización
                </label>
                <GenericCombobox
                    placeholder="Seleccionar modo"
                    options={visualizationOptions}
                    value={viewMode}
                    onChange={setViewMode}
                    disabled={false}
                />
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-50">
                <label className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    Seleccionar temporada
                </label>
                <GenericCombobox
                    placeholder="Temporada"
                    options={selectableYears}
                    value={selectedYear}
                    onChange={setSelectedYear}
                    disabled={false}
                />
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-50">
                <label className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                    Seleccionar piloto
                </label>
                <GenericCombobox
                    placeholder={isLoading ? "Cargando pilotos..." : "Piloto"}
                    options={driverOptions}
                    value={selectedDriver}
                    onChange={setSelectedDriver}
                    disabled={!selectedYear || isLoading}
                />
            </div>
        </div>
    )
}