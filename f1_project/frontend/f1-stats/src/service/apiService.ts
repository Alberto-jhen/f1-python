const BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Body of a FastAPI error response; `detail` carries the message in these routes.
type ApiErrorBody = {
    detail?: string;
};

export type SeasonForecastStanding = {
    position: number;
    current_position: number;
    driver: string;
    constructor: string;
    current_points: number;
    expected_final_points: number;
    p10_final_points: number;
    p90_final_points: number;
    championship_probability: number;
};

export type SeasonForecastResponse = {
    year: number;
    as_of_round: number;
    fetched_at: string | null;
    standings_source: string;
    is_stale: boolean;
    validation: unknown;
    simulations: unknown;
    remaining_events: unknown;
    standings: SeasonForecastStanding[];
};

// ----- Response types (mirror backend/core/schemas.py and the route handlers). -----

export type DriverLap = {
    LapNumber: number;
    LapTimeSeconds: number | null;
    Compound: string | null;
    TyreLife: number | null;
};

export type LapDistributionRecord = {
    Driver: string;
    LapTimeSeconds: number | null;
    Compound: string | null;
    TeamColor: string | null;
    OfficialOrder: number;
};

export type QualifyingResult = {
    Driver: string;
    Team: string;
    LapTime: number;
    Delta: number;
    TeamColor: string;
    IsPole: boolean;
};

export type PointsHeatmapData = {
    points: (number | null)[][];
    drivers: string[];
    races: string[];
};

export type DriverProfile = {
    name: string | null;
    acronym: string | null;
    team: string | null;
    team_color: string | null;
    country: string | null;
    image: string | null;
};

export type YearSchedule = {
    tracks: string[];
    sessions: string[];
    sprint_events: string[];
};

export type DriverInfo = {
    label: string;
    value: string;
    number: number;
    team: string;
    team_color: string | null;
    country: string;
    points: number;
};

export type DriverSeasonStanding = {
    position: number | string;
    points: number;
    year: string | null;
};

export type DriverCareerStats = {
    titles: number;
    wins: number;
    podiums: number;
};

export type GlobalStandingEntry = {
    position: string;
    points: string;
    wins: string;
    driver: string;
    constructor: string;
};

export type EventDate = {
    year: number;
    event: string;
    date: string;
};

export type H2HEventResult = {
    event: string;
    round: number;
    driver1_qual: number | null;
    driver2_qual: number | null;
    driver1_race: number | string | null;
    driver2_race: number | string | null;
};

export type H2HResponse = {
    year: number;
    driver1: string;
    driver2: string;
    driver1_season_points: number;
    driver2_season_points: number;
    events: H2HEventResult[];
};

export type IngestionResponse = {
    status: string;
    message: string;
    session_id: string;
};

export type ReplayBounds = {
    session_id: string;
    start_time: number;
    end_time: number;
};

export type ReplayTelemetryRow = {
    session_id: string;
    driver: string;
    timestamp: number;
    x: number;
    y: number;
    z: number;
    speed: number;
    throttle: number;
    brake: number;
    n_gear: number;
    rpm: number;
    drs: number;
    distance: number;
};

export type ReplayTelemetryResponse = {
    session_id: string;
    driver: string | null;
    time_range: { start: number; end: number };
    count: number;
    data: ReplayTelemetryRow[];
};

export type CircuitInfo = {
    id: number;
    season_year: number;
    name: string;
    round: number;
    race_date: string;
    description: string | null;
    length_km: number;
    lap_record: string | null;
    total_laps: number;
    poster_url: string | null;
};

export type DegradationPoint = {
    x: number;
    y: number;
};

export type DegradationPredictionResponse = {
    real: DegradationPoint[];
    predicted: DegradationPoint[];
};

// ----- JSON related function fetchs for graphics. -----

