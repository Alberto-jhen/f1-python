import { ChevronRight } from 'lucide-react';

export function CustomCard({ icon: Icon, title, description, selected, dimmed, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`group relative p-6 md:p-8 cursor-pointer rounded-2xl border transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[200px]
                ${selected
                    ? 'bg-red-950/10 border-red-600 shadow-[0_0_40px_-10px_rgba(220,38,38,0.25)] scale-100'
                    : dimmed
                        ? 'bg-zinc-900/20 border-zinc-800/50 opacity-40 scale-[0.98] hover:opacity-60'
                        : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-600 hover:-translate-y-1'
                }`}
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-[50px] transition-opacity duration-500 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
            <div className="flex items-start justify-between relative z-10">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${selected ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-700'}`}>
                    {Icon && <Icon size={28} strokeWidth={1.5} />}
                </div>
                <div className={`p-2 rounded-full transition-all duration-300 ${selected ? 'bg-red-600/20 text-red-600' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                    <ChevronRight size={20} className={`transition-transform duration-500 ${selected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                </div>
            </div>
            <div className="relative z-10 mt-8">
                <h3 className={`text-2xl font-black uppercase tracking-tight italic transition-colors duration-300 ${selected ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                    {title}
                </h3>
                <p className="text-sm text-zinc-500 mt-2 font-medium leading-relaxed max-w-sm">
                    {description}
                </p>
            </div>
        </div>
    );
}
