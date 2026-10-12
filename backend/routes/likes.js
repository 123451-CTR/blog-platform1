const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ПОСТАВИТЬ/УБРАТЬ ЛАЙК

router.post('/post/:postId/toggle', authenticate, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        // Проверяем, есть ли уже лайк
        const [existing] = await db.query(
            `SELECT id FROM post_likes 
             WHERE post_id = ? AND 
             ((user_id IS NOT NULL AND user_id = ?) OR (admin_id IS NOT NULL AND admin_id = ?))`,
            [postId, userId, adminId]
        );

        if (existing.length > 0) {
            // Удаляем лайк
            await db.query('DELETE FROM post_likes WHERE id = ?', [existing[0].id]);
            await db.query('UPDATE posts SET likes = likes - 1 WHERE id = ?', [postId]);
            return res.json({ liked: false, message: 'Лайк удалён' });
        } else {
            // Добавляем лайк
            await db.query(
                'INSERT INTO post_likes (post_id, user_id, admin_id) VALUES (?, ?, ?)',
                [postId, userId, adminId]
            );
            await db.query('UPDATE posts SET likes = likes + 1 WHERE id = ?', [postId]);
            return res.json({ liked: true, message: 'Лайк добавлен' });
        }
    } catch (error) {
        console.error('❌ Ошибка при лайке:', error);
        res.status(500).json({ error: 'Ошибка при обработке лайка' });
    }
});

// ПОЛУЧИТЬ СТАТУС ЛАЙКА

router.get('/post/:postId/status', authenticate, async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        const [existing] = await db.query(
            `SELECT id FROM post_likes 
             WHERE post_id = ? AND 
             ((user_id IS NOT NULL AND user_id = ?) OR (admin_id IS NOT NULL AND admin_id = ?))`,
            [postId, userId, adminId]
        );

        res.json({ liked: existing.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения статуса' });
    }
});


// ПОЛУЧИТЬ КОЛИЧЕСТВО ЛАЙКОВ ПОСТА

router.get('/post/:postId/count', async (req, res) => {
    const { postId } = req.params;

    try {
        const [result] = await db.query('SELECT likes FROM posts WHERE id = ?', [postId]);
        res.json({ count: result[0]?.likes || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения количества лайков' });
    }
});

// ЛАЙКНУТЬ/УБРАТЬ ЛАЙК С ЖУРНАЛА

router.post('/magazine/:magazineId/toggle', authenticate, async (req, res) => {
    const { magazineId } = req.params;
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        // Проверяем, существует ли журнал
        const [magazine] = await db.query('SELECT id FROM magazines WHERE id = ?', [magazineId]);
        if (magazine.length === 0) {
            return res.status(404).json({ error: 'Журнал не найден' });
        }

        // Проверяем, есть ли уже лайк
        const [existing] = await db.query(
            `SELECT id FROM magazine_likes 
             WHERE magazine_id = ? AND 
             ((user_id IS NOT NULL AND user_id = ?) OR (admin_id IS NOT NULL AND admin_id = ?))`,
            [magazineId, userId, adminId]
        );

        if (existing.length > 0) {
            // Удаляем лайк
            await db.query('DELETE FROM magazine_likes WHERE id = ?', [existing[0].id]);
            await db.query('UPDATE magazines SET likes = likes - 1 WHERE id = ?', [magazineId]);
            return res.json({ liked: false, message: 'Лайк удалён' });
        } else {
            // Добавляем лайк
            await db.query(
                'INSERT INTO magazine_likes (magazine_id, user_id, admin_id) VALUES (?, ?, ?)',
                [magazineId, userId, adminId]
            );
            await db.query('UPDATE magazines SET likes = likes + 1 WHERE id = ?', [magazineId]);
            return res.json({ liked: true, message: 'Лайк добавлен' });
        }
    } catch (error) {
        console.error('❌ Ошибка при лайке журнала:', error);
        res.status(500).json({ error: 'Ошибка при обработке лайка' });
    }
});


// ПОЛУЧИТЬ СТАТУС ЛАЙКА ЖУРНАЛА

router.get('/magazine/:magazineId/status', authenticate, async (req, res) => {
    const { magazineId } = req.params;
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        const [existing] = await db.query(
            `SELECT id FROM magazine_likes 
             WHERE magazine_id = ? AND 
             ((user_id IS NOT NULL AND user_id = ?) OR (admin_id IS NOT NULL AND admin_id = ?))`,
            [magazineId, userId, adminId]
        );

        res.json({ liked: existing.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения статуса' });
    }
});


// ПОЛУЧИТЬ КОЛИЧЕСТВО ЛАЙКОВ ЖУРНАЛА

router.get('/magazine/:magazineId/count', async (req, res) => {
    const { magazineId } = req.params;

    try {
        const [result] = await db.query('SELECT likes FROM magazines WHERE id = ?', [magazineId]);
        res.json({ count: result[0]?.likes || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения количества лайков' });
    }
});


// ПОЛУЧИТЬ ПОСТЫ, КОТОРЫЕ ЛАЙКНУЛ ПОЛЬЗОВАТЕЛЬ

router.get('/my-liked-posts', authenticate, async (req, res) => {
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        const [likes] = await db.query(
            `SELECT p.*, 
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
            [userId, adminId]
        );

        res.json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения лайкнутых постов' });
    }
});

// ПОЛУЧИТЬ ЖУРНАЛЫ, КОТОРЫЕ ЛАЙКНУЛ ПОЛЬЗОВАТЕЛЬ

router.get('/my-liked-magazines', authenticate, async (req, res) => {
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        const [likes] = await db.query(
            `SELECT m.*
             FROM magazine_likes ml
             JOIN magazines m ON ml.magazine_id = m.id
             WHERE (ml.user_id = ? OR ml.admin_id = ?)
             ORDER BY ml.created_at DESC`,
            [userId, adminId]
        );

        res.json(likes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения лайкнутых журналов' });
    }
});
module.exports = router;