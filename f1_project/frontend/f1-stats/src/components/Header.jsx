import { useState } from 'react';
import basicIcons from '../assets/basicIcons.svg';

export const Header = () => {
    return (
        <header style={{ isolation: 'isolate' }} className="flex z-100 justify-between items-center p-10 border-b border-gray-400">
            <h1 className="text-red-600 font-black italic text-4xl">
                F1 STATS
            </h1>
            <div className="absolute top-8 right-8 hover:opacity-90 transition-opacity">
                <MobileMenu />
            </div>
        </header>
    )
}

export const MobileMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const toggle = () => setIsOpen(!isOpen);

    return (
        <>
            <button 
                onClick={toggle}
                className="hover:scale-115 transition-transform active:scale-95 flex items-center justify-center p-2 cursor-pointer"
            >
                <img 
                    src={basicIcons} 
                    alt="Abrir menú" 
                    className="w-8 h-8"
                    style={{ filter: 'brightness(0) invert(1)' }} 
                />
            </button>

            <div className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-9999 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={toggle} />
            <aside 
                className={`fixed top-0 right-0 h-full w-full sm:w-80 bg-slate-900 border-l border-slate-800 z-10000 p-10 transform transition-transform duration-500 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'}`} >
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
    const aStyle = "text-white text-3xl font-black italic uppercase tracking-tighter hover:text-red-600 transition-all inline-block hover:translate-x-2"
    return (
        <ul className="flex flex-col gap-6">
            <li>
                <a href="/" className={aStyle}>Inicio</a>
            </li>
            <li>
                <a href="/form" className={aStyle}>Contacto</a>
            </li>
            <li>
                <a href="/graphics" className={aStyle}>Gráficas</a>
            </li>
        </ul>
    )
}