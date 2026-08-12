import { cn } from '@/lib/utils';

export function FavoriteCard({ title, name, subtitle, image, color = 'red' }) {
  const colorClasses = {
    red: 'from-red-600/20 to-transparent border-red-600/30',
    blue: 'from-blue-600/20 to-transparent border-blue-600/30',
    yellow: 'from-yellow-600/20 to-transparent border-yellow-600/30',
    green: 'from-green-600/20 to-transparent border-green-600/30',
    gray: 'from-zinc-600/20 to-transparent border-zinc-600/30',
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5', colorClasses[color])}>
      <div className='relative z-10'>
        <p className='text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2'>{title}</p>
        <h4 className='text-2xl font-black italic text-white tracking-tighter'>{name}</h4>
        <p className='text-sm text-zinc-400 mt-1'>{subtitle}</p>
      </div>
      {image && (
        <img
          src={image}
          alt={name}
          className='absolute -right-4 -bottom-4 w-24 h-24 object-contain opacity-30 grayscale'
        />
      )}
    </div>
  );
}
