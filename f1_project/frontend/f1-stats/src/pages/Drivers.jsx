import DriverInfoSelector from '@/components/DriverInfoSelector.jsx';
import React, { useState, useEffect } from 'react';
import DriverProfileCard from '@/components/DriverProfileCard.jsx'
import DriverH2Hcard from '@/components/DriverH2Hcard';

export default function Drivers() {
    const [driverProfileInput, setDriverProfileInput] = useState({ selection: null, year: "2025", driver: null, number: null })
    return (
        <>
            <div className="flex flex-col p-6 md:p-12 mb-10 gap-6 relative">
                <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none" />

                <div className="border-l-4 border-red-600 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-600">Driver Hub</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">
                        Elige tu piloto
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1 font-medium">
                        Visualiza los datos históricos y de temporada de un piloto o compara su rendimiento H2H.
                    </p>
                </div>
                <DriverInfoSelector onSelectionChange={(newVal) => setDriverProfileInput(newVal)} />
                {driverProfileInput?.driverValue && (driverProfileInput?.selection == "individual") && (
                    <DriverProfileCard
                        data={driverProfileInput}
                    />
                )}
                {(driverProfileInput?.selection == "h2h") && (
                    <DriverH2Hcard driverData={driverProfileInput} />
                )}
            </div>
        </>

    )
}

