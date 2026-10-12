const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ПОДПИСАТЬСЯ/ОТПИСАТЬСЯ ОТ ЖУРНАЛА

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

        // Проверяем, есть ли уже подписка
        const [existing] = await db.query(
            `SELECT id FROM magazine_subscriptions 
             WHERE magazine_id = ? AND 
             ((user_id IS NOT NULL AND user_id = ?) OR (admin_id IS NOT NULL AND admin_id = ?))`,
            [magazineId, userId, adminId]
        );

        if (existing.length > 0) {
            // Отписываемся
            await db.query('DELETE FROM magazine_subscriptions WHERE id = ?', [existing[0].id]);
            await db.query('UPDATE magazines SET subscribers = subscribers - 1 WHERE id = ?', [magazineId]);
            return res.json({ subscribed: false, message: 'Вы отписались' });
        } else {
            // Подписываемся
            await db.query(
                'INSERT INTO magazine_subscriptions (magazine_id, user_id, admin_id) VALUES (?, ?, ?)',
                [magazineId, userId, adminId]
            );
            await db.query('UPDATE magazines SET subscribers = subscribers + 1 WHERE id = ?', [magazineId]);
            return res.json({ subscribed: true, message: 'Вы подписались' });
        }
    } catch (error) {
        console.error('❌ Ошибка при подписке:', error);
        res.status(500).json({ error: 'Ошибка при обработке подписки' });
    }
});


// ПОЛУЧИТЬ СТАТУС ПОДПИСКИ

