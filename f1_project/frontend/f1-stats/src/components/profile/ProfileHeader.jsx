import { ProfileAvatar } from './ProfileAvatar';
import { CalendarIcon, PencilIcon } from 'lucide-react';
import { getCacheBusterUrl } from '@/lib/cacheBuster';
import { uploadAvatarToSupabase, uploadFullNameToSupabase } from '@/service/supabaseService';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { formatDateToProfile } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const PLACEHOLDER_BIO = 'Apasionado de la Fórmula 1. Me encanta analizar telemetría, comparar estrategias y debatir sobre cada Gran Premio.';

export function ProfileHeader({ user, userId, editable }) {
  const avatarRef = useRef(null);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [bio, setBio] = useState(PLACEHOLDER_BIO);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: user.full_name || '', bio: PLACEHOLDER_BIO });

  const formattedJoinedAt = formatDateToProfile(user.created_at);

  const handleImageChange = async ({ file }) => {
    if (!userId || !file) {
      toast.error('No se ha detectado un usuario logueado');
      return;
    }

    console.log('[ProfileHeader] Subiendo avatar para userId:', userId);
    const uploadedUrl = await uploadAvatarToSupabase(file, userId);

    if (uploadedUrl) {
      setAvatarUrl(getCacheBusterUrl(uploadedUrl));
      toast.success('Foto de perfil actualizada');
    } else {
      toast.error('Error al actualizar la foto de perfil');
    }
  };

  const openEditModal = () => {
    setEditForm({ fullName, bio });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveChanges = () => {
    setFullName(editForm.fullName);
    setBio(editForm.bio);
    uploadFullNameToSupabase(editForm.fullName, userId);
    setIsEditModalOpen(false);
    toast.success('Perfil actualizado');
  };

  return (
    <div className='relative w-full'>
      <div className='h-48 w-full bg-gradient-to-r from-red-900/40 via-zinc-900 to-black rounded-b-3xl' />
      <div className='max-w-6xl mx-auto px-6 -mt-16 relative z-10'>
        <div className='flex flex-col md:flex-row items-start md:items-end gap-6'>
          <ProfileAvatar
            src={avatarUrl}
            fallback={fullName ? fullName.charAt(0).toUpperCase() : 'U'}
            size='xl'
            editable={false}
            onImageChange={handleImageChange}
          />
          <div className='flex-1 mb-2'>
            <h1 className='text-4xl font-black italic text-white tracking-tighter'>
              {fullName}
            </h1>
            <p className='text-zinc-400 text-sm mt-1'>@{user.username}</p>
            <p className='text-zinc-400 text-sm mt-3 max-w-xl leading-relaxed'>{bio}</p>
            <div className='flex flex-wrap items-center gap-4 mt-3 text-xs text-zinc-500 uppercase tracking-widest'>
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
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className='sm:max-w-md bg-zinc-950 border-zinc-800 text-white'>
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
                Nombre
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
              <label htmlFor='edit-bio' className='text-sm font-medium text-zinc-300'>
                Biografía
              </label>
              <textarea
                id='edit-bio'
                rows={4}
                value={editForm.bio}
                onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
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
              className='bg-green-500 hover:bg-green-600 text-white font-sans cursor-pointer'>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
