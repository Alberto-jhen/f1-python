import { supabase } from '@/lib/supabase'; 

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

        const avatarUrl = publicUrlData.publicUrl;

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
