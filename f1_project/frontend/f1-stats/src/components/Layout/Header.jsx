import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { Links } from './Links';
import { DropdownMenuAvatar } from '@/components/custom/DropdownMenuAvatar';
import { useAuth } from '@/hooks/useAuth';
import { fetchProfileById } from '@/service/supabaseService';

export const Header = ({ variant = "solid" }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [profile, setProfile] = useState(null);
    const { user, loading, isLoggedIn } = useAuth();

    useEffect(() => {
        if (variant !== "dynamic") return;
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [variant]);

    useEffect(() => {
        if (!user?.id) return;
        fetchProfileById(user.id).then(setProfile);
    }, [user?.id]);

    const headerStyles = variant === "dynamic"
        ? `fixed top-0 left-0 w-screen min-w-full ${isScrolled 
            ? 'bg-zinc-950/80 backdrop-blur-md border-slate-700 py-4 shadow-2xl' 
            : 'bg-transparent border-transparent py-7'}`
        : 'relative bg-zinc-950 border-slate-700 py-6';

    return (
        <header 
            className={`flex z-50 justify-between items-center px-8 transition-all duration-500 border-b ${headerStyles}`}
        >
            <div className='flex flex-row items-center align-baseline z-10'>
                <div className='h-7 rounded-md w-1 bg-red-600 mx-2' />
                <h1 className="text-red-600 font-black italic text-3xl select-none">
                    <Link to="/">
                        <span className='text-white'>F1</span> INSIGHTS
                    </Link>
                </h1>
            </div>

            <nav className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
                <Links user={user}/>
            </nav>
            
            <div className='z-10 flex items-center justify-end gap-4 shrink-0 min-w-[150px]'>
                {loading ? (
                    <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
                ) : isLoggedIn ? (
                    <DropdownMenuAvatar avatar={profile?.avatar_url} />
                ) : (
                    <>
                        <Link
                            to='/register'
                            className='text-zinc-400 text-xs font-semibold uppercase tracking-widest hover:text-white transition-colors duration-300 px-3 py-2 border border-zinc-700 rounded-md hover:border-zinc-500 hover:bg-zinc-800/50'
                        >
                            Register
                        </Link>
                        <Link
                            to='/login'
                            className='text-zinc-400 text-xs font-semibold uppercase tracking-widest hover:text-white transition-colors duration-300 px-3 py-2 border border-zinc-700 rounded-md hover:border-zinc-500 hover:bg-zinc-800/50'
                        >
                            Log in
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};