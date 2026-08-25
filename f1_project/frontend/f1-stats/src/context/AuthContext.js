import { createContext, useContext } from 'react';

export const AuthContext = createContext({ user: null, loading: true });

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return { ...context, isLoggedIn: !!context.user };
}
