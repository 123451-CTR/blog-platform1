const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const router = express.Router();

// СТАТИСТИКА

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
    try {
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [adminCount] = await db.query('SELECT COUNT(*) as count FROM admins');
        const [postCount] = await db.query('SELECT COUNT(*) as count FROM posts');
        const [publishedCount] = await db.query('SELECT COUNT(*) as count FROM posts WHERE status = "published"');
        const [draftCount] = await db.query('SELECT COUNT(*) as count FROM posts WHERE status = "draft"');
        const [magazineCount] = await db.query('SELECT COUNT(*) as count FROM magazines');
        const [issueCount] = await db.query('SELECT COUNT(*) as count FROM issues');
        const [commentCount] = await db.query('SELECT COUNT(*) as count FROM comments');
        const [pendingComments] = await db.query('SELECT COUNT(*) as count FROM comments WHERE status = "pending"');
        const [totalViews] = await db.query('SELECT SUM(views) as total FROM posts');
        const [totalLikes] = await db.query('SELECT SUM(likes) as total FROM posts');

        res.json({
            users: userCount[0].count,
            admins: adminCount[0].count,
            totalPosts: postCount[0].count,
            publishedPosts: publishedCount[0].count,
            draftPosts: draftCount[0].count,
            totalMagazines: magazineCount[0].count,
            totalIssues: issueCount[0].count,
            totalComments: commentCount[0].count,
            pendingComments: pendingComments[0].count,
            totalViews: totalViews[0].total || 0,
            totalLikes: totalLikes[0].total || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});


// УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ

router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT id, username, email, role, is_approved, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения пользователей' });
    }
});

router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Проверяем, есть ли у пользователя посты
        const [posts] = await db.query('SELECT COUNT(*) as count FROM posts WHERE author_type = "user" AND author_id = ?', [id]);
        
        if (posts[0].count > 0) {
            // Переносим посты на админа или удаляем
            await db.query('UPDATE posts SET author_type = "admin", author_id = 1 WHERE author_type = "user" AND author_id = ?', [id]);
        }
        
        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'Пользователь удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления пользователя' });
    }
});

// Блокировка/разблокировка пользователя
router.put('/users/:id/toggle-approve', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        const [user] = await db.query('SELECT is_approved FROM users WHERE id = ?', [id]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        const newStatus = !user[0].is_approved;
        await db.query('UPDATE users SET is_approved = ? WHERE id = ?', [newStatus, id]);
        res.json({ message: newStatus ? 'Пользователь разблокирован' : 'Пользователь заблокирован' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка изменения статуса' });
    }
});


// УПРАВЛЕНИЕ ПОСТАМИ (БЛОГАМИ)

router.get('/posts', authenticate, requireAdmin, async (req, res) => {
    try {
        const [posts] = await db.query(`
            SELECT p.*, 
                   CASE 
                       WHEN p.author_type = 'user' THEN u.username
                       ELSE a.username
                   END as author_name,
                   c.name as category_name
            FROM posts p
            LEFT JOIN users u ON p.author_type = 'user' AND p.author_id = u.id
            LEFT JOIN admins a ON p.author_type = 'admin' AND p.author_id = a.id
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.created_at DESC
        `);
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения постов' });
    }
});

router.put('/posts/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, content, excerpt, category_id, status, featured_image } = req.body;

    try {
        const slug = title ? title.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-') + '-' + Date.now() : undefined;
        
        await db.query(`
            UPDATE posts SET
                title = COALESCE(?, title),
                slug = COALESCE(?, slug),
                content = COALESCE(?, content),
                excerpt = COALESCE(?, excerpt),
                category_id = COALESCE(?, category_id),
                status = COALESCE(?, status),
                featured_image = COALESCE(?, featured_image),
                updated_at = NOW()
            WHERE id = ?
        `, [title, slug, content, excerpt, category_id, status, featured_image, id]);

        res.json({ message: 'Пост обновлён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления поста' });
    }
});

router.delete('/posts/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('DELETE FROM posts WHERE id = ?', [id]);
        res.json({ message: 'Пост удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления поста' });
    }
});


// УПРАВЛЕНИЕ ЖУРНАЛАМИ

