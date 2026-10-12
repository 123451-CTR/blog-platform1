import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditPost = () => {
    const { id } = useParams();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [status, setStatus] = useState('published');
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPost();
        fetchCategories();
    }, [id]);

    const fetchPost = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:5000/api/posts/id/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTitle(res.data.title);
            setContent(res.data.content);
            setExcerpt(res.data.excerpt || '');
            setCategoryId(res.data.category_id || '');
            setStatus(res.data.status);
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка загрузки поста');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/posts/${id}`, {
                title,
                content,
                excerpt,
                category_id: categoryId || null,
                status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка обновления поста');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="form-container">
            <h2>✏️ Редактировать пост</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Заголовок</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Краткое описание</label>
                    <textarea rows={2} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Содержание</label>
                    <textarea rows={12} value={content} onChange={(e) => setContent(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Категория</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">Без категории</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Статус</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="draft">Черновик</option>
                        <option value="published">Опубликовать</option>
                    </select>
                </div>
                <button type="submit" disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
            </form>
        </div>
    );
};

export default EditPost;