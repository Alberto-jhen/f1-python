import { useState, useEffect } from 'react';
import basicIcons from '../assets/basicIcons.svg'; 

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
            <div className='flex flex-row items-center align-baseline'>
                <div className='h-7 rounded-md w-1 bg-red-600 mx-2' />
                <h1 className="text-red-600 font-black italic text-3xl select-none">
                    <span className='text-white'>F1</span> INSIGHTS
                </h1>
            </div>

            <div className="hover:opacity-90 transition-opacity">
                <MobileMenu />
            </div>
        </header>
    );
};

export const MobileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    return (
        <>
            <div className='h-12 w-12 bg-zinc-900 rounded-2xl border border-slate-700 flex items-center justify-center hover:scale-110 transition-transform active:scale-95'>
                <button onClick={toggle} className="w-full h-full flex items-center justify-center cursor-pointer">
                    <img src={basicIcons} alt="Abrir menú" className="w-8 h-8" style={{ filter: 'brightness(0) invert(1)' }} />
                </button>
            </div>

            <div 
                className={`fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100 z-9998' : 'opacity-0 pointer-events-none'}`} 
                onClick={toggle} 
            />

            <aside 
                className={`fixed top-0 right-0 h-screen w-full sm:w-80 bg-slate-900 border-l border-slate-800 p-10 transform transition-transform duration-500 ease-in-out ${
                    isOpen ? 'translate-x-0 z-9999' : 'translate-x-full z-9999'}`} 
            >
                <div className="flex justify-end mb-12">
                    <button onClick={toggle} className="text-white hover:text-red-600 transition-colors text-2xl cursor-pointer">✕</button>
                </div>

                <nav className="flex flex-col gap-8">
                    <h2 className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Navegación</h2>
                    <Link />
                </nav>
            </aside>
        </>
    );
};

const Link = () => {
    const aStyle = "text-white text-3xl font-black italic uppercase tracking-tighter group-hover:text-red-600 transition-all inline-block group-hover:translate-x-2"
    return (
        <ul className="flex flex-col gap-6">
            <li className='group'>
                <div className='flex flex-row gap-1 items-center align-baseline'>
                    <div className='w-0 h-1 bg-red-600 rounded-md opacity-0 transition-all duration-500 ease-in-out group-hover:w-8 group-hover:opacity-100'></div>
                    <a href="/" className={aStyle}>Inicio</a>
                </div>
            </li>
            <li className='group'>
                <div className='flex flex-row gap-1 items-center align-baseline'>
                    <div className='w-0 h-1 bg-red-600 rounded-md opacity-0 transition-all duration-500 ease-in-out group-hover:w-8 group-hover:opacity-100'></div>
                    <a href="/form" className={aStyle}>Contacto</a>
                </div>
            </li>
            <li className='group'>
                <div className='flex flex-row gap-1 items-center align-baseline'>
                    <div className='w-0 h-1 bg-red-600 rounded-md opacity-0 transition-all duration-500 ease-in-out group-hover:w-8 group-hover:opacity-100'></div>
                    <a href="/graphics" className={aStyle}>Gráficas</a>
                </div>
            </li>
            <li className='group'>
                <div className='flex flex-row gap-1 items-center align-baseline'>
                    <div className='w-0 h-1 bg-red-600 rounded-md opacity-0 transition-all duration-500 ease-in-out group-hover:w-8 group-hover:opacity-100'></div>
                    <a href="/drivers" className={aStyle}>Pilotos</a>
                </div>
            </li>
        </ul>
    )
}