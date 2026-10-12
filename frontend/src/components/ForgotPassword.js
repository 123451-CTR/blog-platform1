import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setMessage(res.data.message);
            
            // Показываем ссылку в консоли 
            if (res.data.debug_link) {
                console.log('🔗 Ссылка для сброса:', res.data.debug_link);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка отправки запроса');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>🔐 Восстановление пароля</h2>
            <p style={{ marginBottom: '20px', color: '#718096', textAlign: 'center' }}>
                Введите ваш email, и мы отправим ссылку для сброса пароля
            </p>
            
            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="example@mail.com"
                        required 
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Отправка...' : 'Отправить ссылку для сброса'}
                </button>
            </form>
            
            <p className="form-footer">
                <Link to="/login">← Вернуться ко входу</Link>
            </p>
            
            <div className="admin-code-info" style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: '#718096', textAlign: 'center' }}>
                    ссылка для сброса выводится в <strong>консоль терминала</strong> (где запущен бэкенд)
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;