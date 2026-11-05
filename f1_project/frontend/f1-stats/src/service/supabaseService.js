import { supabase } from '@/lib/supabase'; 
import { getCacheBusterUrl } from '@/lib/cacheBuster';
import { uploadImageToService } from '@/service/imageUploadService';

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
        const bucketName = 'profile_avatars';
        const filePath = `${userId}/avatar.webp`;
        const uploadResult = await uploadImageToService(file, {
            bucketName,
            objectPath: filePath,
        });
        if (uploadResult.object_path !== filePath || uploadResult.content_type !== 'image/webp') {
            throw new Error('El servicio devolvió una ruta o formato inesperado.');
        }

        // Obtain bucket url.
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
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
        const { error: cleanupError } = await supabase.storage
            .from(bucketName)
            .remove([`${userId}/avatar.png`]);
        if (cleanupError) {
            console.warn('[uploadAvatarToSupabase] Could not remove the legacy PNG avatar:', cleanupError);
        }

        return avatarUrl; 

    } catch (error) {
        console.error("[uploadAvatarToSupabase] Error trying to update: ", error.message);
        return null;
    }
};

export const getProfileHeaderImageUrl = (userId, extension = 'webp') => {
    if (!userId) return null;

    const safeExtension = extension === 'png' ? 'png' : 'webp';
    const filePath = `${userId}/header.${safeExtension}`;
    const { data } = supabase.storage
        .from('profile_header_images')
        .getPublicUrl(filePath);

    return getCacheBusterUrl(data?.publicUrl);
};

export const uploadProfileHeaderImageToSupabase = async (file, userId) => {
    try {
        if (!file || !userId) throw new Error('Se necesita una imagen y un usuario.');

        const filePath = `${userId}/header.webp`;
        const uploadResult = await uploadImageToService(file, {
            bucketName: 'profile_header_images',
            objectPath: filePath,
        });
        if (uploadResult.object_path !== filePath || uploadResult.content_type !== 'image/webp') {
            throw new Error('El servicio devolvió una ruta o formato inesperado.');
        }

        return getProfileHeaderImageUrl(userId);
    } catch (error) {
        console.error('[uploadProfileHeaderImageToSupabase] Error:', error);
        return null;
    }
};

export const deleteProfileHeaderImageFromSupabase = async (userId) => {
    try {
        if (!userId) throw new Error('Se necesita un usuario para eliminar la cabecera.');

        const { error: deleteError } = await supabase.storage
            .from('profile_header_images')
            .remove([`${userId}/header.webp`, `${userId}/header.png`]);

        if (deleteError) throw deleteError;

        return true;
    } catch (error) {
        console.error('[deleteProfileHeaderImageFromSupabase] Error:', error);
        return false;
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

export const handleDeleteAccount = async () => {
    try {
        const { error } = await supabase.rpc('delete_user');
        if (error) throw error;
        await supabase.auth.signOut();
        window.location.href = '/';
        
    } catch (error) {
        console.error('Error eliminando la cuenta:', error);
        throw error;
    }
};
