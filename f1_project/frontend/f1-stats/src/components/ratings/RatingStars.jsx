import { useState } from 'react';
import { StarIcon } from 'lucide-react';

export function RatingStars({ value, onChange, readOnly = false, color = 'red' }) {
  const [hover, setHover] = useState(0);
  const colorClasses = color === 'yellow'
    ? 'text-yellow-400 fill-yellow-400'
    : 'text-red-500 fill-red-500';

  return (
    <div className='flex items-center gap-1'>
      {Array.from({ length: 5 }).map((_, i) => {
        const ratingValue = i + 1;
        const filled = (hover || value) >= ratingValue;
        return (
          <button
            key={i}
            type='button'
            disabled={readOnly}
            onClick={() => onChange?.(ratingValue)}
            onMouseEnter={() => !readOnly && setHover(ratingValue)}
            onMouseLeave={() => setHover(0)}
            className={`transition-transform hover:scale-110 ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <StarIcon
              className={`size-5 ${filled ? colorClasses : 'text-zinc-600'}`}
            />
          </button>
        );
      })}
    </div>
  );
}
