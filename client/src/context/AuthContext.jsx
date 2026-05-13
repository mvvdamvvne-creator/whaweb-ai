import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedUser = localStorage.getItem('whaweb_user');
            const token = localStorage.getItem('whaweb_token');
            
            if (storedUser && token) {
                try {
                    // Pre-set user from storage for immediate UI response
                    setUser(JSON.parse(storedUser));
                    
                    // Fetch latest data from server to sync (profile picture, name, etc.)
                    const res = await api.get('/user/profile');
                    const latestUser = {
                        id: res.data._id,
                        username: res.data.username,
                        email: res.data.email,
                        fullName: res.data.fullName,
                        profilePicture: res.data.profilePicture
                    };
                    setUser(latestUser);
                    localStorage.setItem('whaweb_user', JSON.stringify(latestUser));
                } catch (err) {
                    console.error("Auth sync error:", err);
                    // If token is invalid (401 handled by interceptor), we'll be logged out anyway
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('whaweb_user', JSON.stringify(userData));
        localStorage.setItem('whaweb_token', token);
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('whaweb_user', JSON.stringify(updatedUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('whaweb_user');
        localStorage.removeItem('whaweb_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
