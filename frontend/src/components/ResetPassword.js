import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Получаем параметры из URL
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get('token');
        const emailParam = params.get('email');
        
        if (tokenParam && emailParam) {
            setToken(tokenParam);
            setEmail(decodeURIComponent(emailParam));
        } else {
            setError('Неверная ссылка для сброса пароля');
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('Пароли не совпадают');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
                email,
                token,
                new_password: password
            });
            
            setMessage(res.data.message);
            
            setTimeout(() => {
                navigate('/login');
            }, 3000);
            
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка сброса пароля');
        } finally {
            setLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="form-container">
                <h2>🔐 Сброс пароля</h2>
                <div className="alert alert-error">Неверная ссылка для сброса пароля</div>
                <Link to="/forgot-password" className="read-more">Запросить новую ссылку →</Link>
            </div>
        );
    }

    return (
        <div className="form-container">
            <h2>🔐 Создание нового пароля</h2>
            <p style={{ marginBottom: '20px', color: '#718096', textAlign: 'center' }}>
                Введите новый пароль для аккаунта <strong>{email}</strong>
            </p>
            
            {error && <div className="alert alert-error">{error}</div>}
            {message && <div className="alert alert-success">{message}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Новый пароль</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Не менее 6 символов"
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Подтверждение пароля</label>
                    <input 
                        type="password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder="Повторите пароль"
                        required 
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
                </button>
            </form>
            
            <p className="form-footer">
                <Link to="/login">← Вернуться ко входу</Link>
            </p>
        </div>
    );
};

export default ResetPassword;