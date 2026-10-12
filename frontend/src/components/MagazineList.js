import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const MagazineList = () => {
    const [magazines, setMagazines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMagazines();
    }, []);

    const fetchMagazines = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/magazines');
            setMagazines(res.data);
        } catch (error) {
            console.error('Ошибка загрузки журналов:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Загрузка журналов...</div>;

    return (
        <div>
            <h1 className="page-title">📰 Онлайн-журналы</h1>
            {magazines.length === 0 ? (
                <div className="post-card" style={{ textAlign: 'center' }}>
                    <p>📭 Пока нет ни одного журнала.</p>
                    <Link to="/create-magazine" style={{ color: '#667eea', marginTop: '16px', display: 'inline-block' }}>
                        Создать первый журнал →
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {magazines.map(mag => (
                        <article key={mag.id} className="post-card">
                            {mag.cover_image && (
                                <img src={mag.cover_image} alt={mag.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} />
                            )}
                            <h2 className="post-title">
                                <Link to={`/magazine/${mag.slug}`}>{mag.title}</Link>
                            </h2>
                            <div className="post-meta">
                                <span>👨‍💼 Редактор: {mag.editor_name}</span>
                                <span>📅 {new Date(mag.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <p className="post-excerpt">{mag.description || 'Описание отсутствует'}</p>
                            <div className="post-meta">
                                <span>📄 Выпусков: {mag.issues_count || 0}</span>
                                {mag.last_issue && <span>🔢 Последний выпуск: №{mag.last_issue}</span>}
                            </div>
                            <Link to={`/magazine/${mag.slug}`} className="read-more">
                                Читать журнал →
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MagazineList;