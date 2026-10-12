import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BlogList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/posts');
      setPosts(res.data.posts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: 'white' }}>Последние записи в блоге</h1>
      {posts.length === 0 ? (
        <p style={{ color: 'white' }}>Постов пока нет. Будь первым кто его создаст :D</p>
      ) : (
        posts.map(post => (
          <article key={post.id} className="post-card">
            <h2 className="post-title">
              <Link to={`/post/${post.slug}`}>{post.title}</Link>
            </h2>
            <div className="post-meta">
              <span>✍️ {post.author_name}</span>
              <span>📅 {new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
              <span>👁️ {post.views} просмотров</span>
              <span>❤️ {post.likes || 0} лайков</span>
            </div>
            <p className="post-excerpt">{post.excerpt || post.content.substring(0, 200)}...</p>
            <Link to={`/post/${post.slug}`}>Read more →</Link>
          </article>
        ))
      )}
    </div>
  );
};

export default BlogList;