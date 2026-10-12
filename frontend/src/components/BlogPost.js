import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import LikeButton from './LikeButton';
import FollowAuthorButton from './FollowAuthorButton';

const BlogPost = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, [slug]);

    const fetchPost = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/posts/${slug}`);
            setPost(res.data);
        } catch (error) {
            console.error('Ошибка загрузки поста:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        if (!post?.id) return;
        try {
            const res = await axios.get(`http://localhost:5000/api/comments/post/${post.id}`);
            setComments(res.data);
        } catch (error) {
            console.error('Ошибка загрузки комментариев:', error);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Войдите, чтобы оставить комментарий');
            return;
        }
        
        try {
            await axios.post(`http://localhost:5000/api/comments/post/${post.id}`, 
                { content: newComment },
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            setNewComment('');
            fetchComments();
        } catch (error) {
            console.error('Ошибка добавления комментария:', error);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Удалить пост?')) {
            try {
                await axios.delete(`http://localhost:5000/api/posts/${post.id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                navigate('/');
            } catch (error) {
                console.error('Ошибка удаления:', error);
            }
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (window.confirm('Удалить комментарий?')) {
            try {
                await axios.delete(`http://localhost:5000/api/comments/${commentId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                fetchComments();
            } catch (error) {
                console.error('Ошибка удаления комментария:', error);
            }
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (!post) return <div className="alert alert-error">Пост не найден</div>;

    const canEdit = user && (user.id === post.author_id || user.type === 'admin');

    return (
        <div>
            <div className="post-content">
                <h1>{post.title}</h1>
                <div className="post-meta" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <span>✍️ {post.author_name}</span>
                    <FollowAuthorButton 
                        authorType={post.author_type} 
                        authorId={post.author_id} 
                        authorName={post.author_name}
                        initialFollowers={post.author_followers || 0}
                    />
                        <span>📅 {new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
                        <span>👁️ {post.views} просмотров</span>
                        <LikeButton postId={post.id} initialLikes={post.likes || 0} />
                </div>

                <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }} />
                
                {canEdit && (
                    <div className="post-actions">
                        <Link to={`/edit-post/${post.id}`}>
                            <button>✏️ Редактировать</button>
                        </Link>
                        <button onClick={handleDelete} className="delete-btn">🗑️ Удалить</button>
                    </div>
                )}
            </div>

            {/* КОММЕНТАРИИ */}
            <div className="post-content" style={{ marginTop: '24px' }}>
                <h3>💬 Комментарии ({comments.length})</h3>
                
                {user && (
                    <form onSubmit={handleAddComment} style={{ marginBottom: '24px' }}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Написать комментарий..."
                            rows="3"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '12px' }}
                            required
                        />
                        <button type="submit" style={{ width: 'auto' }}>Отправить</button>
                    </form>
                )}
                
                {comments.length === 0 ? (
                    <p>Пока нет комментариев. Будьте первым!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{comment.author_name}</strong>
                                <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                                    {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                                </span>
                            </div>
                            <p style={{ marginTop: '8px' }}>{comment.content}</p>
                            {(user?.id === comment.author_id || user?.type === 'admin') && (
                                <button onClick={() => handleDeleteComment(comment.id)} style={{ background: 'transparent', color: '#e53e3e', width: 'auto', padding: '4px 12px', fontSize: '0.75rem' }}>
                                    Удалить
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default BlogPost;