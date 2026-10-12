import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Profile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('liked-posts');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            console.log('Токен:', token);
            
            if (!token) {
                setError('Вы не авторизованы. Пожалуйста, войдите.');
                setLoading(false);
                return;
            }

            const res = await axios.get('http://localhost:5000/api/profile/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Данные профиля:', res.data);
            setProfile(res.data);
        } catch (err) {
            console.error('Ошибка:', err);
            setError(err.response?.data?.error || 'Ошибка загрузки профиля');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка профиля...</div>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!profile) return <div className="alert alert-error">Профиль не найден</div>;

    return (
        <div>
            {/* Шапка профиля */}
            <div className="post-content" style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '4rem' }}>{profile.type === 'admin' ? '👑' : '👤'}</div>
                <h2>{profile.username || profile.email}</h2>
                <p>{profile.email}</p>
                {profile.bio && <p>{profile.bio}</p>}
                
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '16px' }}>
                    <div><strong>{profile.followers || 0}</strong> подписчиков</div>
                    <div><strong>{profile.following || 0}</strong> подписок</div>
                </div>
            </div>

            {/* Кнопки вкладок */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button onClick={() => setActiveTab('liked-posts')} style={{ background: activeTab === 'liked-posts' ? '#667eea' : '#e2e8f0', color: activeTab === 'liked-posts' ? 'white' : '#333', width: 'auto', padding: '8px 16px' }}>
                    ❤️ Лайкнутые посты ({profile.liked_posts?.length || 0})
                </button>
                <button onClick={() => setActiveTab('liked-magazines')} style={{ background: activeTab === 'liked-magazines' ? '#667eea' : '#e2e8f0', color: activeTab === 'liked-magazines' ? 'white' : '#333', width: 'auto', padding: '8px 16px' }}>
                    💖 Лайкнутые журналы ({profile.liked_magazines?.length || 0})
                </button>
                <button onClick={() => setActiveTab('subscriptions')} style={{ background: activeTab === 'subscriptions' ? '#667eea' : '#e2e8f0', color: activeTab === 'subscriptions' ? 'white' : '#333', width: 'auto', padding: '8px 16px' }}>
                    🔔 Подписки на журналы ({profile.subscribed_magazines?.length || 0})
                </button>
                <button onClick={() => setActiveTab('followers')} style={{ background: activeTab === 'followers' ? '#667eea' : '#e2e8f0', color: activeTab === 'followers' ? 'white' : '#333', width: 'auto', padding: '8px 16px' }}>
                    👥 Мои подписчики ({profile.followers_list?.length || 0})
                </button>
                <button onClick={() => setActiveTab('my-posts')} style={{ background: activeTab === 'my-posts' ? '#667eea' : '#e2e8f0', color: activeTab === 'my-posts' ? 'white' : '#333', width: 'auto', padding: '8px 16px' }}>
                    📝 Мои посты ({profile.posts?.length || 0})
                </button>
            </div>

            {/* ЛАЙКНУТЫЕ ПОСТЫ */}
            {activeTab === 'liked-posts' && (
                <div>
                    {profile.liked_posts?.length === 0 ? (
                        <div className="post-card" style={{ textAlign: 'center' }}>Вы ещё не лайкнули ни одного поста</div>
                    ) : (
                        profile.liked_posts.map(post => (
                            <div key={post.id} className="post-card">
                                <h3><Link to={`/post/${post.slug}`}>{post.title}</Link></h3>
                                <div className="post-meta">❤️ {post.likes} лайков • 👁️ {post.views} просмотров</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ЛАЙКНУТЫЕ ЖУРНАЛЫ */}
            {activeTab === 'liked-magazines' && (
                <div>
                    {profile.liked_magazines?.length === 0 ? (
                        <div className="post-card" style={{ textAlign: 'center' }}>Вы ещё не лайкнули ни одного журнала</div>
                    ) : (
                        profile.liked_magazines.map(mag => (
                            <div key={mag.id} className="post-card">
                                <h3><Link to={`/magazine/${mag.slug}`}>{mag.title}</Link></h3>
                                <div className="post-meta">🔔 {mag.subscribers} подписчиков • ❤️ {mag.likes} лайков</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ПОДПИСКИ НА ЖУРНАЛЫ */}
            {activeTab === 'subscriptions' && (
                <div>
                    {profile.subscribed_magazines?.length === 0 ? (
                        <div className="post-card" style={{ textAlign: 'center' }}>Вы ещё не подписаны ни на один журнал</div>
                    ) : (
                        profile.subscribed_magazines.map(mag => (
                            <div key={mag.id} className="post-card">
                                <h3><Link to={`/magazine/${mag.slug}`}>{mag.title}</Link></h3>
                                <div className="post-meta">🔔 {mag.subscribers} подписчиков • ❤️ {mag.likes} лайков</div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ПОДПИСЧИКИ */}
            {activeTab === 'followers' && (
                <div>
                    {profile.followers_list?.length === 0 ? (
                        <div className="post-card" style={{ textAlign: 'center' }}>У вас пока нет подписчиков</div>
                    ) : (
                        profile.followers_list.map(follower => (
                            <div key={follower.subscriber_id} className="post-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '2rem' }}>{follower.subscriber_type === 'admin' ? '👑' : '👤'}</span>
                                    <div>
                                        <strong>{follower.subscriber_name}</strong>
                                        <div className="post-meta">Подписался: {new Date(follower.created_at).toLocaleDateString('ru-RU')}</div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* МОИ ПОСТЫ */}
            {activeTab === 'my-posts' && (
                <div>
                    {profile.posts?.length === 0 ? (
                        <div className="post-card" style={{ textAlign: 'center' }}>У вас пока нет постов. <Link to="/create-post">Создать первый →</Link></div>
                    ) : (
                        profile.posts.map(post => (
                            <div key={post.id} className="post-card">
                                <h3><Link to={`/post/${post.slug}`}>{post.title}</Link></h3>
                                <div className="post-meta">❤️ {post.likes} лайков • 👁️ {post.views} просмотров • {post.status === 'published' ? '✅ Опубликован' : '📝 Черновик'}</div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default Profile;