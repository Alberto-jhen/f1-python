import { cn } from '@/lib/utils';

export function StatBadge({ value, label, trend }) {
  return (
    <div className='flex flex-col items-center justify-center rounded-xl bg-zinc-950/50 border border-zinc-800 p-4 min-w-[100px]'>
      <span className={cn('text-2xl font-black italic text-white', trend === 'up' && 'text-red-500', trend === 'down' && 'text-zinc-400')}>
        {value}
      </span>
      <span className='text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1'>{label}</span>
    </div>
  );
}
