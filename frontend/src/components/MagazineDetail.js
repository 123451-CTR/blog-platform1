import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';


const API_URL = 'http://localhost:5000/api';

const MagazineDetail = () => {
    const { slug } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [magazine, setMagazine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddIssue, setShowAddIssue] = useState(false);
    const [newIssue, setNewIssue] = useState({ issue_number: '', title: '', content: '' });

    useEffect(() => {
        fetchMagazine();
    }, [slug]);

    const fetchMagazine = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/magazines/${slug}`);
            setMagazine(res.data);
        } catch (error) {
            console.error('Ошибка загрузки журнала:', error);
            setError('Журнал не найден');
        } finally {
            setLoading(false);
        }
    };

    const handleAddIssue = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/magazines/${magazine.id}/issues`, newIssue, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setShowAddIssue(false);
            setNewIssue({ issue_number: '', title: '', content: '' });
            fetchMagazine();
        } catch (error) {
            console.error('Ошибка добавления выпуска:', error);
            alert('Ошибка добавления выпуска');
        }
    };

    const handleDeleteIssue = async (issueId) => {
        if (window.confirm('Удалить этот выпуск?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/magazines/issues/${issueId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchMagazine();
            } catch (error) {
                console.error('Ошибка удаления:', error);
                alert('Ошибка удаления');
            }
        }
    };

    const canEdit = user && (user.id === magazine?.editor_id || user.type === 'admin');

    if (loading) return <div className="loading">🚀 Загрузка журнала...</div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    return (
        <div>
            <div className="post-content">
                <h1>🌍 {magazine.title} 🌍</h1>
                <div className="post-meta">
                    <span>🚀 Редактор: {magazine.editor_name}</span>
                    <span>📅 Создан: {new Date(magazine.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                {magazine.description && <p>{magazine.description}</p>}
                
                {canEdit && (
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <button onClick={() => setShowAddIssue(true)} style={{ width: 'auto' }}>
                            ✨ Добавить выпуск ✨
                        </button>
                    </div>
                )}
                
                <h2>📚 Выпуски журнала</h2>
                
                {showAddIssue && (
                    <div className="issue-card" style={{ marginBottom: '24px' }}>
                        <h3>Добавить новый выпуск</h3>
                        <form onSubmit={handleAddIssue}>
                            <div className="form-group">
                                <label>Номер выпуска</label>
                                <input 
                                    type="number" 
                                    required 
                                    value={newIssue.issue_number} 
                                    onChange={(e) => setNewIssue({...newIssue, issue_number: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Название</label>
                                <input 
                                    type="text" 
                                    value={newIssue.title} 
                                    onChange={(e) => setNewIssue({...newIssue, title: e.target.value})} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Содержание</label>
                                <textarea 
                                    rows={6} 
                                    required 
                                    value={newIssue.content} 
                                    onChange={(e) => setNewIssue({...newIssue, content: e.target.value})} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="submit">Опубликовать</button>
                                <button type="button" onClick={() => setShowAddIssue(false)} style={{ background: '#555' }}>Отмена</button>
                            </div>
                        </form>
                    </div>
                )}
                
                {magazine.issues?.length === 0 ? (
                    <p>Пока нет выпусков...</p>
                ) : (
                    magazine.issues.map(issue => (
                        <div key={issue.id} className="issue-card">
                            <div className="issue-number">Выпуск №{issue.issue_number}</div>
                            <h3>{issue.title || `Выпуск №${issue.issue_number}`}</h3>
                            <div className="post-meta">📅 {new Date(issue.created_at).toLocaleDateString('ru-RU')}</div>
                            <div dangerouslySetInnerHTML={{ __html: issue.content.replace(/\n/g, '<br/>') }} />
                            {canEdit && (
                                <div className="issue-actions">
                                    <Link to={`/edit-issue/${issue.id}`}>
                                        <button style={{ width: 'auto' }}>✏️ Редактировать</button>
                                    </Link>
                                    <button 
                                        onClick={() => handleDeleteIssue(issue.id)} 
                                        style={{ width: 'auto', background: '#ff3366' }}
                                    >
                                        🗑️ Удалить
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
                
                <Link to="/magazines" className="read-more" style={{ display: 'inline-block', marginTop: '32px' }}>
                    ← Вернуться к журналам
                </Link>
            </div>
        </div>
    );
};

export default MagazineDetail;