router.get('/magazine/:magazineId/status', authenticate, async (req, res) => {
    const { magazineId } = req.params;
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        const [existing] = await db.query(
            `SELECT id FROM magazine_subscriptions 
             WHERE magazine_id = ? AND 
             ((user_id IS NOT NULL AND user_id = ?) OR (admin_id IS NOT NULL AND admin_id = ?))`,
            [magazineId, userId, adminId]
        );

        res.json({ subscribed: existing.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения статуса' });
    }
});


// ПОЛУЧИТЬ КОЛИЧЕСТВО ПОДПИСЧИКОВ ЖУРНАЛА

router.get('/magazine/:magazineId/count', async (req, res) => {
    const { magazineId } = req.params;

    try {
        const [result] = await db.query('SELECT subscribers FROM magazines WHERE id = ?', [magazineId]);
        res.json({ count: result[0]?.subscribers || 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения количества подписчиков' });
    }
});


// ПОЛУЧИТЬ МОИ ПОДПИСКИ

router.get('/my-subscriptions', authenticate, async (req, res) => {
    const userId = req.user.type === 'user' ? req.user.id : null;
    const adminId = req.user.type === 'admin' ? req.user.id : null;

    try {
        const [subscriptions] = await db.query(
            `SELECT m.*, ms.created_at as subscribed_at
             FROM magazine_subscriptions ms
             JOIN magazines m ON ms.magazine_id = m.id
             WHERE (ms.user_id = ? OR ms.admin_id = ?)
             ORDER BY ms.created_at DESC`,
            [userId, adminId]
        );

        res.json(subscriptions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения подписок' });
    }
});

// ПОДПИСАТЬСЯ НА АВТОРА (БЛОГЕРА)

router.post('/author/:authorType/:authorId/toggle', authenticate, async (req, res) => {
    const { authorType, authorId } = req.params;
    const subscriberType = req.user.type;
    const subscriberId = req.user.id;

    // Нельзя подписаться на самого себя
    if (authorType === subscriberType && parseInt(authorId) === subscriberId) {
        return res.status(400).json({ error: 'Нельзя подписаться на самого себя' });
    }

    try {
        // Проверяем, существует ли автор
        let authorExists = false;
        if (authorType === 'user') {
            const [user] = await db.query('SELECT id FROM users WHERE id = ?', [authorId]);
            authorExists = user.length > 0;
        } else {
            const [admin] = await db.query('SELECT id FROM admins WHERE id = ?', [authorId]);
            authorExists = admin.length > 0;
        }

        if (!authorExists) {
            return res.status(404).json({ error: 'Автор не найден' });
        }

        // Проверяем, есть ли подписка
        const [existing] = await db.query(
            `SELECT id FROM author_subscriptions 
             WHERE author_type = ? AND author_id = ? 
             AND subscriber_type = ? AND subscriber_id = ?`,
            [authorType, authorId, subscriberType, subscriberId]
        );

        if (existing.length > 0) {
            // Отписываемся
            await db.query('DELETE FROM author_subscriptions WHERE id = ?', [existing[0].id]);
            
            // Обновляем счётчики у автора
            if (authorType === 'user') {
                await db.query('UPDATE users SET followers = followers - 1 WHERE id = ?', [authorId]);
            } else {
                await db.query('UPDATE admins SET followers = followers - 1 WHERE id = ?', [authorId]);
            }
            
            // Обновляем счётчик подписок у подписчика
            if (subscriberType === 'user') {
                await db.query('UPDATE users SET following = following - 1 WHERE id = ?', [subscriberId]);
            } else {
                await db.query('UPDATE admins SET following = following - 1 WHERE id = ?', [subscriberId]);
            }
            
            return res.json({ subscribed: false, message: 'Вы отписались' });
        } else {
            // Подписываемся
            await db.query(
                `INSERT INTO author_subscriptions (author_type, author_id, subscriber_type, subscriber_id) 
                 VALUES (?, ?, ?, ?)`,
                [authorType, authorId, subscriberType, subscriberId]
            );
            
            // Обновляем счётчики у автора
            if (authorType === 'user') {
                await db.query('UPDATE users SET followers = followers + 1 WHERE id = ?', [authorId]);
            } else {
                await db.query('UPDATE admins SET followers = followers + 1 WHERE id = ?', [authorId]);
            }
            
            // Обновляем счётчик подписок у подписчика
            if (subscriberType === 'user') {
                await db.query('UPDATE users SET following = following + 1 WHERE id = ?', [subscriberId]);
            } else {
                await db.query('UPDATE admins SET following = following + 1 WHERE id = ?', [subscriberId]);
            }
            
            return res.json({ subscribed: true, message: 'Вы подписались' });
        }
    } catch (error) {
        console.error('❌ Ошибка при подписке на автора:', error);
        res.status(500).json({ error: 'Ошибка при обработке подписки' });
    }
});

// ПОЛУЧИТЬ СТАТУС ПОДПИСКИ НА АВТОРА

router.get('/author/:authorType/:authorId/status', authenticate, async (req, res) => {
    const { authorType, authorId } = req.params;
    const subscriberType = req.user.type;
    const subscriberId = req.user.id;

    try {
        const [existing] = await db.query(
            `SELECT id FROM author_subscriptions 
             WHERE author_type = ? AND author_id = ? 
             AND subscriber_type = ? AND subscriber_id = ?`,
            [authorType, authorId, subscriberType, subscriberId]
        );

        res.json({ subscribed: existing.length > 0 });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения статуса' });
    }
});


// ПОЛУЧИТЬ ПОДПИСЧИКОВ АВТОРА

router.get('/author/:authorType/:authorId/followers', async (req, res) => {
    const { authorType, authorId } = req.params;

    try {
        const [followers] = await db.query(
            `SELECT asub.subscriber_type, asub.subscriber_id, asub.created_at,
                    CASE 
                        WHEN asub.subscriber_type = 'user' THEN u.username
                        WHEN asub.subscriber_type = 'admin' THEN a.username
                    END as subscriber_name
             FROM author_subscriptions asub
             LEFT JOIN users u ON asub.subscriber_type = 'user' AND asub.subscriber_id = u.id
             LEFT JOIN admins a ON asub.subscriber_type = 'admin' AND asub.subscriber_id = a.id
             WHERE asub.author_type = ? AND asub.author_id = ?
             ORDER BY asub.created_at DESC`,
            [authorType, authorId]
        );

        res.json(followers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения подписчиков' });
    }
});
module.exports = router;