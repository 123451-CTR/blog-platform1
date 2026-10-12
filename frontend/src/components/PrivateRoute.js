import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="loading">Загрузка...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (adminOnly) {
        const isAdmin = user.type === 'admin' || user.role === 'admin' || user.role === 'super_admin';
        if (!isAdmin) {
            return <Navigate to="/" />;
        }
    }

    return children;
};

export default PrivateRoute;