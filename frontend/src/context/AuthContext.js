import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const API_URL = 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Проверяем токен при загрузке
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            console.log('🔍 Запрос данных пользователя...');
            const res = await axios.get(`${API_URL}/auth/me`);
            console.log('✅ Данные пользователя получены:', res.data);
            setUser(res.data);
        } catch (error) {
            console.error('❌ Ошибка получения пользователя:', error.response?.data || error.message);
            // Если ошибка - удаляем токен
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setError('');
        try {
            console.log('🔐 Попытка входа:', email);
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            console.log('✅ Ответ сервера:', res.data);
            
            const { token, user } = res.data;
            
            // Сохраняем токен
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(user);
            return { success: true, user };
        } catch (error) {
            console.error('❌ Ошибка входа:', error.response?.data);
            setError(error.response?.data?.error || 'Ошибка входа');
            return { success: false, error: error.response?.data?.error };
        }
    };

    const register = async (username, email, password) => {
        setError('');
        try {
            console.log('📝 Попытка регистрации:', email);
            const res = await axios.post(`${API_URL}/auth/register`, { username, email, password });
            console.log('✅ Ответ сервера:', res.data);
            
            const { token, user } = res.data;
            
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            setUser(user);
            return { success: true, user };
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error.response?.data);
            setError(error.response?.data?.error || 'Ошибка регистрации');
            return { success: false, error: error.response?.data?.error };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        console.log('👋 Выход выполнен');
    };

    const isAdmin = user?.type === 'admin' || user?.role === 'admin' || user?.role === 'super_admin';

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            register, 
            logout, 
            loading,
            error,
            isAdmin
        }}>
            {children}
        </AuthContext.Provider>
    );
};