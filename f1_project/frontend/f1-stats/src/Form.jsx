import formBg from './assets/form-bg.svg';
import basicIcons from './assets/basicIcons.svg'
import sprite from './assets/sprite.svg'

export const Form = () => {
    return (
        <div className="flex min-h-screen bg-slate-950">
            <div 
                style={{ backgroundImage: `url(${formBg})` }} 
                className="hidden lg:flex w-1/2 items-center z-0 justify-center border-r border-slate-800 bg-cover bg-center"
            >
                <h2 className="text-white text-6xl z-10 font-black italic tracking-tighter uppercase text-center px-10 drop-shadow-2xl">
                    ¡Contáctame!
                </h2>
            </div>

            <main className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12">
                <div className="absolute top-8 right-8 cursor-pointer hover:opacity-80 transition-opacity">
                    <img 
                        src={basicIcons} 
                        alt="Icono Menú" 
                        className="w-10 h-10" 
                        style={{ filter: 'brightness(0) invert(1)' }} 
                    />
                </div>
                <div className="w-full max-w-md">
                    <h3 className="text-white text-3xl font-bold mb-2">Envía un mensaje</h3>
                    <p className="text-slate-400 mb-8">¿Tienes alguna consulta sobre el proyecto o relacionado? <br/>Escríbeme.</p>
                    <ActualForm />
                </div>
            </main>
        </div>
    )
}

const ActualForm = () => {
    return (
        <form className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Nombre</label>
                <input 
                    type="text" 
                    placeholder="Tu nombre"
                    className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Email</label>
                <input 
                    type="email" 
                    placeholder="tu@email.com"
                    className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Mensaje</label>
                <textarea 
                    rows="4"
                    placeholder="¿En qué puedo ayudarte?"
                    className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all resize-none"
                />
            </div>

            <button 
                type="submit"
                className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-colors uppercase tracking-widest shadow-lg shadow-red-900/20"
            >
            Enviar Email
            </button>
        </form>
    )
}