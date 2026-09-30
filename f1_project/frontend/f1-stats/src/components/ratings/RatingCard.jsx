import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getFlagEmojiByName } from '@/lib/countries';
import { deleteRating } from '@/service/ratingsService.ts';
import { RatingStars } from './RatingStars';

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

function formatRatingDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function RatingCard({
  rating,
  authorProfilePath,
  currentProfileId,
  onToggleLike,
  onDelete,
  likeLoading = false,
  deleteMode = false,
  driverMode = false,
  driverInfo = null,
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const profile = rating.profile || {};
  const race = rating.race || {};
  const displayName = profile.full_name || profile.username || 'Usuario';
  const handle = profile.username ? `@${profile.username}` : '@usuario';
  const avatar = profile.avatar_url || DEFAULT_AVATAR;
  const raceName = race.circuit_name || race.name || 'Gran Premio';
  const date = formatRatingDate(rating.created_at);
  const isLiked = !!rating.liked_by_me;
  const isMine = profile.id === currentProfileId;

  // Datos del piloto valorado (solo cuando driverMode está activo)
  const driverName = driverInfo?.label || rating.driver_id || 'Piloto';

  // Flair del autor (bandera integrada en la cabecera)
  const authorLocation = profile.location || null;
  const authorFlag = authorLocation ? getFlagEmojiByName(authorLocation) : null;

  const deleteUserRating = async (profileId, ratingId) => {
    if (!profileId || !ratingId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteRating(profileId, ratingId);
      toast.success('Valoración eliminada correctamente');
      setConfirmDeleteOpen(false);
      onDelete?.(ratingId);
    } catch (error) {
      toast.error('Error al eliminar la valoración');
      console.error('Error al eliminar la valoración:', error);
      setConfirmDeleteOpen(false);
      setIsDeleting(false);
    }
  };

  const handleLike = () => {
    if (!currentProfileId || likeLoading || isMine) return;
    onToggleLike?.(rating.id, isLiked);
  };

  return (
    <div className='bg-zinc-900/40 border border-zinc-800/90 rounded-2xl p-4 md:p-5 flex flex-col gap-3 hover:border-zinc-700/80 transition-colors overflow-hidden'>
      {/* Cabecera: avatar, autor y valoración */}
      <div className='flex items-start gap-3.5'>
        {authorProfilePath ? (
          <Link
            to={authorProfilePath}
            aria-label={`Ver el perfil de ${displayName}`}
            className='shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500'
          >
            <img
              src={avatar}
              alt={displayName}
              className='w-11 h-11 rounded-full border border-zinc-700/80 object-cover'
            />
          </Link>
        ) : (
          <img
            src={avatar}
            alt={displayName}
            className='w-11 h-11 rounded-full border border-zinc-700/80 object-cover shrink-0'
          />
        )}

        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
            <p className='text-white font-bold text-sm truncate'>
              {authorProfilePath ? (
                <Link
                  to={authorProfilePath}
                  className='hover:text-red-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500'
                >
                  {displayName}
                </Link>
              ) : (
                displayName
              )}
            </p>
            {authorFlag && (
              <span className='text-xs leading-none' title={authorLocation}>
                {authorFlag}
              </span>
            )}
            <p className='text-zinc-500 text-xs truncate'>
              {authorProfilePath ? (
                <Link
                  to={authorProfilePath}
                  className='hover:text-zinc-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500'
                >
                  {handle}
                </Link>
              ) : (
                handle
              )}
            </p>
          </div>

          {/* Subtítulo: Gran Premio y fecha */}
          <div className='flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500 uppercase tracking-wider mt-0.5'>
            <span className='truncate'>{raceName}</span>
            {date && (
              <>
                <span>•</span>
                <span>{date}</span>
              </>
            )}
          </div>

        </div>

        <div className='flex flex-col items-end gap-1 shrink-0'>
          {driverMode && (
            <span className='max-w-36 truncate text-right text-sm font-bold tracking-tight text-white'>
              {driverName}
            </span>
          )}
          <div className='flex items-center gap-3 shrink-0'>
            <RatingStars value={rating.rating} readOnly color='red' />
            {deleteMode && isMine && (
              <button
                type='button'
                disabled={isDeleting}
                onClick={() => setConfirmDeleteOpen(true)}
                aria-label='Eliminar valoración'
                className='cursor-pointer text-zinc-500 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                <TrashIcon className='size-4' />
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Comentario */}
      {rating.comment && (
        <p className='text-sm text-zinc-300 leading-relaxed pl-[3.625rem] min-w-0 max-w-full break-all whitespace-pre-wrap'>
          {rating.comment}
        </p>
      )}

      {/* Pie: Botón de Like */}
      <div className='flex items-center justify-between pl-[3.625rem] pt-2 border-t border-zinc-800/40'>
        <button
          type='button'
          onClick={handleLike}
          disabled={!currentProfileId || likeLoading || isMine}
          aria-label={isLiked ? 'Quitar like' : 'Dar like'}
          className='cursor-pointer flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Heart
            className={`size-4 transition-colors ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-zinc-500 hover:text-red-500'
            }`}
          />
          <span className={isLiked ? 'text-red-500' : 'text-zinc-500'}>
            {rating.likes || 0} {isLiked ? 'Me gusta' : 'Likes'}
          </span>
        </button>
        {!currentProfileId && (
          <span className='text-[10px] text-zinc-600 uppercase tracking-wider'>
            Inicia sesión para votar
          </span>
        )}
      </div>

      {/* Modal de confirmación de borrado */}
      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(open) => !isDeleting && setConfirmDeleteOpen(open)}
      >
        <DialogContent className='sm:max-w-sm bg-zinc-950 border-zinc-800 text-white'>
          <DialogHeader>
            <DialogTitle className='text-white'>¿Eliminar valoración?</DialogTitle>
            <DialogDescription className='text-zinc-400'>
              Se eliminará permanentemente tu valoración de {raceName}. Esta acción no se puede
              deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={isDeleting}
              className='text-black font-sans bg-gray-300 hover:bg-gray-400 cursor-pointer'
            >
              Cancelar
            </Button>
            <Button
              onClick={() => deleteUserRating(profile.id, rating.id)}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700 text-white font-sans cursor-pointer'
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}