const BASE_URL = 'http://localhost:8000';

// ----- JSON related function fetchs for graphics. -----

export const fetchDriverLaps = async (year, track, session, driver) => {
    try {
        const response = await fetch(`${BASE_URL}/data/laps/${year}/${track}/${session}/${driver}`);
        if (!response.ok) throw new Error('Error en la API al hacer el fetch de la función de distribución de vueltas de un piloto');
        const data = await response.json();
        
        return data;
    } catch (error) {
        throw error;
    }
};

export const fetchDriversLapsViolin = async (year, track, session, numDrivers) => {
    try {
        const response = await fetch(`${BASE_URL}/data/laps/distribution/${year}/${track}/${session}/${numDrivers}`);
        if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función violin');
        const data = await response.json()

        return data;
    } catch (error) {
        throw error;
    }
}

export const fetchQualyOverviewData = async (year, track) => {
    try {
        const response = await fetch(`${BASE_URL}/data/qualy/overview/${year}/${track}`);
        if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función de resultados de la qualy');
        const data = await response.json();

        return data
    }catch (error) {
        console.error("Fetch error: ", error);
        throw error;
    }
}
    

export const fetchDriverProfile = async (driver_num) => {
    try {
        const response = await fetch(`${BASE_URL}/driver/profile/${driver_num}`);
        if(!response.ok) throw new Error('Error en la API al hacer el fetch del JSON del perfil del piloto');
        const data = await response.json();

        return data;
    } catch (error) {
        throw error;
    }
}

/** 
 *  ----- YEAR SCHEDULE -----
 *  Data estructure:
 *  "tracks": [
 *      ...
 *      ...
 *      ...
 *  ],
 *  "sessions" [
 *      ...
 *      ...
 *  ]
 */

export const fetchYearSchedule = async(year) => {
    try {
        const response = await fetch(`${BASE_URL}/data/schedule/${year}`);
        if(!response.ok) throw new Error('Error en la API al hacer el fetch del JSON del calendario.');
        const data = await response.json();

        return data;
    } catch (error) {
        throw error;
    }
}

/** 
 * Returns not only the full name but also basic driver info like:
 * Team, team color, points (from a concrete event), number, country and abbreviation.
 */
export const fetchDriversFullNamesByYear = async (year, event_name = "latest", session_type = "R") => {
    try {
        const event = event_name || "latest";
        const session = session_type || "R";

        const response = await fetch(`${BASE_URL}/data/drivers/${year}/${event}/${session}`);
        
        if (!response.ok) throw new Error('Error al obtener los nombres de los pilotos');
        
        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        throw error;
    }
}

// Driver season standings.
export const fetchDriverSeasonStandings = async (year, driver_num, code = null) => {
    try{
        let url = `${BASE_URL}/data/standings/${year}/${driver_num}`;
        if (code) url += `?code=${encodeURIComponent(code)}`;
        const response = await fetch(url);
        if(!response.ok) throw new Error('Error al obtener la clasificacion del piloto');

        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        throw error;
    }
}

// Driver career standings.
export const fetchDriverCareerStandings = async (driver_name) => {
    try {
        const response = await fetch(`${BASE_URL}/data/career/standings/${encodeURIComponent(driver_name)}`);
        if (!response.ok) throw new Error('Error al obtener las estadisticas de la carrera del piloto');

        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        throw error;
    }
}

// ----- Direct image fetchs. -----

export const fetchDriverLapsImage = async (year, track, session, driver) => {
    const params = new URLSearchParams({ year, track, session, driver });
    const url = `${BASE_URL}/plot/scatter?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en el fetch de generación del gráfico de distribución de tiempos de piloto");
    }

    return await response.blob();
};

export const fetchDriversLapsViolinImage = async (year, track, session, num_drivers) => {
    const params = new URLSearchParams({ year, track, session, num_drivers });
    const url = `${BASE_URL}/plot/violin?${params.toString()}`;

    const response = await fetch(url);
    if(!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error en el fetch de generación del gráfico violin");
    }

    return await response.blob();
}

export const fetchQualyOverviewImage = async (year, track) => {
    const params = new URLSearchParams({ year, track});
    const url = `${BASE_URL}/plot/qualy_overview?${params.toString()}`;

    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await  response.json();
        throw new Error(errorData.detail || "Error en el fetch de generación del gráfico de resultados de la qualy.");
    }
    return await response.blob();
}

// ----- Standings -----

export const fetchGlobalStandings = async () => {
    try {
        const response = await fetch(`${BASE_URL}/standings/global/`);
        if (!response.ok) throw new Error('Error al obtener la clasificación global');
        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        return [];
    }
}

export const fetchStandingsByRound = async (year, round) => {
    try {
        const response = await fetch(`${BASE_URL}/standings/${year}/${round}`);
        if (!response.ok) throw new Error('Error al obtener standings por ronda');
        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        return [];
    }
}

// ----- Events -----

export const fetchEventRaceDate = async (year, eventName) => {
    try {
        const params = new URLSearchParams({ year, event_name: eventName });
        const response = await fetch(`${BASE_URL}/events/date?${params.toString()}`);
        if (!response.ok) throw new Error('Error al obtener la fecha del evento');
        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        return null;
    }
}

// ----- Utilites -----

export const formatLapTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);
    
    // Format F1 = M:SS.mmm
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};


// ---------- H2H SERVICE ----------
export const fetchH2HData = async (year, driver1, driver2) => {
    try {
        const response = await fetch(`${BASE_URL}/data/h2h/${year}/${driver1}/${driver2}`);
        if (!response.ok) throw new Error('Error al obtener los datos H2H');
        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        throw error;
    }
}

// ---------- REPLAY SERVICE ----------
export const deployReplayService = async (year, track) => {
    try {
        const response = await fetch(`${BASE_URL}/service/replay/${year}/${track}`);
        if(!response.ok) throw new Error('Error al obtener los datos de replay');

        return await response.json();
    } catch (error) {
        console.error("Fetch error: ", error);
        throw error;
    }
}