import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const MagazineLikeButton = ({ magazineId, initialLikes = 0 }) => {
    const [liked, setLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(initialLikes);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            checkLikeStatus();
        }
        fetchLikesCount();
    }, [magazineId, user]);

    const checkLikeStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/likes/magazine/${magazineId}/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLiked(res.data.liked);
        } catch (error) {
            console.error('Ошибка проверки лайка:', error);
        }
    };

    const fetchLikesCount = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/likes/magazine/${magazineId}/count`);
            setLikesCount(res.data.count);
        } catch (error) {
            console.error('Ошибка получения количества лайков:', error);
        }
    };

    const handleLike = async () => {
        if (!user) {
            alert('Войдите, чтобы поставить лайк');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/likes/magazine/${magazineId}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setLiked(res.data.liked);
            setLikesCount(prev => res.data.liked ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Ошибка при лайке:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleLike} 
            disabled={loading}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '30px',
                color: liked ? '#e53e3e' : '#718096',
                fontSize: '0.9rem',
                width: 'auto'
            }}
        >
            <span style={{ fontSize: '1.2rem' }}>{liked ? '❤️' : '🤍'}</span>
            <span>{likesCount}</span>
        </button>
    );
};

export default MagazineLikeButton;