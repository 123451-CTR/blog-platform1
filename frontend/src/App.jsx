import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import BlogList from './components/BlogList';
import BlogPost from './components/BlogPost';
import MagazineList from './components/MagazineList';
import MagazineDetail from './components/MagazineDetail';
import CreateMagazine from './components/CreateMagazine';
import CreatePost from './components/CreatePost';
import EditPost from './components/EditPost';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/Profile';
import PrivateRoute from './components/PrivateRoute';
import StarRailBackground from './components/StarRailBackground';

import './App.css';

function App() {
    // Эффект звёзд при клике
    useEffect(() => {
        const createStar = (x, y) => {
            const star = document.createElement('div');
            star.innerHTML = ['✨', '⭐', '🌟', '💫', '⭐', '✨'][Math.floor(Math.random() * 6)];
            star.style.position = 'fixed';
            star.style.left = x + 'px';
            star.style.top = y + 'px';
            star.style.fontSize = (Math.random() * 20 + 15) + 'px';
            star.style.pointerEvents = 'none';
            star.style.zIndex = '9999';
            star.style.opacity = '1';
            star.style.transition = 'all 0.6s ease-out';
            star.style.transform = 'translate(-50%, -50%)';
            document.body.appendChild(star);
            
            // Анимация звезды
            setTimeout(() => {
                star.style.opacity = '0';
                star.style.transform = `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 80}px) scale(1.5)`;
            }, 10);
            
            // Удаляем звезду
            setTimeout(() => {
                star.remove();
            }, 600);
        };
        
        const handleClick = (e) => {
            // Создаём несколько звёзд при клике
            for (let i = 0; i < 5 + Math.random() * 10; i++) {
                setTimeout(() => {
                    const offsetX = (Math.random() - 0.5) * 60;
                    const offsetY = (Math.random() - 0.5) * 60;
                    createStar(e.clientX + offsetX, e.clientY + offsetY);
                }, i * 30);
            }
        };
        
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    return (
        <AuthProvider>
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<BlogList />} />
                        <Route path="/magazines" element={<MagazineList />} />
                        <Route path="/magazine/:slug" element={<MagazineDetail />} />
                        <Route path="/post/:slug" element={<BlogPost />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/create-post" element={<PrivateRoute><CreatePost /></PrivateRoute>} />
                        <Route path="/create-magazine" element={<PrivateRoute><CreateMagazine /></PrivateRoute>} />
                        <Route path="/edit-post/:id" element={<PrivateRoute><EditPost /></PrivateRoute>} />
                        <Route path="/admin" element={<PrivateRoute adminOnly={true}><AdminPanel /></PrivateRoute>} />
                    </Routes>
                </Layout>
                <StarRailBackground />
            </Router>
        </AuthProvider>
    );
}

export default App;