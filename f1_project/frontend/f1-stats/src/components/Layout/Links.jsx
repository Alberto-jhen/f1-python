import { NavLink } from 'react-router-dom';

export const Links = ({ user }) => {
    const linkStyle = ({ isActive }) =>
        `relative inline-flex items-center px-2 py-2 text-xs uppercase tracking-widest hover:scale-102 transition-transform duration-300 transition-colors duration-300 border-b ${
            isActive
                ? 'font-semibold border-zinc-500 text-zinc-200'
                : 'font-medium border-transparent text-zinc-400 hover:text-white'
        }`;
    
    return (
        <ul className="flex flex-row gap-1 items-center lg:gap-2">
            <li>
                <NavLink to="/graphics" className={linkStyle}>
                    Gráficas
                </NavLink>
            </li>
            <li>
                <NavLink to="/drivers" className={linkStyle}>
                    Pilotos
                </NavLink>
            </li>
            <li>
                <NavLink to="/replays" className={linkStyle}>
                    Repeticiones
                </NavLink>
            </li>
            <li>
                <NavLink to="/leaderboard" className={linkStyle}>
                    Clasificación
                </NavLink>
            </li>
            <li>
                <NavLink to="/degradation-test" className={linkStyle}>
                    Degradación
                </NavLink>
            </li>
            { user && (
                <li>
                    <NavLink to="/ratings" className={linkStyle}>
                        Valoraciones
                    </NavLink>
                </li>
            )}
            
        </ul>
    );
};
