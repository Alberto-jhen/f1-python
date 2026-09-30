import { ProfileAvatar } from './ProfileAvatar';
import { CalendarIcon, MapPinIcon, PencilIcon, X } from 'lucide-react';
import {
  uploadAvatarToSupabase,
  uploadBiographyToSupabase,
  uploadFullNameToSupabase,
  uploadLocationToSupabase,
} from '@/service/supabaseService';
import { updateUsernameForUser } from '@/service/usernameService';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  formatDateToProfile,
  isUsernameConflictError,
  normalizeUsername,
  usernameValidator,
} from '@/lib/utils';
import { GenericCombobox } from '@/components/GenericComobobox';
import { COUNTRY_OPTIONS, getFlagEmojiByName } from '@/lib/countries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const BIOGRAPHY_MAX_LENGTH = 400;

export function ProfileHeader({ user, userId, editable, onProfileUpdated }) {
  const avatarRef = useRef(null);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [username, setUsername] = useState(user.username || '');
  const [biography, setBiography] = useState(user.biography || '');
  const [location, setLocation] = useState(user.location || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user.full_name || '',
    username: user.username || '',
    biography: user.biography || '',
    location: user.location || '',
  });

  const formattedJoinedAt = formatDateToProfile(user.created_at);
  const locationFlag = location ? getFlagEmojiByName(location) : null;

  const handleImageChange = async ({ file }) => {
    if (!userId || !file) {
      toast.error('No se ha detectado un usuario logueado');
      return;
    }

    console.log('[ProfileHeader] Subiendo avatar para userId:', userId);
    const uploadedUrl = await uploadAvatarToSupabase(file, userId);

    if (uploadedUrl) {
      // uploadedUrl ya viene versionado (?v=...) desde el servicio.
      setAvatarUrl(uploadedUrl);
      // Notifica al header para que muestre la nueva foto sin esperar a otra navegación.
      window.dispatchEvent(
        new CustomEvent('avatar-updated', { detail: { userId, avatarUrl: uploadedUrl } })
      );
      toast.success('Foto de perfil actualizada');
    } else {
      toast.error('Error al actualizar la foto de perfil');
    }
  };

  const openEditModal = () => {
    setEditForm({ fullName, username, biography, location });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveChanges = async () => {
    if (!userId) {
      toast.error('No se ha detectado un usuario logueado');
      return;
    }
    const nextUsername = normalizeUsername(editForm.username);
    if (!usernameValidator(nextUsername)) {
      toast.error('El username debe tener entre 3 y 30 caracteres válidos.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        updateUsernameForUser(nextUsername, userId),
        uploadFullNameToSupabase(editForm.fullName, userId),
        uploadBiographyToSupabase(editForm.biography, userId),
        uploadLocationToSupabase(editForm.location || null, userId),
      ]);
      const updatedProfile = {
        full_name: editForm.fullName,
        username: nextUsername,
        biography: editForm.biography,
        location: editForm.location || null,
      };
      setFullName(editForm.fullName);
      setUsername(nextUsername);
      setBiography(editForm.biography);
      setLocation(editForm.location || '');
      onProfileUpdated?.(updatedProfile);
      setIsEditModalOpen(false);
      toast.success('Perfil actualizado');
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      toast.error(
        isUsernameConflictError(error)
          ? 'Ese nombre de usuario ya está en uso. Prueba con otro.'
          : 'Error al actualizar el perfil'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='relative w-full'>
      <div className='h-48 w-full bg-gradient-to-r from-red-900/40 via-zinc-900 to-black rounded-b-3xl' />
      <div className='max-w-6xl mx-auto px-6 mt-6 relative z-10 flex flex-col md:flex-row items-center gap-6'>
        <ProfileAvatar
          src={avatarUrl}
          fallback={fullName ? fullName.charAt(0).toUpperCase() : 'U'}
          size='xxl'
          editable={false}
          onImageChange={handleImageChange}
        />
        <div className='flex-1 min-w-0 text-center md:text-left'>
          <h1 className='text-4xl font-black italic text-white tracking-tighter'>
            {fullName}
          </h1>
          <p className='text-zinc-400 text-sm mt-1'>@{username}</p>
          {biography && (
            <p className='text-zinc-400 text-sm mt-3 max-w-xl leading-relaxed break-all whitespace-pre-wrap'>
              {biography}
            </p>
          )}
          <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-xs text-zinc-500 uppercase tracking-widest'>
            {location && (
              <span className='flex items-center gap-1.5'>
                {locationFlag ? (
                  <span className='text-base leading-none' aria-hidden='true'>
                    {locationFlag}
                  </span>
                ) : (
                  <MapPinIcon className='size-3' />
                )}
                {location}
              </span>
            )}
            {formattedJoinedAt && (
              <span className='flex items-center gap-1'>
                <CalendarIcon className='size-3' /> Miembro desde {formattedJoinedAt}
              </span>
            )}
            {editable && (
              <button
                type='button'
                onClick={openEditModal}
                className='flex items-center gap-2 text-zinc-300 hover:text-white cursor-pointer transition-colors'>
                <PencilIcon className='size-3' />
                <span>Editar perfil</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-lg bg-zinc-950 border-zinc-800 text-white'>
          <DialogHeader>
            <DialogTitle className='text-white'>Editar perfil</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='flex flex-col items-center gap-3'>
              <ProfileAvatar
                ref={avatarRef}
                src={avatarUrl}
                fallback={editForm.fullName ? editForm.fullName.charAt(0).toUpperCase() : 'U'}
                size='lg'
                editable={false}
                onImageChange={handleImageChange}
              />
              <button
                type='button'
                onClick={() => avatarRef.current?.openFilePicker()}
                className='text-sm text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer'>
                Cambiar foto de perfil
              </button>
            </div>
            <div className='space-y-2'>
              <label htmlFor='edit-fullName' className='text-sm font-medium text-zinc-300'>
                Nombre completo
              </label>
              <input
                id='edit-fullName'
                type='text'
                value={editForm.fullName}
                onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className='w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-red-600'
              />
            </div>
            <div className='space-y-2'>
              <label htmlFor='edit-username' className='text-sm font-medium text-zinc-300'>
                Nombre de usuario
              </label>
              <div className='flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 focus-within:border-red-600'>
                <span className='text-zinc-500' aria-hidden='true'>
                  @
                </span>
                <input
                  id='edit-username'
                  type='text'
                  value={editForm.username}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))}
                  maxLength={30}
                  autoComplete='username'
                  autoCapitalize='none'
                  spellCheck={false}
                  className='w-full bg-transparent px-2 py-2 text-sm text-white outline-none'
                />
              </div>
              <p className='text-xs text-zinc-500'>
                3–30 caracteres. Solo letras, números, guiones y guiones bajos.
              </p>
            </div>
            <div className='space-y-2'>
              <span className='text-sm font-medium text-zinc-300'>País</span>
              <div className='flex items-center gap-2'>
                <div className='min-w-0 flex-1'>
                  <GenericCombobox
                    options={COUNTRY_OPTIONS}
                    value={editForm.location}
                    onChange={(nextLocation) =>
                      setEditForm((prev) => ({ ...prev, location: nextLocation }))
                    }
                    placeholder='Selecciona tu país...'
                    disabled={saving}
                  />
                </div>
                {editForm.location && (
                  <button
                    type='button'
                    onClick={() => setEditForm((prev) => ({ ...prev, location: '' }))}
                    disabled={saving}
                    aria-label='Quitar país'
                    className='shrink-0 rounded-md border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50'
                  >
                    <X className='size-4' />
                  </button>
                )}
              </div>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <label htmlFor='edit-biography' className='text-sm font-medium text-zinc-300'>
                  Biografía
                </label>
                <span className='text-xs text-zinc-500'>
                  {editForm.biography.length}/{BIOGRAPHY_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id='edit-biography'
                rows={4}
                maxLength={BIOGRAPHY_MAX_LENGTH}
                value={editForm.biography}
                onChange={(e) => setEditForm((prev) => ({ ...prev, biography: e.target.value }))}
                placeholder='Cuéntanos algo sobre ti...'
                className='w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-red-600 resize-none'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={closeEditModal}
              className='text-black font-sans bg-gray-300 hover:bg-gray-400 cursor-pointer'>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={saving}
              className='bg-green-500 hover:bg-green-600 text-white font-sans cursor-pointer'>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}