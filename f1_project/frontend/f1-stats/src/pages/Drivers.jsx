import { Header } from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import { fetchDriverProfile } from '../service/apiService.js'
import React, { useState, useEffect } from 'react';

export default function Drivers() {
    // 1. Definimos el estado para guardar el objeto JSON
    const [driverData, setDriverData] = useState(null);
    const [loading, setLoading] = useState(false);

    const getDriverProfile = async (driver_num) => {
        setLoading(true);
        try {
            // Asumimos que fetchDriverProfile es una función que hace el fetch
            const data = await fetchDriverProfile(driver_num); 
            
            // 2. Guardamos el JSON en el estado
            setDriverData(data); 
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    // Ejemplo: Cargar a Alonso (14) al montar el componente
    useEffect(() => {
        getDriverProfile(14);
    }, []);

    return ( 
        <>
            <Header />
            <main className="p-8">
                {loading && <p>Cargando...</p>}
                
                {/* 3. Accedemos a los campos del objeto usando el nombre de las llaves */}
                {driverData && (
                    <div className="bg-slate-800 text-white p-6 rounded-lg">
                        <img src={driverData.image} alt={driverData.name} className="w-32 mb-4" />
                        <h2 className="text-2xl font-bold">{driverData.name}</h2>
                        <p className="text-blue-400">{driverData.team}</p>
                        
                        <div className="mt-4">
                            <p><strong>Siglas:</strong> {driverData.acronym}</p>
                            <p><strong>País:</strong> {driverData.country}</p>
                            <p><strong>Color:</strong> 
                                <span style={{ color: driverData.team_color }}> {driverData.team_color}</span>
                            </p>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </>
    )
}