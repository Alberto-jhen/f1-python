const BASE_URL = 'http://localhost:8000';

// ----- JSON related function fetchs for graphics. -----

export const fetchDriverLaps = async (
    year: number | string,
    track: string,
    session: string,
    driver: number | string,
    ): Promise<any> => {
    const response = await fetch(`${BASE_URL}/data/laps/${year}/${track}/${session}/${driver}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch de la función de distribución de vueltas de un piloto');
    return await response.json();
};

export const fetchDriversLapsViolin = async (
    year: number,
    track: string,
    session: string,
    numDrivers: number | string,
    ): Promise<any> => {
    const response = await fetch(`${BASE_URL}/data/laps/distribution/${year}/${track}/${session}/${numDrivers}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función violin');
    return await response.json();
};

export const fetchQualyOverviewData = async (
    year: number,
    track: string,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/data/qualy/overview/${year}/${track}`);
        if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función de resultados de la qualy');
        const data = await response.json();

        return data;
    } catch (error: any) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

export const fetchDriverProfile = async (driver_num: number | string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/driver/profile/${driver_num}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON del perfil del piloto');
    return await response.json();
};

export const fetchSeasonHeatmapData = async (year: number): Promise<any> => {
    console.log("Entra en el fetch que toca");
    const response = await fetch(`${BASE_URL}/data/points/heatmap/${year}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función heatmap de puntos por temporada');
    return await response.json();
}

// ----- Direct image fetchs. -----

export const fetchDriverLapsImage = async (
    year: number | string,
    track: string,
    session: string,
    driver: number | string,
    ): Promise<Blob> => {
    const params = new URLSearchParams({ year: String(year), track, session, driver: String(driver) });
    const url = `${BASE_URL}/plot/scatter?${params.toString()}`;

    return commonResponse(url, 'Error en el fetch de generación del gráfico de distribución de tiempos de piloto.');
};

export const fetchDriversLapsViolinImage = async (
    year: number | string,
    track: string,
    session: string,
    num_drivers: number | string,
    ): Promise<Blob> => {
    const params = new URLSearchParams({ year: String(year), track, session, num_drivers: String(num_drivers) });
    const url = `${BASE_URL}/plot/violin?${params.toString()}`;

    return commonResponse(url, 'Error en el fetch de generación del gráfico violin de distribución de tiempos de pilotos.');
};

export const fetchQualyOverviewImage = async (year: number | string, track: string): Promise<Blob> => {
    const params = new URLSearchParams({ year: String(year), track });
    const url = `${BASE_URL}/plot/qualy_overview?${params.toString()}`;

    return commonResponse(url, 'Error en el fetch de generación del gráfico de resultados de la qualy.');
};

export const fetchSeasonHeatmapImage = async (year: number | string): Promise<Blob> => {
    const params = new URLSearchParams({ year: String(year) });
    const url = `${BASE_URL}/plot/heatmap_points?${params.toString()}`;

    return commonResponse(url, 'Error en el fetch de generación del gráfico de heatmap de puntos por temporada');
};

const commonResponse = async (url: string, msg: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || msg);
    }
    return await response.blob();
};

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

export const fetchYearSchedule = async (year: number | string): Promise<any> => {
    const response = await fetch(`${BASE_URL}/data/schedule/${year}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON del calendario.');
    return await response.json();
};

/**
 * Returns not only the full name but also basic driver info like:
 * Team, team color, points (from a concrete event), number, country and abbreviation.
 */
export const fetchDriversFullNamesByYear = async (
    year: number | string,
    event_name: string = 'latest',
    session_type: string = 'R',
    signal?: AbortSignal,
    ): Promise<any> => {
    try {
        const event = event_name || 'latest';
        const session = session_type || 'R';

        const response = await fetch(`${BASE_URL}/data/drivers/${year}/${event}/${session}`, { signal });

        if (!response.ok) throw new Error('Error al obtener los nombres de los pilotos');

        return await response.json();
    } catch (error: any) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

// Driver season standings.
export const fetchDriverSeasonStandings = async (
    year: number | string,
    driver_num: number | string,
    code: string | null = null,
    signal?: AbortSignal,
    ): Promise<any> => {
    try {
        let url = `${BASE_URL}/data/standings/${year}/${driver_num}`;
        if (code) url += `?code=${encodeURIComponent(code)}`;
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error('Error al obtener la clasificacion del piloto');

        return await response.json();
    } catch (error: any) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

// Driver career standings.
export const fetchDriverCareerStandings = async (
    driver_name: string,
    signal?: AbortSignal,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/data/career/standings/${encodeURIComponent(driver_name)}`, { signal });
        if (!response.ok) throw new Error('Error al obtener las estadisticas de la carrera del piloto');

        return await response.json();
    } catch (error: any) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

// ----- Standings -----

export const fetchGlobalStandings = async (): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/standings/global/`);
        if (!response.ok) throw new Error('Error al obtener la clasificación global');
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error: ', error);
        return [];
    }
};

export const fetchStandingsByRound = async (
    year: number | string,
    round: number | string,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/standings/${year}/${round}`);
        if (!response.ok) throw new Error('Error al obtener standings por ronda');
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error: ', error);
        return [];
    }
};

// ----- Events -----

