const BASE_URL = 'http://localhost:8000';

export const MAX_COMMENT_LENGTH = 400;

/** Error code used when the user already rated the same race/driver. */
export const DUPLICATE_RATING_CODE = 'DUPLICATE_RATING';

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
    if (ratingData.comment && ratingData.comment.length > MAX_COMMENT_LENGTH) {
        throw new Error(
            `El comentario no puede superar los ${MAX_COMMENT_LENGTH} caracteres (tiene ${ratingData.comment.length}). Acórtalo e inténtalo de nuevo.`
        );
    }
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
            const detail = typeof errorData.detail === 'string' ? errorData.detail : null;
            const httpError: Error & { code?: string } = new Error(
                detail || 'Error al publicar la valoración'
            );
            if (response.status === 409) {
                httpError.code = DUPLICATE_RATING_CODE;
            }
            throw httpError;
        }
        return await response.json();
    } catch (error: any) {
        // Network failures surface in the browser as TypeError ("Failed to fetch").
        // Duplicate ratings used to trigger this when the backend answered 500 without
        // CORS headers, so flag it as a possible duplicate with a friendly message.
        if (error instanceof TypeError) {
            const networkError: Error & { code?: string } = new Error(
                'No se pudo publicar la valoración: puede que ya hayas valorado esta carrera o que el servidor no esté disponible.'
            );
            networkError.code = DUPLICATE_RATING_CODE;
            throw networkError;
        }
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

export const deleteRating = async (
    profileId: string,
    ratingId: string | number,
    ): Promise<any> => {
    try {
        const response = await fetch(`${BASE_URL}/ratings/${encodeURIComponent(profileId)}/${encodeURIComponent(ratingId)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Error al eliminar la valoración');
        }
        return await response.json();
    } catch (error: any) {
        console.error('Fetch error en deleteRating:', error);
        throw error;
    }
};

export const fetchUserRatings = async (
    profileId: string,
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

        const queryString = query.toString() ? `?${query.toString()}` : '';
        const response = await fetch(
            `${BASE_URL}/ratings/profile/${encodeURIComponent(profileId)}${queryString}`,
            { signal }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Error al obtener las valoraciones del usuario');
        }
        return await response.json();
    } catch (error: any) {
        if (error.name === 'AbortError') throw error;
        console.error('Fetch error en fetchUserRatings:', error);
        throw error;
    }
};