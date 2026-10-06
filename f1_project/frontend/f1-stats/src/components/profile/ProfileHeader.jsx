import { ProfileAvatar } from './ProfileAvatar';
import { CalendarIcon, ImagePlus, MapPinIcon, PencilIcon, Trash2, X } from 'lucide-react';
import {
  uploadAvatarToSupabase,
  getProfileHeaderImageUrl,
  uploadProfileHeaderImageToSupabase,
  deleteProfileHeaderImageFromSupabase,
  uploadBiographyToSupabase,
  uploadFullNameToSupabase,
  uploadLocationToSupabase,
} from '@/service/supabaseService';
import { updateUsernameForUser } from '@/service/usernameService';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { ImageCropModal } from './ImageCropModal';
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
const MAX_HEADER_IMAGE_SIZE = 20 * 1024 * 1024;

export function ProfileHeader({ user, userId, editable, onProfileUpdated }) {
  const avatarRef = useRef(null);
  const headerImageInputRef = useRef(null);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [username, setUsername] = useState(user.username || '');
  const [biography, setBiography] = useState(user.biography || '');
  const [location, setLocation] = useState(user.location || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [headerImageUrl, setHeaderImageUrl] = useState(() => getProfileHeaderImageUrl(userId));
  const [headerImageLoaded, setHeaderImageLoaded] = useState(false);
  const [headerCropImage, setHeaderCropImage] = useState(null);
  const [isHeaderCropOpen, setIsHeaderCropOpen] = useState(false);
  const [savingHeaderImage, setSavingHeaderImage] = useState(false);
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

  const handleHeaderImageFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido.');
      return;
    }

    if (file.size > MAX_HEADER_IMAGE_SIZE) {
      toast.error('La imagen de cabecera no puede superar los 20 MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setHeaderCropImage(objectUrl);
    setIsHeaderCropOpen(true);
  };

  const closeHeaderCropModal = () => {
    setIsHeaderCropOpen(false);
    if (headerCropImage) {
      URL.revokeObjectURL(headerCropImage);
      setHeaderCropImage(null);
    }
  };

  const handleHeaderImageUpload = async ({ file }) => {
    if (!userId || !file) {
      toast.error('No se ha detectado un usuario logueado');
      return;
    }

    if (file.size > MAX_HEADER_IMAGE_SIZE) {
      toast.error('La imagen de cabecera recortada no puede superar los 20 MB.');
      return;
    }

    setSavingHeaderImage(true);
    try {
      const uploadedUrl = await uploadProfileHeaderImageToSupabase(file, userId);
      if (!uploadedUrl) throw new Error('No se pudo subir la imagen de cabecera.');

      setHeaderImageUrl(uploadedUrl);
      setHeaderImageLoaded(false);
      toast.success('Imagen de cabecera actualizada');
    } catch (error) {
      console.error('Error al actualizar la imagen de cabecera:', error);
      toast.error('Error al actualizar la imagen de cabecera');
    } finally {
      setSavingHeaderImage(false);
    }
  };

  const handleHeaderImageDelete = async () => {
    if (!userId) {
      toast.error('No se ha detectado un usuario logueado');
      return;
    }

    setSavingHeaderImage(true);
    try {
      const deleted = await deleteProfileHeaderImageFromSupabase(userId);
      if (!deleted) throw new Error('No se pudo eliminar la imagen de cabecera.');

      setHeaderImageUrl(null);
      setHeaderImageLoaded(false);
      toast.success('Imagen eliminada; se restauró el diseño predeterminado');
    } catch (error) {
      console.error('Error al eliminar la imagen de cabecera:', error);
      toast.error('Error al eliminar la imagen de cabecera');
    } finally {
      setSavingHeaderImage(false);
    }
  };

  const handleHeaderImageError = () => {
    setHeaderImageUrl(null);
    setHeaderImageLoaded(false);
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
      <div className='relative h-64 w-full overflow-hidden rounded-b-3xl bg-gradient-to-r from-red-900/40 via-zinc-900 to-black md:h-72'>
        {headerImageUrl && (
          <img
            src={headerImageUrl}
            alt=''
            aria-hidden='true'
            loading='eager'
            fetchPriority='high'
            onLoad={() => setHeaderImageLoaded(true)}
            onError={handleHeaderImageError}
            className='absolute inset-0 size-full object-cover'
          />
        )}
      </div>
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
              <span className='text-sm font-medium text-zinc-300'>Imagen de cabecera</span>
              <div className='relative h-24 w-full overflow-hidden rounded-lg bg-gradient-to-r from-red-900/40 via-zinc-900 to-black'>
                {headerImageUrl && (
                  <img
                    src={headerImageUrl}
                    alt=''
                    aria-hidden='true'
                    onLoad={() => setHeaderImageLoaded(true)}
                    onError={handleHeaderImageError}
                    className='absolute inset-0 size-full object-cover'
                  />
                )}
                <span className='absolute bottom-2 left-3 rounded bg-black/50 px-2 py-1 text-xs font-medium text-white'>
                  Vista previa de la cabecera
                </span>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                <button
                  type='button'
                  onClick={() => headerImageInputRef.current?.click()}
                  disabled={savingHeaderImage}
                  className='inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <ImagePlus className='size-4' aria-hidden='true' />
                  {headerImageUrl ? 'Cambiar cabecera' : 'Añadir cabecera'}
                </button>
                {headerImageUrl && headerImageLoaded && (
                  <button
                    type='button'
                    onClick={handleHeaderImageDelete}
                    disabled={savingHeaderImage}
                    className='inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    <Trash2 className='size-4' aria-hidden='true' />
                    Eliminar cabecera
                  </button>
                )}
                <input
                  ref={headerImageInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleHeaderImageFileChange}
                  disabled={savingHeaderImage}
                  className='hidden'
                  aria-label='Seleccionar imagen de cabecera'
                />
              </div>
              <p className='text-xs text-zinc-500'>
                Si la eliminas, volverá a mostrarse el degradado predeterminado. Máximo 20 MB.
              </p>
              {savingHeaderImage && (
                <p className='text-xs text-zinc-300' role='status'>
                  Actualizando imagen de cabecera...
                </p>
              )}
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
      <ImageCropModal
        image={headerCropImage}
        open={isHeaderCropOpen}
        onClose={closeHeaderCropModal}
        onConfirm={handleHeaderImageUpload}
        aspect={3}
        title='Ajustar imagen de cabecera'
      />
    </div>
  );
}