router.get('/magazines', authenticate, requireAdmin, async (req, res) => {
    try {
        const [magazines] = await db.query(`
            SELECT m.*,
                   CASE 
                       WHEN m.editor_type = 'user' THEN u.username
                       ELSE a.username
                   END as editor_name,
                   (SELECT COUNT(*) FROM issues WHERE magazine_id = m.id) as issues_count
            FROM magazines m
            LEFT JOIN users u ON m.editor_type = 'user' AND m.editor_id = u.id
            LEFT JOIN admins a ON m.editor_type = 'admin' AND m.editor_id = a.id
            ORDER BY m.created_at DESC
        `);
        res.json(magazines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения журналов' });
    }
});

router.put('/magazines/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, description, status, cover_image } = req.body;

    try {
        await db.query(`
            UPDATE magazines SET
                title = COALESCE(?, title),
                description = COALESCE(?, description),
                status = COALESCE(?, status),
                cover_image = COALESCE(?, cover_image),
                updated_at = NOW()
            WHERE id = ?
        `, [title, description, status, cover_image, id]);

        res.json({ message: 'Журнал обновлён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления журнала' });
    }
});

router.delete('/magazines/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Сначала удаляем все выпуски (каскадно)
        await db.query('DELETE FROM issues WHERE magazine_id = ?', [id]);
        await db.query('DELETE FROM magazines WHERE id = ?', [id]);
        res.json({ message: 'Журнал и все его выпуски удалены' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления журнала' });
    }
});


// УПРАВЛЕНИЕ ВЫПУСКАМИ

router.get('/issues', authenticate, requireAdmin, async (req, res) => {
    try {
        const [issues] = await db.query(`
            SELECT i.*, m.title as magazine_title, m.slug as magazine_slug
            FROM issues i
            JOIN magazines m ON i.magazine_id = m.id
            ORDER BY i.created_at DESC
        `);
        res.json(issues);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения выпусков' });
    }
});

router.delete('/issues/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('DELETE FROM issues WHERE id = ?', [id]);
        res.json({ message: 'Выпуск удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления выпуска' });
    }
});

// УПРАВЛЕНИЕ КАТЕГОРИЯМИ

router.get('/categories', authenticate, requireAdmin, async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT c.*, COUNT(p.id) as posts_count
            FROM categories c
            LEFT JOIN posts p ON p.category_id = c.id
            GROUP BY c.id
            ORDER BY c.name
        `);
        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения категорий' });
    }
});

router.post('/categories', authenticate, requireAdmin, async (req, res) => {
    const { name, description, icon, color } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const slug = name.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-');

    try {
        const [result] = await db.query(
            'INSERT INTO categories (name, slug, description, icon, color) VALUES (?, ?, ?, ?, ?)',
            [name, slug, description || null, icon || '📁', color || '#667eea']
        );
        res.json({ id: result.insertId, name, slug, message: 'Категория создана' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Категория уже существует' });
        } else {
            res.status(500).json({ error: 'Ошибка создания категории' });
        }
    }
});

router.put('/categories/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { name, description, icon, color } = req.body;

    try {
        await db.query(
            'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), icon = COALESCE(?, icon), color = COALESCE(?, color) WHERE id = ?',
            [name, description, icon, color, id]
        );
        res.json({ message: 'Категория обновлена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления категории' });
    }
});

router.delete('/categories/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        // Проверяем, есть ли посты в этой категории
        const [posts] = await db.query('SELECT COUNT(*) as count FROM posts WHERE category_id = ?', [id]);
        
        if (posts[0].count > 0) {
            return res.status(400).json({ error: 'Нельзя удалить категорию, в которой есть посты' });
        }
        
        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Категория удалена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления категории' });
    }
});


// УПРАВЛЕНИЕ КОММЕНТАРИЯМИ

router.get('/comments', authenticate, requireAdmin, async (req, res) => {
    try {
        const [comments] = await db.query(`
            SELECT c.*,
                   CASE 
                       WHEN c.author_type = 'user' THEN u.username
                       ELSE a.username
                   END as author_name,
                   p.title as post_title
            FROM comments c
            LEFT JOIN users u ON c.author_type = 'user' AND c.author_id = u.id
            LEFT JOIN admins a ON c.author_type = 'admin' AND c.author_id = a.id
            LEFT JOIN posts p ON c.post_id = p.id
            ORDER BY c.created_at DESC
        `);
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения комментариев' });
    }
});

router.put('/comments/:id/status', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await db.query('UPDATE comments SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Статус комментария обновлён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления статуса' });
    }
});

router.delete('/comments/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('DELETE FROM comments WHERE id = ?', [id]);
        res.json({ message: 'Комментарий удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления комментария' });
    }
});

module.exports = router;