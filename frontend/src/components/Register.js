import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [userType, setUserType] = useState('user'); // 'user' или 'admin'
    const [adminCode, setAdminCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Валидация
        if (!username || !email || !password) {
            setError('Пожалуйста, заполните все поля');
            setLoading(false);
            return;
        }

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

        if (userType === 'admin' && !adminCode) {
            setError('Для регистрации администратора введите секретный код');
            setLoading(false);
            return;
        }

        try {
            let response;
            
            if (userType === 'admin') {
                // Регистрация администратора
                console.log('👑 Регистрация администратора...');
                response = await axios.post('http://localhost:5000/api/auth/register-admin', {
                    username,
                    email,
                    password,
                    full_name: username,
                    adminCode: adminCode
                });
            } else {
                // Регистрация обычного пользователя
                console.log('📝 Регистрация пользователя...');
                response = await axios.post('http://localhost:5000/api/auth/register', {
                    username,
                    email,
                    password,
                    role: 'user'
                });
            }

            console.log('✅ Ответ сервера:', response.data);
            
            const { token, user } = response.data;
            
            // Сохраняем токен
            localStorage.setItem('token', token);
            
            setSuccess('Регистрация успешна! Перенаправление...');
            
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
            
        } catch (err) {
            console.error('❌ Ошибка регистрации:', err.response?.data);
            setError(err.response?.data?.error || 'Ошибка регистрации');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>📝 Регистрация</h2>
            
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Имя пользователя</label>
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="Введите имя пользователя"
                        required 
                    />
                </div>
                
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
                
                <div className="form-group">
                    <label>Пароль</label>
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
                
                <div className="form-group">
                    <label>Тип аккаунта</label>
                    <select 
                        value={userType} 
                        onChange={(e) => setUserType(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    >
                        <option value="user">📝 Обычный пользователь</option>
                        <option value="admin">👑 Администратор</option>
                    </select>
                </div>
                
                {userType === 'admin' && (
                    <div className="form-group">
                        <label>Секретный код администратора</label>
                        <input 
                            type="password" 
                            value={adminCode} 
                            onChange={(e) => setAdminCode(e.target.value)} 
                            placeholder="Введите секретный код"
                            required
                        />
                        <small style={{ display: 'block', marginTop: '5px', color: '#718096' }}>
                            Код для регистрации администратора: <strong>ADMIN2026</strong>
                        </small>
                    </div>
                )}
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
            </form>
            
            <p className="form-footer">
                Уже есть аккаунт? <Link to="/login">Войти</Link>
            </p>
        </div>
    );
};

export default Register;