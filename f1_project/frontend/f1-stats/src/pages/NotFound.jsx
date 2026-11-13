import { ArrowLeft, Flag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
    return (
        <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white sm:px-6">
            <Helmet>
                <title>F1 Insights - Página no encontrada (404)</title>
                <meta name="description" content="No encontramos la página que buscas. Vuelve a F1 Insights para continuar explorando estadísticas y contenido de Fórmula 1." />
                <meta name="robots" content="noindex, nofollow" />
                <meta name="theme-color" content="#030617" />
                <meta name="keywords" content="F1 Insights, error 404, página no encontrada, Fórmula 1" />

                <meta name="og-type" content="website" />
                <meta name="og-title" content="F1 Insights - Página no encontrada (404)" />
                <meta name="og-description" content="No encontramos la página que buscas. Vuelve a F1 Insights para continuar explorando estadísticas y contenido de Fórmula 1." />
            </Helmet>

            <section
                aria-labelledby="not-found-title"
                className="relative grid w-full max-w-5xl gap-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/40 backdrop-blur md:grid-cols-2 md:gap-10 md:p-8"
            >
                <div className="flex flex-col items-start justify-center p-4 sm:p-8">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
                        <Flag aria-hidden="true" size={14} />
                        Fuera de pista
                    </div>

                    <p className="text-8xl font-black leading-none tracking-[-0.08em] sm:text-9xl">
                        4<span className="text-red-500">0</span>4
                    </p>
                    <h1 id="not-found-title" className="mt-5 text-2xl font-black uppercase italic tracking-tight sm:text-3xl">
                        Te has salido de pista
                    </h1>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                        No encontramos la página que buscas. Parece que ha tomado una escapatoria.
                    </p>

                    <a
                        href="/"
                        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    >
                        <ArrowLeft aria-hidden="true" size={18} />
                        Volver al inicio
                    </a>
                </div>

                <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-white/10 bg-black md:aspect-auto md:min-h-104">
                    <img
                        src="https://media.giphy.com/media/3HFxwHayrUu2GhSsZ9/giphy.gif"
                        alt="Animación de Fórmula 1 para acompañar el error 404"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-black/10" />
                    <span className="absolute bottom-4 left-4 rounded-md border border-white/15 bg-slate-950/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 backdrop-blur">
                        Señal perdida · 404
                    </span>
                </div>
            </section>
        </main>
    );
}
