import formBg from '../assets/form-bg.svg';
import { MobileMenu } from '../components/Layout/Header.jsx'
import { useState } from 'react'

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
                <div className="absolute top-8 right-8 hover:opacity-90 transition-opacity">
                    <MobileMenu />
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
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    // State to give feedback to the user to prevent multiple requests.
    const [status, setStatus] = useState({ loading: false, success: null });

    // Handles values updates in the FormData
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: null });

        try {
            const response = await fetch('http://localhost:8000/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData), 
            });

            if (response.ok) {
                setStatus({ loading: false, success: true });
                setFormData({ name: '', email: '', message: '' }); 
                alert("¡Mensaje enviado con éxito!");
            } else {
                throw new Error('Error en el servidor');
            }
        } catch (error) {
            setStatus({ loading: false, success: false });
            alert("Hubo un error al enviar el mensaje.");
        }
    };

    return (
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Nombre</label>
                <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    required
                    className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Email</label>
                <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="tu@email.com"
                    required
                    className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Mensaje</label>
                <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4"
                    placeholder="¿En qué puedo ayudarte?"
                    required
                    className="bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all resize-none"
                />
            </div>

            <button 
                type="submit"
                disabled={status.loading}
                className="mt-4 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg transition-colors uppercase tracking-widest shadow-lg shadow-red-900/20 disabled:opacity-50"
            >
                {status.loading ? "Enviando..." : "Enviar Email"}
            </button>
        </form>
    );
};