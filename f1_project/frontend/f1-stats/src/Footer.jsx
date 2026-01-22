import sprite from './assets/sprite.svg';

export const Footer = () => {
    return (
        <div className="flex justify-center items-center w-full p-4">
            <footer className="flex items-center">
                <div className="flex gap-2">
                    <SocialButton 
                    href="https://www.instagram.com/alberto_0560/" 
                    iconName="instagram" 
                    colorClass="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" />
                    <SocialButton
                    href="https://x.com/alberto_jhen"
                    iconName="x"
                    colorClass="bg-black" />
                    <SocialButton
                    href="https://www.linkedin.com/in/alberto-mor%C3%A1n-reina-489150337/"
                    iconName="linkedin"
                    colorClass="bg-white" />
                </div>
            </footer>
        </div>
    )
}

const SocialButton = ({ href, iconName, colorClass}) => {
    return (
        <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center justify-center p-2 ${colorClass} rounded-full hover:scale-110 transition-transform duration-300 shadow-md`}
        >
            <svg width="24" height="24" className="fill-white">
                <use href={`${sprite}#${iconName}`} />
            </svg>
        </a>
    );
};