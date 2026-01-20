import sprite from './assets/sprite.svg';

// TODO componetizar el elemento <a> para el resto de enlaces
export const Footer = () => {
    return (
        <div className="flex justify-center items-center w-full p-4">
            <footer className="flex items-center">
                <div>
                    <a 
                        href="https://www.instagram.com/alberto_0560/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center p-2 bg-pink-400 rounded-full hover:scale-110 transition-transform duration-300 shadow-md"
                    >
                        <svg width="26" height="26" className="fill-white">
                            <use href={`${sprite}#instagram`} />
                        </svg>
                    </a>
                </div>
            </footer>
        </div>
    )
}