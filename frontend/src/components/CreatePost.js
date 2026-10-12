import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';

const CreatePost = () => {
    const [заголовок, setЗаголовок] = useState('');
    const [содержание, setСодержание] = useState('');
    const [краткоеОписание, setКраткоеОписание] = useState('');
    const [категорияId, setКатегорияId] = useState('');
    const [статус, setСтатус] = useState('published');
    const [категории, setКатегории] = useState([]);
    const [ошибка, setОшибка] = useState('');
    const [загрузка, setЗагрузка] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        загрузитьКатегории();
    }, []);

    const загрузитьКатегории = async () => {
        try {
            const res = await axios.get(`${API_URL}/categories`);
            setКатегории(res.data);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    };

    const обработатьОтправку = async (e) => {
        e.preventDefault();
        setОшибка('');
        setЗагрузка(true);

        if (!заголовок || !содержание) {
            setОшибка('Заголовок и содержание обязательны');
            setЗагрузка(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/posts`, {
                title: заголовок,
                content: содержание,
                excerpt: краткоеОписание,
                category_id: категорияId || null,
                status: статус
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/');
        } catch (error) {
            setОшибка(error.response?.data?.error || 'Ошибка создания поста');
        } finally {
            setЗагрузка(false);
        }
    };

    return (
        <div className="form-container">
            <h2>📝 Создать новый пост</h2>
            {ошибка && <div className="alert alert-error">{ошибка}</div>}
            <form onSubmit={обработатьОтправку}>
                <div className="form-group">
                    <label>Заголовок *</label>
                    <input 
                        type="text" 
                        value={заголовок} 
                        onChange={(e) => setЗаголовок(e.target.value)} 
                        placeholder="Введите заголовок..."
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Краткое описание</label>
                    <textarea 
                        rows={2} 
                        value={краткоеОписание} 
                        onChange={(e) => setКраткоеОписание(e.target.value)} 
                        placeholder="Краткий анонс поста (отображается на главной)"
                    />
                </div>
                <div className="form-group">
                    <label>Содержание *</label>
                    <textarea 
                        rows={10} 
                        value={содержание} 
                        onChange={(e) => setСодержание(e.target.value)} 
                        placeholder="Текст вашей статьи..."
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Категория</label>
                    <select value={категорияId} onChange={(e) => setКатегорияId(e.target.value)}>
                        <option value="">Без категории</option>
                        {категории.map(кат => (
                            <option key={кат.id} value={кат.id}>{кат.icon || '📁'} {кат.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Статус</label>
                    <select value={статус} onChange={(e) => setСтатус(e.target.value)}>
                        <option value="draft">📝 Черновик</option>
                        <option value="published">✅ Опубликовать</option>
                    </select>
                </div>
                <button type="submit" disabled={загрузка}>
                    {загрузка ? 'Публикация...' : '📤 Опубликовать'}
                </button>
            </form>
        </div>
    );
};

export default CreatePost;