export const fetchEventRaceDate = async (
    year: number | string,
    eventName: string,
    ): Promise<any> => {
    try {
        const params = new URLSearchParams({ year: String(year), event_name: eventName });
        const response = await fetch(`${BASE_URL}/events/date?${params.toString()}`);
        if (!response.ok) throw new Error('Error al obtener la fecha del evento');
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error: ', error);
        return null;
    }
};

// ----- Utilites -----

export const formatLapTime = (seconds: number | string): string => {
    if (!seconds || isNaN(Number(seconds))) return '';

    const secs = Number(seconds);
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    const ms = Math.round((secs % 1) * 1000);

    // Format F1 = M:SS.mmm
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

// ---------- H2H SERVICE ----------
export const fetchH2HData = async (
    year: number | string,
    driver1: string,
    driver2: string,
    signal?: AbortSignal,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/data/h2h/${year}/${driver1}/${driver2}`, { signal });
        if (!response.ok) throw new Error('Error al obtener los datos H2H');
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

// ---------- REPLAY SERVICE ----------
export const triggerDataIngestion = async (
    year: number | string,
    track: string,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/service/replay/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year: typeof year === 'number' ? year : parseInt(year, 10), track }),
        });
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error en la ingesta de telemetría');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en triggerDataIngestion: ', error);
        throw error;
    }
};

export const getReplayBounds = async (
    year: number | string,
    track: string,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/service/replay/${year}/${track}/bounds`);
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al obtener límites de la telemetría');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en getReplayBounds: ', error);
        throw error;
    }
};

export const deployReplayService = async (
    year: number | string,
    track: string,
    startTime: number = 0,
    endTime: number = 300,
    driverId: string | null = null,
    ): Promise<any> => {
    try {
        const params = new URLSearchParams({
        start_time: String(startTime),
        end_time: String(endTime),
        });

        if (driverId) {
        params.append('driver_id', driverId);
        }

        const endpointUrl = `${BASE_URL}/service/replay/${year}/${track}?${params.toString()}`;
        const response = await fetch(endpointUrl);

        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al obtener los datos de replay');
        }

        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en deployReplayService: ', error);
        throw error;
    }
};

// ---------- CIRCUITS SERVICE ----------
export const getCircuitVisualInfo = async (
    seasonYear: number | string,
    roundNum: number | string,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/circuits/${seasonYear}/${roundNum}`);
        if (!response.ok) {
        throw new Error('Circuit details not found');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Error fetching circuit visuals:', error);
        return null;
    }
};

export const getRacesBySeason = async (seasonYear: number | string): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/circuits/${seasonYear}`);
        if (!response.ok) {
        throw new Error('Races not found');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Error fetching races by season:', error);
        return null;
    }
};

// ---------- ML / DEGRADATION ----------
export const fetchDegradationPrediction = async (
    year: number | string,
    track: string,
    driver: number | string,
    ): Promise<any> => {
    try {
        const response = await fetch(
        `${BASE_URL}/predict/degradation/${year}/${encodeURIComponent(track)}/${driver}`,
        );
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al obtener la predicción de degradación');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en fetchDegradationPrediction:', error);
        throw error;
    }
};

// ---------- RATINGS ----------
interface RatingData {
    race_id: number | string;
    driver_id?: string | null;
    rating: number;
    comment?: string;
    }

    interface RatingParams {
    race_id?: number | string;
    sort_by?: string;
    limit?: number;
    since?: string;
    current_profile_id?: string;
}

/**
 * Publica una valoración/comentario para un usuario.
 * profileId va en la ruta; ratingData va en el cuerpo de la petición (request body).
 *
 * ratingData = {
 *   race_id: number,
 *   driver_id: string (opcional, para valorar piloto; null/omitir para carrera),
 *   rating: number (1-5),
 *   comment: string (opcional, máx. 400 chars)
 * }
 */
export const publishRating = async (
    profileId: string,
    ratingData: RatingData,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/ratings/${encodeURIComponent(profileId)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
        });
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al publicar la valoración');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en publishRating:', error);
        throw error;
    }
};

export const fetchRatings = async (
    params: RatingParams = {},
    signal?: AbortSignal,
    ): Promise<any> => {
    try {
        const query = new URLSearchParams();
        if (params.race_id) query.set('race_id', String(params.race_id));
        if (params.sort_by) query.set('sort_by', params.sort_by);
        if (params.limit) query.set('limit', String(params.limit));
        if (params.since) query.set('since', params.since);
        if (params.current_profile_id) query.set('current_profile_id', params.current_profile_id);
        const response = await fetch(`${BASE_URL}/ratings?${query.toString()}`, { signal });
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al obtener las valoraciones');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en fetchRatings:', error);
        throw error;
    }
};

export const likeRating = async (
    profileId: string,
    ratingId: string | number,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/ratings/${encodeURIComponent(profileId)}/${encodeURIComponent(ratingId)}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        });
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al dar like');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en likeRating:', error);
        throw error;
    }
};

export const unlikeRating = async (
    profileId: string,
    ratingId: string | number,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/ratings/${encodeURIComponent(profileId)}/${encodeURIComponent(ratingId)}/like`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        });
        if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al quitar like');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en unlikeRating:', error);
        throw error;
    }
};
