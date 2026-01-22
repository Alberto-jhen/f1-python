import { useState } from 'react';

export const App = () => {
    const [year, setYear] = useState("2024");
    const [track, setTrack] = useState("");
    const [session, setSession] = useState("R");
    const [numDrivers, setNumDrivers] = useState(5); 

    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFetchGraph = async () => {
        setLoading(true);
        const baseUrl = import.meta.env.VITE_API_URL;
        
        try {
            const response = await fetch(
                `${baseUrl}/plot/violin?year=${year}&track=${track}&session=${session}&num_drivers=${numDrivers}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Error en el servidor");
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            setImageSrc(imageUrl);
        } catch (error) {
            console.error("Error al obtener el gráfico:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 flex flex-col gap-6 font-sans">
            <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded-lg shadow-sm">
                <div>
                    <label htmlFor="year" className="block text-sm font-bold text-gray-700">Año</label>
                    <input 
                        id="year"
                        type="number"
                        value={year} 
                        onChange={(e) => setYear(e.target.value)}
                        className="border p-2 rounded w-24"
                    />
                </div>

                <div>
                    <label htmlFor="track" className="block text-sm font-bold text-gray-700">Circuito (Ej: Monza)</label>
                    <input 
                        id="track"
                        type="text" 
                        value={track}
                        onChange={(e) => setTrack(e.target.value)}
                        className="border p-2 rounded"
                    />
                </div>

                <div>
                    <label htmlFor="session" className="block text-sm font-bold text-gray-700">Sesión</label>
                    <select 
                        id="session"
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        className="border p-2 rounded bg-white"
                    >
                        <option value="R">Carrera (R)</option>
                        <option value="Q">Clasificación (Q)</option>
                        <option value="FP1">FP1</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="drivers" className="block text-sm font-bold text-gray-700">Nº Pilotos</label>
                    <input 
                        id="drivers"
                        type="number"
                        min="1"
                        max="20"
                        value={numDrivers} 
                        onChange={(e) => setNumDrivers(e.target.value)}
                        className="border p-2 rounded w-20"
                    />
                </div>

                <button 
                    onClick={handleFetchGraph}
                    disabled={loading}
                    className="bg-red-600 text-white font-bold px-6 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                    {loading ? "Generando..." : "Ver Gráfico"}
                </button>
            </div>

            <div className="mt-4 flex justify-center bg-white border rounded-xl p-4 shadow-inner min-h-[400px] items-center">
                {imageSrc ? (
                    <img src={imageSrc} alt="F1 Violin Plot" className="max-w-full h-auto rounded shadow-md" />
                ) : (
                    <div className="text-center text-gray-400">
                        <p className="text-xl">Selecciona los datos y pulsa en "Ver Gráfico"</p>
                        <p className="text-sm italic">Nota: La primera carga de FastF1 puede tardar unos segundos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};