import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="container">
                <Link to="/" className="logo">✨ Звёздный Экспресс ✨</Link>
                <div className="nav-links">
                    <Link to="/">📝 Блоги</Link>
                    <Link to="/magazines">📰 Журналы</Link>
                    
                    {user ? (
                        <>
                            <Link to="/create-post">✏️ Новый пост</Link>
                            <Link to="/create-magazine">📖 Создать журнал</Link>
                            
                            {isAdmin && (
                                <Link to="/admin">⚙️ Админ панель</Link>
                            )}
                            
                            <Link to="/profile">👤 Мой профиль</Link>
                            <span>👋 {user.username || user.email}</span>
                            <button onClick={handleLogout}>🚪 Выйти</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">🔐 Вход</Link>
                            <Link to="/register">📝 Регистрация</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;