import { StarIcon } from 'lucide-react';

export function RatingItem({ title, category, rating, date, comment }) {
  return (
    <div className='flex flex-col gap-2 border-b border-zinc-800 last:border-b-0 py-4 first:pt-0'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='font-bold text-white text-sm'>{title}</p>
          <p className='text-xs text-zinc-500 uppercase tracking-wider'>{category}</p>
        </div>
        <span className='text-xs text-zinc-500'>{date}</span>
      </div>
      <div className='flex items-center gap-1'>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className={`size-4 ${i < rating ? 'text-red-500 fill-red-500' : 'text-zinc-600'}`}
          />
        ))}
      </div>
      {comment && <p className='text-sm text-zinc-400 leading-relaxed'>{comment}</p>}
    </div>
  );
}
