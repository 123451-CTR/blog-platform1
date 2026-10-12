import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FollowAuthorButton = ({ authorType, authorId, authorName, initialFollowers = 0 }) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(initialFollowers);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Не показываем кнопку для самого себя
    const isSelf = user && user.type === authorType && user.id === authorId;

    useEffect(() => {
        if (user && !isSelf) {
            checkFollowStatus();
        }
    }, [authorId, user]);

    const checkFollowStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/subscriptions/author/${authorType}/${authorId}/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFollowing(res.data.subscribed);
        } catch (error) {
            console.error('Ошибка проверки подписки:', error);
        }
    };

    const handleFollow = async () => {
        if (!user) {
            alert('Войдите, чтобы подписаться');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/subscriptions/author/${authorType}/${authorId}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setIsFollowing(res.data.subscribed);
            setFollowersCount(prev => res.data.subscribed ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Ошибка при подписке:', error);
            alert(error.response?.data?.error || 'Ошибка');
        } finally {
            setLoading(false);
        }
    };

    if (isSelf) return null;

    return (
        <button 
            onClick={handleFollow} 
            disabled={loading}
            style={{
                background: isFollowing ? 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '30px',
                color: 'white',
                fontWeight: '500',
                fontSize: '0.85rem',
                width: 'auto'
            }}
        >
            <span>{isFollowing ? '🔔' : '➕'}</span>
            <span>{isFollowing ? 'Отписаться' : 'Подписаться'}</span>
            <span style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '2px 6px', 
                borderRadius: '20px',
                fontSize: '0.7rem'
            }}>
                {followersCount}
            </span>
        </button>
    );
};

export default FollowAuthorButton;