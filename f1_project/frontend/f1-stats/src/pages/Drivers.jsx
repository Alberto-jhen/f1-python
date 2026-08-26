import { useEffect, useState } from 'react';
import DriverInfoSelector from '@/components/drivers/DriverInfoSelector.jsx';
import DriverProfileCard from '@/components/drivers/DriverProfileCard.jsx';
import DriverH2Hcard from '@/components/drivers/DriverH2Hcard';
import DriverGridSelector from '@/components/drivers/DriverGridSelector.jsx';
import { fetchDriversFullNamesByYear } from '@/service/apiService';
import { Users } from 'lucide-react';

function normalizeDriver(driver, year, mode) {
    return {
        ...driver,
        selection: mode,
        year,
        driverValue: driver.value,
        driverLabel: driver.label,
        driverNumber: driver.number,
        mode,
        team: driver.team,
        team_color: driver.team_color,
        country: driver.country,
    };
}

export default function Drivers() {
    const [year, setYear] = useState(2025);
    const [mode, setMode] = useState('individual');
    const [driverOptions, setDriverOptions] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(false);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [comparisonList, setComparisonList] = useState([]);

    useEffect(() => {
        const loadDrivers = async () => {
            setLoadingDrivers(true);
            try {
                const data = await fetchDriversFullNamesByYear(year);
                setDriverOptions(data || []);
            } catch (error) {
                console.error('Error cargando pilotos:', error);
                setDriverOptions([]);
            } finally {
                setLoadingDrivers(false);
            }
        };
        loadDrivers();
    }, [year]);

    useEffect(() => {
        setSelectedDriver(null);
        setComparisonList([]);
    }, [year, mode]);

    const handleModeChange = (newMode) => {
        setMode(newMode);
    };

    const handleIndividualSelect = (driver) => {
        setSelectedDriver(driver ? normalizeDriver(driver, year, mode) : null);
    };

    const handleH2HAdd = (driver) => {
        if (comparisonList.length >= 2) return;
        const normalized = normalizeDriver(driver, year, mode);
        const duplicate = comparisonList.some(
            (d) => d.driverValue === normalized.driverValue && d.year === normalized.year
        );
        if (!duplicate) setComparisonList((prev) => [...prev, normalized]);
    };

    const handleH2HRemove = (index) => {
        setComparisonList((prev) => prev.filter((_, i) => i !== index));
    };

    const handleGridSelect = (driver) => {
        if (mode === 'individual') {
            handleIndividualSelect(driver);
        } else {
            if (driver) handleH2HAdd(driver);
        }
    };

    const handleGridRemove = (index) => {
        if (mode === 'h2h') handleH2HRemove(index);
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 font-sans">
            {/* Hero header */}
            <div className="relative overflow-hidden border-b border-slate-800">
                <div className="relative px-4 md:px-8 lg:px-12 py-8 md:py-10">
                    <div className="border-l-4 border-red-600 pl-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 text-red-600 text-sm font-bold uppercase tracking-[0.3em]">
                                Driver Hub
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white italic leading-none">
                            Elige tu <span className="text-red-600">piloto</span>
                        </h1>
                        <p className="text-slate-400 text-base md:text-lg mt-4 font-medium max-w-2xl leading-relaxed">
                            Analiza el rendimiento en pista, visualiza datos históricos o compara frente a frente a dos corredores de la misma temporada.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main split layout: selector left + card right */}
            <div className="px-4 md:px-8 lg:px-12 py-6 md:py-8 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 md:gap-8 items-stretch">
                    {/* Left panel: selector */}
                    <div className="flex flex-col gap-4">
                        <DriverInfoSelector
                            year={year}
                            mode={mode}
                            onYearChange={setYear}
                            onModeChange={handleModeChange}
                            selectedDriver={selectedDriver}
                            comparisonList={comparisonList}
                        />
                        <DriverGridSelector
                            key={`${year}-${mode}`}
                            drivers={driverOptions}
                            year={year}
                            mode={mode}
                            selectedDriver={selectedDriver}
                            comparisonList={comparisonList}
                            onSelect={handleGridSelect}
                            onRemove={handleGridRemove}
                            loading={loadingDrivers}
                        />
                    </div>

                    {/* Right panel: visualization */}
                    <div className="min-h-[500px] lg:min-h-[85vh]">
                        {mode === 'individual' && selectedDriver && (
                            <DriverProfileCard data={selectedDriver} />
                        )}

                        {mode === 'h2h' && (
                            <DriverH2Hcard
                                drivers={comparisonList}
                                year={year}
                                onRemove={handleH2HRemove}
                            />
                        )}

                        {!selectedDriver && mode === 'individual' && (
                            <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-500 border border-dashed border-slate-800 rounded-3xl bg-slate-950/50 min-h-[400px] lg:min-h-[85vh]">
                                <Users className="size-16 opacity-30" />
                                <p className="text-lg font-black uppercase tracking-widest text-slate-400">Selecciona un piloto</p>
                                <p className="text-sm text-slate-500 text-center max-w-xs">Haz clic en cualquier tarjeta de la izquierda para ver su perfil completo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
