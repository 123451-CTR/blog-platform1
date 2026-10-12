import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const SubscribeButton = ({ magazineId, initialSubscribers = 0 }) => {
    const [subscribed, setSubscribed] = useState(false);
    const [subscribersCount, setSubscribersCount] = useState(initialSubscribers);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            checkSubscriptionStatus();
        }
        fetchSubscribersCount();
    }, [magazineId, user]);

    const checkSubscriptionStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/subscriptions/magazine/${magazineId}/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubscribed(res.data.subscribed);
        } catch (error) {
            console.error('Ошибка проверки подписки:', error);
        }
    };

    const fetchSubscribersCount = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/subscriptions/magazine/${magazineId}/count`);
            setSubscribersCount(res.data.count);
        } catch (error) {
            console.error('Ошибка получения количества подписчиков:', error);
        }
    };

    const handleSubscribe = async () => {
        if (!user) {
            alert('Войдите, чтобы подписаться');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`http://localhost:5000/api/subscriptions/magazine/${magazineId}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setSubscribed(res.data.subscribed);
            setSubscribersCount(prev => res.data.subscribed ? prev + 1 : prev - 1);
        } catch (error) {
            console.error('Ошибка при подписке:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleSubscribe} 
            disabled={loading}
            style={{
                background: subscribed ? 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '30px',
                color: 'white',
                fontWeight: '600',
                width: 'auto'
            }}
        >
            <span>{subscribed ? '🔔' : '🔕'}</span>
            <span>{subscribed ? 'Отписаться' : 'Подписаться'}</span>
            <span style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '2px 8px', 
                borderRadius: '20px',
                fontSize: '0.75rem'
            }}>
                {subscribersCount}
            </span>
        </button>
    );
};

export default SubscribeButton;