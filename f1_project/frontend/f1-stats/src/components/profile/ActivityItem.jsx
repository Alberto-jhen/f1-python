import { cn } from '@/lib/utils';

export function ActivityItem({ icon, title, description, date, type = 'neutral' }) {
  const Icon = icon;
  const typeClasses = {
    neutral: 'bg-zinc-800 text-zinc-400',
    red: 'bg-red-600/20 text-red-500',
    blue: 'bg-blue-600/20 text-blue-500',
    green: 'bg-green-600/20 text-green-500',
  };

  return (
    <div className='flex items-start gap-4 py-4 border-b border-zinc-800 last:border-b-0 first:pt-0'>
      <div className={cn('rounded-full p-2 mt-0.5', typeClasses[type])}>
        <Icon className='size-4' />
      </div>
      <div className='flex-1'>
        <p className='text-sm font-bold text-white'>{title}</p>
        <p className='text-xs text-zinc-400 mt-0.5'>{description}</p>
      </div>
      <span className='text-xs text-zinc-600 whitespace-nowrap'>{date}</span>
    </div>
  );
}
