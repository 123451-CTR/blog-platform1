import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateMagazine = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage] = useState('');
    const [status, setStatus] = useState('published');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [issueNumber, setIssueNumber] = useState('');
    const [issueTitle, setIssueTitle] = useState('');
    const [issueContent, setIssueContent] = useState('');
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [createdMagazineId, setCreatedMagazineId] = useState(null);
    
    const navigate = useNavigate();

    const handleCreateMagazine = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/magazines', {
                title,
                description,
                cover_image: coverImage,
                status
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setCreatedMagazineId(res.data.id);
            setShowIssueForm(true);
            setLoading(false);
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка создания журнала');
            setLoading(false);
        }
    };

    const handleAddIssue = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/magazines/${createdMagazineId}/issues`, {
                issue_number: parseInt(issueNumber),
                title: issueTitle,
                content: issueContent,
                status: 'published'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            navigate(`/magazine/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
                        navigate(`/magazine/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`);
        } catch (error) {
            setError(error.response?.data?.error || 'Ошибка добавления выпуска');
            setLoading(false);
        }
    };

    if (showIssueForm) {
        return (
            <div className="form-container">
                <h2>📖 Добавить первый выпуск</h2>
                <p style={{ marginBottom: '20px', color: '#4a5568' }}>
                    Журнал "{title}" создан! Теперь добавьте первый выпуск.
                </p>
                {error && <div className="alert alert-error">{error}</div>}
                <form onSubmit={handleAddIssue}>
                    <div className="form-group">
                        <label>Номер выпуска *</label>
                        <input 
                            type="number" 
                            value={issueNumber} 
                            onChange={(e) => setIssueNumber(e.target.value)} 
                            placeholder="1"
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label>Название выпуска (опционально)</label>
                        <input 
                            type="text" 
                            value={issueTitle} 
                            onChange={(e) => setIssueTitle(e.target.value)} 
                            placeholder="Тема выпуска"
                        />
                    </div>
                    <div className="form-group">
                        <label>Содержание выпуска *</label>
                        <textarea 
                            rows={10} 
                            value={issueContent} 
                            onChange={(e) => setIssueContent(e.target.value)} 
                            placeholder="Введите содержание выпуска..."
                            required 
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Добавление...' : 'Опубликовать выпуск'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="form-container">
            <h2>📖 Создать онлайн-журнал</h2>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateMagazine}>
                <div className="form-group">
                    <label>Название журнала *</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="Введите название"
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Описание</label>
                    <textarea 
                        rows={3} 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="Краткое описание журнала"
                    />
                </div>
                <div className="form-group">
                    <label>URL обложки (опционально)</label>
                    <input 
                        type="text" 
                        value={coverImage} 
                        onChange={(e) => setCoverImage(e.target.value)} 
                        placeholder="https://example.com/cover.jpg"
                    />
                </div>
                <div className="form-group">
                    <label>Статус</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="published">Опубликовать сразу</option>
                        <option value="draft">Сохранить как черновик</option>
                    </select>
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Создание...' : 'Создать журнал'}
                </button>
            </form>
        </div>
    );
};

export default CreateMagazine;