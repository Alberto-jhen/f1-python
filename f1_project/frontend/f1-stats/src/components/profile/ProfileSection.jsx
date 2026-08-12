import { cn } from '@/lib/utils';

export function ProfileSection({ title, icon: Icon, children, className }) {
  return (
    <section className={cn('bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6', className)}>
      <div className='flex items-center gap-3 mb-4'>
        {Icon && <Icon className='size-5 text-red-500' />}
        <h3 className='text-lg font-bold text-white tracking-tight'>{title}</h3>
      </div>
      {children}
    </section>
  );
}
