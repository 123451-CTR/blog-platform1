import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError('Пожалуйста, заполните все поля');
            setLoading(false);
            return;
        }

        try {
            const result = await login(email, password);
            console.log('Результат входа:', result);
            
            if (result.success) {
                console.log('✅ Вход успешен, перенаправление...');
                // Небольшая задержка перед редиректом
                setTimeout(() => {
                    navigate('/');
                }, 100);
            } else {
                setError(result.error || 'Неверный email или пароль');
            }
        } catch (err) {
            console.error('Ошибка входа:', err);
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>🔐 Вход в аккаунт</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="example@mail.com"
                        autoComplete="email"
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label>Пароль</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Введите пароль"
                        autoComplete="current-password"
                        required 
                    />
                </div>
                
                <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                    <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#667eea', textDecoration: 'none' }}>
                        Забыли пароль?
                    </Link>
                </div>
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Вход...' : 'Войти'}
                </button>
            </form>
            
            <p className="form-footer">
                Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
            </p>
        </div>
    );
};

export default Login;