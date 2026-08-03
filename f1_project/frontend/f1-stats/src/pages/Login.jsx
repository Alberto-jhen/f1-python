import SignupFormDemo from '@/components/signup-form-demo';
import { WavyBackground } from '@/components/ui/wavy-background';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Layout/Header.jsx';
import { supabase } from '@/lib/supabase.js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    const { email, password } = formData;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Inicio de sesión correcto');
    console.log('Usuario logueado:', data);

    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  return (
    <>
      <Header />
      <div className='fixed inset-0 bg-slate-950 z-0' />
      <WavyBackground
        containerClassName='h-screen w-full flex-row items-center justify-center'
        className='w-full h-full flex items-center justify-center px-6 animate-fade-in-up'
        backgroundFill='#050505'
        blur={15}
        speed='slow'
        waveOpacity={0.4}
        colors={['#ff2d2d', '#ff6b00', '#ffcc00', '#ff4d4d', '#ffffff']}
      >
      <div className='w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10'>
        <div className='text-white space-y-6'>
          <h1 className='text-5xl md:text-7xl font-black italic tracking-tighter leading-none'>
            <span className='text-red-600'>F1</span> INSIGHTS
          </h1>
          <p className='text-zinc-300 text-lg md:text-xl max-w-md leading-relaxed'>
            Bienvenido de nuevo. Inicia sesión para acceder a tu garaje de telemetría y seguir cada milisegundo de la F1.
          </p>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2'>
            <p className='text-zinc-400 text-sm uppercase tracking-widest'>
              ¿No tienes cuenta?{' '}
              <Link to='/register' className='text-red-500 hover:text-red-400 transition-colors font-bold'>
                Regístrate
              </Link>
            </p>
          </div>
        </div>
        <div className='flex flex-col justify-center lg:justify-end space-y-4'>
          <div className='max-w-md w-full'>
            <h2 className='text-2xl font-bold text-white mb-1'>
              Iniciar sesión
            </h2>
            <p className='text-sm text-zinc-400 mb-6'>
              Accede a tu cuenta para continuar con el análisis.
            </p>
            <SignupFormDemo mode='login' onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </WavyBackground>
    </>
  );
}
