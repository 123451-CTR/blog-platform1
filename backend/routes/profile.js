const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


// ПОЛУЧИТЬ СВОЙ ПРОФИЛЬ (ВСЕ ДАННЫЕ)

router.get('/me', authenticate, async (req, res) => {
    try {
        let userData = {};
        
        if (req.user.type === 'user') {
            // Основные данные пользователя
            const [users] = await db.query(
                `SELECT id, username, email, bio, avatar, role, followers, following, created_at 
                 FROM users WHERE id = ?`,
                [req.user.id]
            );
            
            if (users.length === 0) {
                return res.status(404).json({ error: 'Пользователь не найден' });
            }
            
            userData = users[0];
            userData.type = 'user';
            
            // Мои посты (все, включая черновики)
            const [posts] = await db.query(
                `SELECT id, title, slug, views, likes, status, created_at 
                 FROM posts 
                 WHERE author_type = 'user' AND author_id = ?
                 ORDER BY created_at DESC`,
                [req.user.id]
            );
            userData.posts = posts;
            
            // Мои журналы (все)
            const [magazines] = await db.query(
                `SELECT id, title, slug, subscribers, likes, status, created_at 
                 FROM magazines 
                 WHERE editor_type = 'user' AND editor_id = ?
                 ORDER BY created_at DESC`,
                [req.user.id]
            );
            userData.magazines = magazines;
            
        } else {
            // Основные данные админа
            const [admins] = await db.query(
                `SELECT id, username, email, full_name, avatar, role, followers, following, created_at 
                 FROM admins WHERE id = ?`,
                [req.user.id]
            );
            
            if (admins.length === 0) {
                return res.status(404).json({ error: 'Администратор не найден' });
            }
            
            userData = admins[0];
            userData.type = 'admin';
            userData.username = userData.full_name || userData.username;
            
            // Мои посты
            const [posts] = await db.query(
                `SELECT id, title, slug, views, likes, status, created_at 
                 FROM posts 
                 WHERE author_type = 'admin' AND author_id = ?
                 ORDER BY created_at DESC`,
                [req.user.id]
            );
            userData.posts = posts;
            
            // Мои журналы
            const [magazines] = await db.query(
                `SELECT id, title, slug, subscribers, likes, status, created_at 
                 FROM magazines 
                 WHERE editor_type = 'admin' AND editor_id = ?
                 ORDER BY created_at DESC`,
                [req.user.id]
            );
            userData.magazines = magazines;
        }
        
        // ПОДПИСКИ (НА КОГО ПОДПИСАН)
        
        const [following] = await db.query(
            `SELECT asub.author_type, asub.author_id, asub.created_at,
                    CASE 
                        WHEN asub.author_type = 'user' THEN u.username
                        WHEN asub.author_type = 'admin' THEN a.username
                    END as author_name,
                    CASE 
                        WHEN asub.author_type = 'user' THEN u.avatar
                        WHEN asub.author_type = 'admin' THEN a.avatar
                    END as author_avatar
             FROM author_subscriptions asub
             LEFT JOIN users u ON asub.author_type = 'user' AND asub.author_id = u.id
             LEFT JOIN admins a ON asub.author_type = 'admin' AND asub.author_id = a.id
             WHERE asub.subscriber_type = ? AND asub.subscriber_id = ?
             ORDER BY asub.created_at DESC`,
            [req.user.type, req.user.id]
        );
        userData.following_list = following;
        
        
        // ПОДПИСЧИКИ (КТО ПОДПИСАН НА МЕНЯ)
        
        const [followers] = await db.query(
            `SELECT asub.subscriber_type, asub.subscriber_id, asub.created_at,
                    CASE 
                        WHEN asub.subscriber_type = 'user' THEN u.username
                        WHEN asub.subscriber_type = 'admin' THEN a.username
                    END as subscriber_name,
                    CASE 
                        WHEN asub.subscriber_type = 'user' THEN u.avatar
                        WHEN asub.subscriber_type = 'admin' THEN a.avatar
                    END as subscriber_avatar
             FROM author_subscriptions asub
             LEFT JOIN users u ON asub.subscriber_type = 'user' AND asub.subscriber_id = u.id
             LEFT JOIN admins a ON asub.subscriber_type = 'admin' AND asub.subscriber_id = a.id
             WHERE asub.author_type = ? AND asub.author_id = ?
             ORDER BY asub.created_at DESC`,
            [req.user.type, req.user.id]
        );
        userData.followers_list = followers;
        
        
        // ЛАЙКНУТЫЕ ПОСТЫ
        
        const [likedPosts] = await db.query(
            `SELECT p.id, p.title, p.slug, p.views, p.likes, p.created_at,
                    CASE 
                        WHEN p.author_type = 'user' THEN u.username
                        ELSE a.username
                    END as author_name
             FROM post_likes pl
             JOIN posts p ON pl.post_id = p.id
             LEFT JOIN users u ON p.author_type = 'user' AND p.author_id = u.id
             LEFT JOIN admins a ON p.author_type = 'admin' AND p.author_id = a.id
             WHERE (pl.user_id = ? OR pl.admin_id = ?)
             ORDER BY pl.created_at DESC`,
            [req.user.type === 'user' ? req.user.id : null, req.user.type === 'admin' ? req.user.id : null]
        );
        userData.liked_posts = likedPosts;
        
        
        // ЛАЙКНУТЫЕ ЖУРНАЛЫ
        
        const [likedMagazines] = await db.query(
            `SELECT m.id, m.title, m.slug, m.subscribers, m.likes, m.created_at
             FROM magazine_likes ml
             JOIN magazines m ON ml.magazine_id = m.id
             WHERE (ml.user_id = ? OR ml.admin_id = ?)
             ORDER BY ml.created_at DESC`,
            [req.user.type === 'user' ? req.user.id : null, req.user.type === 'admin' ? req.user.id : null]
        );
        userData.liked_magazines = likedMagazines;
        
        
        // ПОДПИСКИ НА ЖУРНАЛЫ
        
        const [subscribedMagazines] = await db.query(
            `SELECT m.id, m.title, m.slug, m.subscribers, m.likes, m.created_at
             FROM magazine_subscriptions ms
             JOIN magazines m ON ms.magazine_id = m.id
             WHERE (ms.user_id = ? OR ms.admin_id = ?)
             ORDER BY ms.created_at DESC`,
            [req.user.type === 'user' ? req.user.id : null, req.user.type === 'admin' ? req.user.id : null]
        );
        userData.subscribed_magazines = subscribedMagazines;
        
        res.json(userData);
    } catch (error) {
        console.error('❌ Ошибка получения профиля:', error);
        res.status(500).json({ error: 'Ошибка получения профиля' });
    }
});


// ОБНОВИТЬ ПРОФИЛЬ

router.put('/me', authenticate, async (req, res) => {
    const { bio, avatar, full_name } = req.body;
    
    try {
        if (req.user.type === 'user') {
            await db.query(
                'UPDATE users SET bio = COALESCE(?, bio), avatar = COALESCE(?, avatar) WHERE id = ?',
                [bio, avatar, req.user.id]
            );
        } else {
            await db.query(
                'UPDATE admins SET full_name = COALESCE(?, full_name), avatar = COALESCE(?, avatar) WHERE id = ?',
                [full_name, avatar, req.user.id]
            );
        }
        
        res.json({ message: 'Профиль обновлён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления профиля' });
    }
});

module.exports = router;