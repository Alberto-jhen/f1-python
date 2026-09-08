import { Heart } from 'lucide-react';

import { RatingStars } from './RatingStars';

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

function formatRatingDate(dateString) {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function RatingCard({ rating, currentProfileId, onToggleLike, likeLoading = false }) {
  const profile = rating.profile || {};
  const race = rating.race || {};
  const displayName = profile.full_name || profile.username || 'Usuario';
  const handle = profile.username ? `@${profile.username}` : '@usuario';
  const avatar = profile.avatar_url || DEFAULT_AVATAR;
  const raceName = race.circuit_name || race.name || 'Gran Premio';
  const date = formatRatingDate(rating.created_at);
  const isLiked = !!rating.liked_by_me;
  const isMine = profile.id === currentProfileId;

  const handleLike = () => {
    if (!currentProfileId || likeLoading || isMine) return;
    onToggleLike?.(rating.id, isLiked);
  };

  return (
    <div className='bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 hover:border-zinc-700 transition-colors'>
      <div className='flex items-start gap-4'>
        <img
          src={avatar}
          alt={displayName}
          className='w-12 h-12 rounded-full border border-zinc-700 object-cover shrink-0'
        />
        <div className='flex-1 min-w-0'>
          <div className='flex flex-wrap items-baseline gap-x-2 gap-y-1'>
            <p className='text-white font-bold text-sm truncate'>{displayName}</p>
            <p className='text-zinc-500 text-xs truncate'>{handle}</p>
          </div>
          <div className='flex items-center gap-2 text-[11px] text-zinc-500 uppercase tracking-wider mt-0.5'>
            <span>{raceName}</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
        <div className='shrink-0'>
          <RatingStars value={rating.rating} readOnly color='red' />
        </div>
      </div>

      {rating.comment && (
        <p className='text-sm text-zinc-300 leading-relaxed pl-16'>
          {rating.comment}
        </p>
      )}

      <div className='flex items-center justify-between pl-16 pt-2 border-t border-zinc-800/50'>
        <button
          type='button'
          onClick={handleLike}
          disabled={!currentProfileId || likeLoading || isMine}
          className='flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <Heart
            className={`size-5 transition-colors ${
              isLiked ? 'text-red-500 fill-red-500' : 'text-zinc-500 hover:text-red-500'
            }`}
          />
          <span className={isLiked ? 'text-red-500' : 'text-zinc-500'}>
            {rating.likes || 0} {isLiked ? 'Me gusta' : 'Likes'}
          </span>
        </button>
        {!currentProfileId && (
          <span className='text-[10px] text-zinc-600 uppercase tracking-wider'>Inicia sesión para votar</span>
        )}
      </div>
    </div>
  );
}
