import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [posts, setPosts] = useState([]);
    const [magazines, setMagazines] = useState([]);
    const [categories, setCategories] = useState([]);
    const [comments, setComments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '📁', color: '#6b8cae' });
    const [editingCategory, setEditingCategory] = useState(null);

    const api = axios.create({
        baseURL: `${API_URL}/admin`,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'dashboard') {
                const res = await api.get('/stats');
                setStats(res.data);
            } else if (activeTab === 'users') {
                const res = await api.get('/users');
                setUsers(res.data);
            } else if (activeTab === 'posts') {
                const res = await api.get('/posts');
                setPosts(res.data);
            } else if (activeTab === 'magazines') {
                const res = await api.get('/magazines');
                setMagazines(res.data);
            } else if (activeTab === 'categories') {
                const res = await api.get('/categories');
                setCategories(res.data);
            } else if (activeTab === 'comments') {
                const res = await api.get('/comments');
                setComments(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    // ПОЛЬЗОВАТЕЛИ 
    const toggleUserBlock = async (userId, currentStatus) => {
        try {
            await api.put(`/users/${userId}/toggle-approve`);
            setSuccess(currentStatus ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка');
            setTimeout(() => setError(''), 3000);
        }
    };

    const deleteUser = async (userId, userName) => {
        if (window.confirm(`Удалить пользователя "${userName}"? Все его посты будут перенесены на администратора.`)) {
            try {
                await api.delete(`/users/${userId}`);
                setSuccess('Пользователь удалён');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка удаления');
            }
        }
    };

    // ПОСТЫ
    const deletePost = async (postId, postTitle) => {
        if (window.confirm(`Удалить пост "${postTitle}"?`)) {
            try {
                await api.delete(`/posts/${postId}`);
                setSuccess('Пост удалён');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка');
            }
        }
    };

    const updatePostStatus = async (postId, status) => {
        try {
            await api.put(`/posts/${postId}`, { status });
            setSuccess(`Статус изменён на ${status === 'published' ? 'опубликован' : status === 'draft' ? 'черновик' : 'архив'}`);
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка');
        }
    };

    // ЖУРНАЛЫ 
    const updateMagazineStatus = async (magazineId, status) => {
        try {
            await api.put(`/magazines/${magazineId}`, { status });
            setSuccess(`Статус журнала изменён на ${status === 'published' ? 'опубликован' : status === 'draft' ? 'черновик' : 'архив'}`);
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка');
        }
    };

    const deleteMagazine = async (magazineId, magazineTitle) => {
        if (window.confirm(`Удалить журнал "${magazineTitle}"? Все выпуски также будут удалены.`)) {
            try {
                await api.delete(`/magazines/${magazineId}`);
                setSuccess('Журнал удалён');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка');
            }
        }
    };

    const deleteIssue = async (issueId, issueNumber) => {
        if (window.confirm(`Удалить выпуск №${issueNumber}?`)) {
            try {
                await api.delete(`/magazines/issues/${issueId}`);
                setSuccess('Выпуск удалён');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка');
            }
        }
    };

    //  КАТЕГОРИИ 
    const createCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.name) return;
        try {
            await api.post('/categories', newCategory);
            setSuccess('Категория создана');
            setNewCategory({ name: '', description: '', icon: '📁', color: '#6b8cae' });
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка');
        }
    };

    const updateCategory = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/categories/${editingCategory.id}`, editingCategory);
            setSuccess('Категория обновлена');
            setEditingCategory(null);
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка');
        }
    };

    const deleteCategory = async (categoryId, categoryName) => {
        if (window.confirm(`Удалить категорию "${categoryName}"? Посты в ней останутся без категории.`)) {
            try {
                await api.delete(`/categories/${categoryId}`);
                setSuccess('Категория удалена');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка');
            }
        }
    };

    //  КОММЕНТАРИИ 
    const updateCommentStatus = async (commentId, status) => {
        try {
            await api.put(`/comments/${commentId}/status`, { status });
            setSuccess('Статус комментария обновлён');
            fetchData();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка');
        }
    };

    const deleteComment = async (commentId) => {
        if (window.confirm('Удалить комментарий?')) {
            try {
                await api.delete(`/comments/${commentId}`);
                setSuccess('Комментарий удалён');
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                setError(err.response?.data?.error || 'Ошибка');
            }
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            published: { background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', text: 'Опубликован' },
            draft: { background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', text: 'Черновик' },
            archived: { background: 'rgba(107, 114, 128, 0.2)', color: '#cbd5e1', text: 'Архив' },
            pending: { background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', text: 'На модерации' },
            approved: { background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', text: 'Одобрен' },
            spam: { background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', text: 'Спам' }
        };
        const s = styles[status] || styles.draft;
        return <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', background: s.background, color: s.color }}>{s.text}</span>;
    };

    return (
        <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '24px', color: '#e0e0e0' }}>⚙️ Панель управления</h1>
            {error && <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>{error}</div>}
            {success && <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>{success}</div>}

            {/* Вкладки */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                paddingBottom: '12px'
            }}>
                {[
                    { id: 'dashboard', name: '📊 Статистика' },
                    { id: 'users', name: '👥 Пользователи' },
                    { id: 'posts', name: '📝 Блоги' },
                    { id: 'magazines', name: '📰 Журналы' },
                    { id: 'categories', name: '🏷️ Категории' },
                    { id: 'comments', name: '💬 Комментарии' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
                            color: activeTab === tab.id ? '#aaccff' : '#9ca3af',
                            padding: '8px 20px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            width: 'auto',
                            border: activeTab === tab.id ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
                            fontWeight: '500',
                            fontSize: '0.9rem'
                        }}
                    >
                        {tab.name}
                    </button>
                ))}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Загрузка...</div>}

            {/* СТАТИСТИКА */}
            {activeTab === 'dashboard' && !loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(30, 30, 50, 0.6)', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#aaccff' }}>{stats.users || 0}</div>
                        <div style={{ color: '#99aacc' }}>Пользователей</div>
                    </div>
                    <div style={{ background: 'rgba(30, 30, 50, 0.6)', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#aaccff' }}>{stats.admins || 0}</div>
                        <div style={{ color: '#99aacc' }}>Администраторов</div>
                    </div>
                    <div style={{ background: 'rgba(30, 30, 50, 0.6)', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#aaccff' }}>{stats.totalPosts || 0}</div>
                        <div style={{ color: '#99aacc' }}>Всего постов</div>
                    </div>
                    <div style={{ background: 'rgba(30, 30, 50, 0.6)', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#aaccff' }}>{stats.publishedPosts || 0}</div>
                        <div style={{ color: '#99aacc' }}>Опубликовано</div>
                    </div>
                    <div style={{ background: 'rgba(30, 30, 50, 0.6)', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#aaccff' }}>{stats.totalMagazines || 0}</div>
                        <div style={{ color: '#99aacc' }}>Журналов</div>
                    </div>
                    <div style={{ background: 'rgba(30, 30, 50, 0.6)', backdropFilter: 'blur(8px)', padding: '16px', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#aaccff' }}>{stats.totalComments || 0}</div>
                        <div style={{ color: '#99aacc' }}>Комментариев</div>
                    </div>
                </div>
            )}

            {/* ПОЛЬЗОВАТЕЛИ */}
            {activeTab === 'users' && !loading && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(20, 20, 40, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '16px', overflow: 'hidden' }}>
                        <thead style={{ background: 'rgba(30, 30, 50, 0.8)' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#aaccff' }}>ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#aaccff' }}>Имя</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#aaccff' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#aaccff' }}>Роль</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#aaccff' }}>Статус</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#aaccff' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid rgba(100, 150, 255, 0.1)' }}>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{user.id}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{user.username}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{user.email}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{user.role === 'admin' ? '👑 Админ' : '👤 Пользователь'}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{user.is_approved ? '✅ Активен' : '❌ Заблокирован'}</td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => toggleUserBlock(user.id, user.is_approved)} style={{ background: user.is_approved ? 'rgba(57, 57, 218, 0.6)' : 'rgba(16, 185, 129, 0.6)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', marginRight: '8px', cursor: 'pointer' }}>
                                            {user.is_approved ? 'Заблокировать' : 'Разблокировать'}
                                        </button>
                                        <button onClick={() => deleteUser(user.id, user.username)} style={{ background: 'rgba(239, 68, 68, 0.6)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* БЛОГИ */}
            {activeTab === 'posts' && !loading && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(20, 20, 40, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '16px', overflow: 'hidden' }}>
                        <thead style={{ background: 'rgba(30, 30, 50, 0.8)' }}>
                            <tr>
                                <th style={{ padding: '12px', color: '#aaccff' }}>ID</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Заголовок</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Автор</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Статус</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map(post => (
                                <tr key={post.id} style={{ borderBottom: '1px solid rgba(100, 150, 255, 0.1)' }}>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{post.id}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{post.title}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{post.author_name}</td>
                                    <td style={{ padding: '12px' }}>{getStatusBadge(post.status)}</td>
                                    <td style={{ padding: '12px' }}>
                                        <select onChange={(e) => updatePostStatus(post.id, e.target.value)} value={post.status} style={{ padding: '6px 12px', borderRadius: '20px', marginRight: '8px', background: 'rgba(20, 20, 40, 0.8)', color: '#cbd5e1', border: '1px solid rgba(100, 150, 255, 0.3)' }}>
                                            <option value="published">Опубликован</option>
                                            <option value="draft">Черновик</option>
                                            <option value="archived">Архив</option>
                                        </select>
                                        <button onClick={() => deletePost(post.id, post.title)} style={{ background: 'rgba(239, 68, 68, 0.6)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ЖУРНАЛЫ */}
            {activeTab === 'magazines' && !loading && (
                <div>
                    {magazines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(20, 20, 40, 0.6)', borderRadius: '16px', color: '#9ca3af' }}>📭 Журналов пока нет</div>
                    ) : (
                        magazines.map(mag => (
                            <div key={mag.id} style={{ background: 'rgba(20, 20, 40, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '16px', padding: '20px', marginBottom: '16px', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '8px', color: '#aaccff' }}>📰 {mag.title}</h3>
                                        <div style={{ fontSize: '0.85rem', color: '#99aacc' }}>👨‍💼 Редактор: {mag.editor_name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#99aacc' }}>📚 Выпусков: {mag.issues_count || 0}</div>
                                        {mag.description && <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>{mag.description}</p>}
                                    </div>
                                    <div>
                                        <select onChange={(e) => updateMagazineStatus(mag.id, e.target.value)} value={mag.status} style={{ padding: '6px 12px', borderRadius: '20px', marginRight: '8px', background: 'rgba(20, 20, 40, 0.8)', color: '#cbd5e1', border: '1px solid rgba(100, 150, 255, 0.3)' }}>
                                            <option value="published">✅ Опубликован</option>
                                            <option value="draft">📝 Черновик</option>
                                            <option value="archived">📦 Архив</option>
                                        </select>
                                        <button onClick={() => deleteMagazine(mag.id, mag.title)} style={{ background: 'rgba(239, 68, 68, 0.6)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer' }}>
                                            🗑️ Удалить журнал
                                        </button>
                                    </div>
                                </div>
                                {mag.issues && mag.issues.length > 0 && (
                                    <details style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(100, 150, 255, 0.15)' }}>
                                        <summary style={{ cursor: 'pointer', color: '#aaccff' }}>📖 Выпуски ({mag.issues.length})</summary>
                                        {mag.issues.map(issue => (
                                            <div key={issue.id} style={{ background: 'rgba(30, 30, 50, 0.4)', padding: '12px', borderRadius: '12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#cbd5e1' }}>Выпуск №{issue.issue_number}: {issue.title || 'без названия'}</span>
                                                <button onClick={() => deleteIssue(issue.id, issue.issue_number)} style={{ background: 'rgba(239, 68, 68, 0.5)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer' }}>
                                                    Удалить выпуск
                                                </button>
                                            </div>
                                        ))}
                                    </details>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* КАТЕГОРИИ */}
            {activeTab === 'categories' && !loading && (
                <div>
                    <form onSubmit={createCategory} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', background: 'rgba(20, 20, 40, 0.6)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(100, 150, 255, 0.2)' }}>
                        <input placeholder="Название" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} style={{ flex: 2, padding: '10px', borderRadius: '12px', background: 'rgba(10, 10, 26, 0.8)', color: 'white', border: '1px solid rgba(100, 150, 255, 0.3)' }} required />
                        <input placeholder="Иконка" value={newCategory.icon} onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'rgba(10, 10, 26, 0.8)', color: 'white', border: '1px solid rgba(100, 150, 255, 0.3)' }} />
                        <input type="color" value={newCategory.color} onChange={(e) => setNewCategory({...newCategory, color: e.target.value})} style={{ width: '60px', height: '42px', borderRadius: '8px', background: 'rgba(10, 10, 26, 0.8)' }} />
                        <input placeholder="Описание" value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} style={{ flex: 3, padding: '10px', borderRadius: '12px', background: 'rgba(10, 10, 26, 0.8)', color: 'white', border: '1px solid rgba(100, 150, 255, 0.3)' }} />
                        <button type="submit" style={{ background: 'rgba(59, 130, 246, 0.6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '24px', cursor: 'pointer' }}>➕ Создать</button>
                    </form>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {categories.map(cat => (
                            <div key={cat.id} style={{ background: 'rgba(20, 20, 40, 0.6)', padding: '16px', borderRadius: '16px', borderLeft: `4px solid ${cat.color || '#6b8cae'}`, border: `1px solid rgba(100, 150, 255, 0.2)` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div><span style={{ fontSize: '1.5rem' }}>{cat.icon || '📁'}</span> <strong style={{ color: '#aaccff' }}>{cat.name}</strong></div>
                                    <div>
                                        <button onClick={() => setEditingCategory(cat)} style={{ background: 'rgba(59, 130, 246, 0.5)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '16px', marginRight: '8px', cursor: 'pointer' }}>✏️</button>
                                        <button onClick={() => deleteCategory(cat.id, cat.name)} style={{ background: 'rgba(239, 68, 68, 0.5)', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '16px', cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#99aacc' }}>slug: {cat.slug}</div>
                                {cat.description && <p style={{ marginTop: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>{cat.description}</p>}
                                <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#99aacc' }}>📝 Постов: {cat.posts_count || 0}</div>
                            </div>
                        ))}
                    </div>

                    {editingCategory && (
                        <div style={{ marginTop: '24px', background: 'rgba(20, 20, 40, 0.8)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(100, 150, 255, 0.3)' }}>
                            <h3 style={{ marginBottom: '12px', color: '#aaccff' }}>✏️ Редактировать категорию</h3>
                            <form onSubmit={updateCategory} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <input value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} style={{ flex: 2, padding: '8px', borderRadius: '12px', background: 'rgba(10, 10, 26, 0.8)', color: 'white', border: '1px solid rgba(100, 150, 255, 0.3)' }} required />
                                <input value={editingCategory.icon} onChange={(e) => setEditingCategory({...editingCategory, icon: e.target.value})} style={{ flex: 1, padding: '8px', borderRadius: '12px', background: 'rgba(10, 10, 26, 0.8)', color: 'white', border: '1px solid rgba(100, 150, 255, 0.3)' }} />
                                <input type="color" value={editingCategory.color} onChange={(e) => setEditingCategory({...editingCategory, color: e.target.value})} style={{ width: '50px', height: '38px', borderRadius: '8px' }} />
                                <input value={editingCategory.description || ''} onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})} style={{ flex: 3, padding: '8px', borderRadius: '12px', background: 'rgba(10, 10, 26, 0.8)', color: 'white', border: '1px solid rgba(100, 150, 255, 0.3)' }} />
                                <button type="submit" style={{ background: 'rgba(16, 185, 129, 0.6)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '24px', cursor: 'pointer' }}>Сохранить</button>
                                <button type="button" onClick={() => setEditingCategory(null)} style={{ background: 'rgba(107, 114, 128, 0.6)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '24px', cursor: 'pointer' }}>Отмена</button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* КОММЕНТАРИИ */}
            {activeTab === 'comments' && !loading && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(20, 20, 40, 0.6)', backdropFilter: 'blur(8px)', borderRadius: '16px', overflow: 'hidden' }}>
                        <thead style={{ background: 'rgba(30, 30, 50, 0.8)' }}>
                            <tr>
                                <th style={{ padding: '12px', color: '#aaccff' }}>ID</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Автор</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Текст</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Статус</th>
                                <th style={{ padding: '12px', color: '#aaccff' }}>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comments.map(comment => (
                                <tr key={comment.id} style={{ borderBottom: '1px solid rgba(100, 150, 255, 0.1)' }}>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{comment.id}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{comment.author_name}</td>
                                    <td style={{ padding: '12px', color: '#cbd5e1' }}>{comment.content?.substring(0, 100)}...</td>
                                    <td style={{ padding: '12px' }}>{getStatusBadge(comment.status)}</td>
                                    <td style={{ padding: '12px' }}>
                                        <select onChange={(e) => updateCommentStatus(comment.id, e.target.value)} value={comment.status} style={{ padding: '6px 12px', borderRadius: '20px', marginRight: '8px', background: 'rgba(20, 20, 40, 0.8)', color: '#cbd5e1', border: '1px solid rgba(100, 150, 255, 0.3)' }}>
                                            <option value="approved">✓ Одобрить</option>
                                            <option value="pending">⏳ На модерацию</option>
                                            <option value="spam">🚫 Спам</option>
                                        </select>
                                        <button onClick={() => deleteComment(comment.id)} style={{ background: 'rgba(239, 68, 68, 0.6)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer' }}>
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;