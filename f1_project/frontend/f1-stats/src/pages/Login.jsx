import React from 'react';
import loginVideo from '../assets/login-video2.mp4';

export default function Login() {
    return (
        <>
            <div className="relative h-[75vh] w-full overflow-hidden bg-black">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-60"
                >
                    <source src={loginVideo} type="video/mp4" />
                    Tu navegador no soporta videos.
                </video>

                <div className="absolute object-cover inset-0 bg-linear-to-t from-black via-transparent to-black/50 z-10"></div>

                <div className="relative z-20 flex flex-col items-center justify-center h-full text-white text-center px-4">
                    <h1 className="text-7xl font-black italic tracking-tighter mb-4">
                        F1<span className="text-red-600">INSIGHTS</span>
                    </h1>
                    <p className="text-lg uppercase tracking-[0.3em] font-light text-slate-300">
                        Precision in every millisecond
                    </p>
                    
                    <button className="mt-8 px-10 py-3 bg-red-600 hover:bg-red-700 font-bold uppercase italic tracking-widest transition-all">
                        Entrar al Paddock
                    </button>
                </div>
            </div>
            
            <div className='w-full bg-slate-900 h-[50vh]'>

            </div>
        </>
    );
}