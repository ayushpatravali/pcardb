import { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate user on load
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const username = localStorage.getItem('username'); // Optional, if you saved it

        if (token && role) {
            setUser({ token, role, username });
        }
        setLoading(false);
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
