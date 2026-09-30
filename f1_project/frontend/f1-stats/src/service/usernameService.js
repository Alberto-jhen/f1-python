import { supabase } from '@/lib/supabase.js';
import { normalizeUsername, usernameValidator } from '@/lib/utils.js';

export async function checkUsernameAvailability(username, profileId = null) {
  const candidate = normalizeUsername(username);

  if (!usernameValidator(candidate)) return false;

  const { data, error } = await supabase.rpc('is_username_available', {
    p_username: candidate,
    p_profile_id: profileId,
  });

  if (error) throw error;

  return data === true;
}

export async function updateUsernameForUser(username, userId) {
  const candidate = normalizeUsername(username);

  if (!userId) {
    throw new Error('No se ha detectado un usuario logueado.');
  }
  if (!usernameValidator(candidate)) {
    const error = new Error('El formato del nombre de usuario no es válido.');
    error.code = 'INVALID_USERNAME';
    throw error;
  }

  const available = await checkUsernameAvailability(candidate, userId);
  if (!available) {
    const error = new Error('Ese nombre de usuario ya está en uso.');
    error.code = 'USERNAME_TAKEN';
    throw error;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .update({ username: candidate })
    .eq('id', userId)
    .select('id')
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile) throw new Error('No se encontró el perfil que se quiere actualizar.');

  const { error: authError } = await supabase.auth.updateUser({
    data: { username: candidate },
  });

  if (authError) throw authError;

  return candidate;
}