export const fetchDriverLaps = async (
    year: number | string,
    track: string,
    session: string,
    driver: number | string,
    ): Promise<DriverLap[]> => {
    const response = await fetch(`${BASE_URL}/data/laps/${year}/${track}/${session}/${driver}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch de la función de distribución de vueltas de un piloto');
    return (await response.json()) as DriverLap[];
};

export const fetchDriversLapsViolin = async (
    year: number,
    track: string,
    session: string,
    numDrivers: number | string,
    ): Promise<LapDistributionRecord[]> => {
    const response = await fetch(`${BASE_URL}/data/laps/distribution/${year}/${track}/${session}/${numDrivers}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función violin');
    return (await response.json()) as LapDistributionRecord[];
};

export const fetchQualyOverviewData = async (
    year: number,
    track: string,
    ): Promise<QualifyingResult[]> => {
    try {
        const response = await fetch(`${BASE_URL}/data/qualy/overview/${year}/${track}`);
        if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función de resultados de la qualy');
        const data = (await response.json()) as QualifyingResult[];

        return data;
    } catch (error: unknown) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

export const fetchSeasonForecast = async (
    year: number | string,
    signal?: AbortSignal,
): Promise<SeasonForecastResponse> => {
    const response = await fetch(`${BASE_URL}/predict/season/${year}`, { signal });
    if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(errorData.detail || 'Error al obtener la proyección de temporada');
    }
    return (await response.json()) as SeasonForecastResponse;
};

export const fetchDriverProfile = async (driver_num: number | string): Promise<DriverProfile> => {
    const response = await fetch(`${BASE_URL}/driver/profile/${driver_num}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON del perfil del piloto');
    return (await response.json()) as DriverProfile;
};

export const fetchSeasonHeatmapData = async (year: number): Promise<PointsHeatmapData> => {
    console.log("Entra en el fetch que toca");
    const response = await fetch(`${BASE_URL}/data/points/heatmap/${year}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON de la función heatmap de puntos por temporada');
    return (await response.json()) as PointsHeatmapData;
};

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
        const errorData = (await response.json()) as ApiErrorBody;
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

export const fetchYearSchedule = async (year: number | string): Promise<YearSchedule> => {
    const response = await fetch(`${BASE_URL}/data/schedule/${year}`);
    if (!response.ok) throw new Error('Error en la API al hacer el fetch del JSON del calendario.');
    return (await response.json()) as YearSchedule;
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
    ): Promise<DriverInfo[]> => {
    try {
        const event = event_name || 'latest';
        const session = session_type || 'R';

        const response = await fetch(`${BASE_URL}/data/drivers/${year}/${event}/${session}`, { signal });

        if (!response.ok) throw new Error('Error al obtener los nombres de los pilotos');

        return (await response.json()) as DriverInfo[];
    } catch (error: unknown) {
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
    ): Promise<DriverSeasonStanding> => {
    try {
        let url = `${BASE_URL}/data/standings/${year}/${driver_num}`;
        if (code) url += `?code=${encodeURIComponent(code)}`;
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error('Error al obtener la clasificacion del piloto');

        return (await response.json()) as DriverSeasonStanding;
    } catch (error: unknown) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

// Driver career standings.
export const fetchDriverCareerStandings = async (
    driver_name: string,
    signal?: AbortSignal,
    ): Promise<DriverCareerStats> => {
    try {
        const response = await fetch(`${BASE_URL}/data/career/standings/${encodeURIComponent(driver_name)}`, { signal });
        if (!response.ok) throw new Error('Error al obtener las estadisticas de la carrera del piloto');

        return (await response.json()) as DriverCareerStats;
    } catch (error: unknown) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

// ----- Standings -----

export const fetchGlobalStandings = async (): Promise<GlobalStandingEntry[]> => {
    try {
        const response = await fetch(`${BASE_URL}/standings/global/`);
        if (!response.ok) throw new Error('Error al obtener la clasificación global');
        return (await response.json()) as GlobalStandingEntry[];
    } catch (error: unknown) {
        console.error('Fetch error: ', error);
        return [];
    }
};

export const fetchStandingsByRound = async (
    year: number | string,
    round: number | string,
    ): Promise<GlobalStandingEntry[]> => {
    try {
        const response = await fetch(`${BASE_URL}/standings/${year}/${round}`);
        if (!response.ok) throw new Error('Error al obtener standings por ronda');
        return (await response.json()) as GlobalStandingEntry[];
    } catch (error: unknown) {
        console.error('Fetch error: ', error);
        return [];
    }
};

// ----- Events -----

export const fetchEventRaceDate = async (
    year: number | string,
    eventName: string,
    ): Promise<EventDate | null> => {
    try {
        const params = new URLSearchParams({ year: String(year), event_name: eventName });
        const response = await fetch(`${BASE_URL}/events/date?${params.toString()}`);
        if (!response.ok) throw new Error('Error al obtener la fecha del evento');
        return (await response.json()) as EventDate;
    } catch (error: unknown) {
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
    ): Promise<H2HResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/data/h2h/${year}/${driver1}/${driver2}`, { signal });
        if (!response.ok) throw new Error('Error al obtener los datos H2H');
        return (await response.json()) as H2HResponse;
    } catch (error: unknown) {
        console.error('Fetch error: ', error);
        throw error;
    }
};

// ---------- REPLAY SERVICE ----------
export const triggerDataIngestion = async (
    year: number | string,
    track: string,
    ): Promise<IngestionResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/service/replay/ingest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ year: typeof year === 'number' ? year : parseInt(year, 10), track }),
        });
        if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(errorData.detail || 'Error en la ingesta de telemetría');
        }
        return (await response.json()) as IngestionResponse;
    } catch (error: unknown) {
        console.error('Fetch error en triggerDataIngestion: ', error);
        throw error;
    }
};

export const getReplayBounds = async (
    year: number | string,
    track: string,
    ): Promise<ReplayBounds> => {
    try {
        const response = await fetch(`${BASE_URL}/service/replay/${year}/${track}/bounds`);
        if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(errorData.detail || 'Error al obtener límites de la telemetría');
        }
        return (await response.json()) as ReplayBounds;
    } catch (error: unknown) {
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
    ): Promise<ReplayTelemetryResponse> => {
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
        const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(errorData.detail || 'Error al obtener los datos de replay');
        }

        return (await response.json()) as ReplayTelemetryResponse;
    } catch (error: unknown) {
        console.error('Fetch error en deployReplayService: ', error);
        throw error;
    }
};

// ---------- CIRCUITS SERVICE ----------
export const getCircuitVisualInfo = async (
    seasonYear: number | string,
    roundNum: number | string,
    ): Promise<CircuitInfo | null> => {
    try {
        const response = await fetch(`${BASE_URL}/circuits/${seasonYear}/${roundNum}`);
        if (!response.ok) {
        throw new Error('Circuit details not found');
        }
        return (await response.json()) as CircuitInfo;
    } catch (error: unknown) {
        console.error('Error fetching circuit visuals:', error);
        return null;
    }
};

export const getRacesBySeason = async (seasonYear: number | string): Promise<CircuitInfo[] | null> => {
    try {
        const response = await fetch(`${BASE_URL}/circuits/${seasonYear}`);
        if (!response.ok) {
        throw new Error('Races not found');
        }
        return (await response.json()) as CircuitInfo[];
    } catch (error: unknown) {
        console.error('Error fetching races by season:', error);
        return null;
    }
};

// ---------- ML / DEGRADATION ----------
export const fetchDegradationPrediction = async (
    year: number | string,
    track: string,
    driver: number | string,
    ): Promise<DegradationPredictionResponse> => {
    try {
        const response = await fetch(
        `${BASE_URL}/predict/degradation/${year}/${encodeURIComponent(track)}/${driver}`,
        );
        if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as ApiErrorBody;
        throw new Error(errorData.detail || 'Error al obtener la predicción de degradación');
        }
        return (await response.json()) as DegradationPredictionResponse;
    } catch (error: unknown) {
        console.error('Fetch error en fetchDegradationPrediction:', error);
        throw error;
    }
};
