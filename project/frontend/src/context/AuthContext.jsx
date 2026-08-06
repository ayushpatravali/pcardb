import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate user on load. A token string in localStorage can be hours
        // dead while the UI looks logged in (the application form makes no
        // API call until Save), so verify it with the server before trusting
        // it — a dead session must bounce to login BEFORE the operator types.
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username'); // Optional, if you saved it

        if (!token || !role) {
            setLoading(false);
            return;
        }

        api.get('/users/me')
            .then(() => setUser({ token, role, username }))
            .catch((err) => {
                if (err?.response?.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('username');
                } else {
                    // Server unreachable — keep the session rather than
                    // logging the operator out over a network blip.
                    setUser({ token, role, username });
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const login = (userData) => {
        // userData expected: { token, role, username? }
        localStorage.setItem('token', userData.token);
        localStorage.setItem('role', userData.role);
        if (userData.username) localStorage.setItem('username', userData.username);

        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
