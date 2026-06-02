import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; 
import { Links } from './Links';

export const Header = ({ variant = "solid" }) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (variant !== "dynamic") return;
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [variant]);

    const headerStyles = variant === "dynamic"
        ? `fixed top-0 left-0 w-full ${isScrolled 
            ? 'bg-zinc-950/80 backdrop-blur-md border-slate-700 py-4 shadow-2xl' 
            : 'bg-transparent border-transparent py-7'}`
        : 'relative bg-zinc-950 border-slate-700 py-6';

    return (
        <header 
            style={{ isolation: 'auto' }} 
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
                <Links />
            </nav>
            
            <div className="w-30 z-10">
            </div>
        </header>
    );
};