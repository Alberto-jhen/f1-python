const BASE_URL = 'http://localhost:8000';

// ----- JSON related function fetchs. -----

export const fetchDriverLaps = async (year, track, session, driver) => {
    try {
        const response = await fetch(`${BASE_URL}/data/laps/${year}/${track}/${session}/${driver}`);
        if (!response.ok) throw new Error('Error en API');
        const data = await response.json();
        
        return data;
    } catch (error) {
        throw error;
    }
};

// ----- Direct image fetchs. -----

export const fetchDriverLapsImage = async (year, track, session, driver) => {
    const params = new URLSearchParams({ year, track, session, driver });
    const url = `${BASE_URL}/plot/scatter?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al generar la imagen");
    }

    return await response.blob();
};

export const formatLapTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    
    // Format F1 = M:SS.mmm
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};