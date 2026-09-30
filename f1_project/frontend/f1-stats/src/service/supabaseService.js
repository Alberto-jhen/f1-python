import { supabase } from '@/lib/supabase'; 
import { getCacheBusterUrl } from '@/lib/cacheBuster';

export const fetchProfileById = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('[fetchProfileById] Error:', error);
        return null;
    }

    return data;
};

export const fetchPublicProfileById = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select(
            'id, username, full_name, avatar_url, created_at, location, biography, favorite_driver, favorite_team'
        )
        .eq('id', userId)
        .maybeSingle();

    if (error) throw error;

    return data;
};

export const uploadAvatarToSupabase = async (file, userId) => {
    try {
        // Use a fixed file name so upsert replaces the previous avatar.
        const fileExt = file.name.split('.').pop();
        const filePath = `${userId}/avatar.${fileExt}`;

        // Upload the avatar to the bucket
        const { error: uploadError } = await supabase.storage
            .from('profile_avatars')
            .upload(filePath, file, {
                upsert: true
            });

        if (uploadError) throw uploadError;

        // Obtain bucket url.
        const { data: publicUrlData } = supabase.storage
            .from('profile_avatars')
            .getPublicUrl(filePath);

        // Version the URL so each upload produces a unique URL. Guardada en BD,
        // fuerza a todos los consumidores (header, perfil, valoraciones) a mostrar
        // la imagen nueva tras un cambio, y permanece estable entre cambios
        // (sin recargas ni parpadeos del fallback).
        const avatarUrl = getCacheBusterUrl(publicUrlData.publicUrl);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', userId);

        if (updateError) {
            console.error('[uploadAvatarToSupabase] Error updating profile avatar: ', updateError);
            throw updateError;
        }

        return avatarUrl; 

    } catch (error) {
        console.error("[uploadAvatarToSupabase] Error trying to update: ", error.message);
        return null;
    }
};

export const uploadFavoritesToSupabase = async (favorites, userId) => {
    try {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                favorite_driver: favorites.favorite_driver ?? null,
                favorite_team: favorites.favorite_team ?? null,
            })
            .eq('id', userId);

        if (updateError) {
            console.error('[uploadFavoritesToSupabase] Error updating profile favorites: ', updateError);
            throw updateError;
        }
    } catch (error) {
        console.error('[uploadFavoritesToSupabase] Error trying to update: ', error.message);
        throw error;
    }
};

export const fetchFavoriteTeam = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('favorite_team')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('[fetchFavoriteTeam] Error:', error);
        return null;
    }

    return data;
}

export const uploadLocationToSupabase = async (location, userId) => {
    try {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ location: location ?? null })
            .eq('id', userId);

        if (updateError) {
            console.error('[uploadLocationToSupabase] Error updating profile location: ', updateError);
            throw updateError;
        }
    } catch (error) {
        console.error('[uploadLocationToSupabase] Error trying to update: ', error.message);
        throw error;
    }
};

export const uploadBiographyToSupabase = async (biography, userId) => {
    try {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ biography: biography ?? null })
            .eq('id', userId);

        if (updateError) {
            console.error('[uploadBiographyToSupabase] Error updating profile biography: ', updateError);
            throw updateError;
        }
    } catch (error) {
        console.error('[uploadBiographyToSupabase] Error trying to update: ', error.message);
        throw error;
    }
};

export const uploadFullNameToSupabase = async (fullName, userId) => {
    try {
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ full_name: fullName})
            .eq('id', userId);

        if(updateError) {
            console.error('[uploadFullNameToSupabase] Error updating profile full name: ', updateError);
            throw updateError;
        }

        
    } catch (error) {
        console.error("[uploadFullNameToSupabase] Error trying to update: ", error.message);
        throw error;
    }
}
