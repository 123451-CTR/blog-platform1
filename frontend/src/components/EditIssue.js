import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const EditIssue = () => {
    const { id } = useParams();
    const [issue, setIssue] = useState(null);
    const [issueNumber, setIssueNumber] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [status, setStatus] = useState('published');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchIssue();
    }, [id]);

    const fetchIssue = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/magazines/issues/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIssue(res.data);
            setIssueNumber(res.data.issue_number);
            setTitle(res.data.title || '');
            setContent(res.data.content);
            setStatus(res.data.status);
        } catch (error) {
            setError('Ошибка загрузки выпуска');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/magazines/issues/${id}`, {
                issue_number: issueNumber,
                title,
                content,
                status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/magazine/${issue?.magazine_slug}`);
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="loading">Загрузка выпуска...</div>;

    return (
        <div className="form-container">
            <h2>◈ Редактировать выпуск ◈</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Номер выпуска</label>
                    <input 
                        type="number" 
                        value={issueNumber} 
                        onChange={(e) => setIssueNumber(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Название выпуска</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="Тема выпуска"
                    />
                </div>
                <div className="form-group">
                    <label>Содержание выпуска</label>
                    <textarea 
                        rows={12} 
                        value={content} 
                        onChange={(e) => setContent(e.target.value)} 
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Статус</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="published">Опубликован</option>
                        <option value="draft">Черновик</option>
                    </select>
                </div>
                <button type="submit" disabled={saving}>
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
            </form>
        </div>
    );
};

export default EditIssue;