import DriverInfoSelector from '@/components/DriverInfoSelector.jsx';
import React, { useState, useEffect } from 'react';
import DriverProfileCard from '@/components/DriverProfileCard.jsx'

export default function Drivers() {
    const [driverProfileInput, setDriverProfileInput] = useState({year: "2025", driver: null, number: null})
    return (
        <>
            <main className="space-y-8">
                <DriverInfoSelector onSelectionChange={(newVal) => setDriverProfileInput(newVal)}/>
                {driverProfileInput?.driverValue && (
                    <DriverProfileCard 
                        data={driverProfileInput}
                    />
                )}
            </main>
        </>
        
    )
}

