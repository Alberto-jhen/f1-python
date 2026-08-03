import SignupFormDemo from '@/components/signup-form-demo';
import { WavyBackground } from '@/components/ui/wavy-background';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Layout/Header.jsx';
import { supabase } from '@/lib/supabase.js';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function Register() {
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    const { username, email, password } = formData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.user || data.user.identities.length === 0) {
      toast.error('El correo ya está registrado. Inicia sesión o usa otro correo.');
      return;
    }

    toast.success('Cuenta creada. Revisa tu correo para verificar tu cuenta.');
    console.log('Usuario registrado:', data);

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
            Precisión en cada milisegundo. Regístrate para poder interactuar con otros usuarios apasionados de la Fórmula 1.
          </p>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2'>
            <p className='text-zinc-400 text-sm uppercase tracking-widest'>
              ¿Ya tienes cuenta?{' '}
              <Link to='/login' className='text-red-500 hover:text-red-400 transition-colors font-bold'>
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
        <div className='flex flex-col justify-center lg:justify-end space-y-4'>
          <div className='max-w-md w-full'>
            <h2 className='text-2xl font-bold text-white mb-1'>
              Crea tu cuenta
            </h2>
            <p className='text-sm text-zinc-400 mb-6'>
              Comienza tu viaje en el hub definitivo para entusiastas de la F1.
            </p>
            <SignupFormDemo onSubmit={handleSubmit} />
          </div>
        </div>
      </div>
    </WavyBackground>
    </>
  );
};
