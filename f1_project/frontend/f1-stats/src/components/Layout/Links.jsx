import { Link } from 'react-router-dom';

export const Links = () => {
    const linkStyle = "text-zinc-400 text-xs font-medium uppercase tracking-widest hover:text-white transition-colors duration-300 py-2";
    
    return (
        <ul className="flex flex-row gap-8 items-center">
            <li>
                <Link to="/graphics" className={linkStyle}>
                    Gráficas
                </Link>
            </li>
            <li>
                <Link to="/drivers" className={linkStyle}>
                    Pilotos
                </Link>
            </li>
            <li>
                <Link to="/replays" className={linkStyle}>
                    Repeticiones
                </Link>
            </li>
            <li>
                <Link to="/leaderboard" className={linkStyle}>
                    Clasificación
                </Link>
            </li>
            <li>
                <Link to="/degradation-test" className={linkStyle}>
                    Degradación
                </Link>
            </li>
        </ul>
    );
};
