import SignupFormDemo from '@/components/signup-form-demo';


export function Register() {
    return (
        <div className='relative min-h-screen overflow-hidden bg-black'>
            <div className='relative z-10 flex items-center justify-center min-h-screen px-4'>
                <SignupFormDemo />
            </div>
        </div>
    );
};
