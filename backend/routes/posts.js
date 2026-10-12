const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


// ПОЛУЧИТЬ ПОСТ ПО ID (ДЛЯ РЕДАКТИРОВАНИЯ)
router.get('/id/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    
    try {
        const [posts] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `, [id]);
        
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Пост не найден' });
        }
        
        const post = posts[0];
        
        // Проверка прав: автор или админ
        if (post.author_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Нет прав для редактирования' });
        }
        
        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения поста' });
    }
});

// ОБНОВИТЬ МАРШРУТ ОБНОВЛЕНИЯ ПОСТА
router.put('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, content, excerpt, category_id, status, featured_image } = req.body;

    try {
        const [posts] = await db.query('SELECT author_id, author_type FROM posts WHERE id = ?', [id]);
        
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        const post = posts[0];
        
        if (post.author_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Вы можете редактировать только свои посты' });
        }

        const slug = title ? title.toLowerCase().replace(/[^a-zа-яё0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now() : undefined;
        
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

// ПОЛУЧИТЬ ВСЕ ОПУБЛИКОВАННЫЕ ПОСТЫ
router.get('/', async (req, res) => {
    console.log('📖 Запрос на получение постов');
    
    try {
        const [posts] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'published'
            ORDER BY p.created_at DESC
        `);

        // Добавляем имена авторов
        for (let post of posts) {
            if (post.author_type === 'user') {
                const [user] = await db.query('SELECT username FROM users WHERE id = ?', [post.author_id]);
                post.author_name = user[0]?.username || 'Неизвестный';
            } else {
                const [admin] = await db.query('SELECT username FROM admins WHERE id = ?', [post.author_id]);
                post.author_name = admin[0]?.username || 'Неизвестный';
            }
        }

        console.log(`✅ Найдено постов: ${posts.length}`);
        res.json({ posts, total: posts.length });
        
    } catch (error) {
        console.error('❌ Ошибка получения постов:', error);
        res.status(500).json({ error: 'Ошибка получения постов' });
    }
});

// ПОЛУЧИТЬ ПОСТ ПО SLUG
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    console.log(`📖 Запрос поста: ${slug}`);
    
    try {
        const [posts] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.status = 'published'
        `, [slug]);

        if (posts.length === 0) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        const post = posts[0];
        
        // Получаем имя автора
        if (post.author_type === 'user') {
            const [user] = await db.query('SELECT username FROM users WHERE id = ?', [post.author_id]);
            post.author_name = user[0]?.username || 'Неизвестный';
        } else {
            const [admin] = await db.query('SELECT username FROM admins WHERE id = ?', [post.author_id]);
            post.author_name = admin[0]?.username || 'Неизвестный';
        }

        // Увеличиваем счётчик просмотров
        await db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [post.id]);

        res.json(post);
        
    } catch (error) {
        console.error('❌ Ошибка получения поста:', error);
        res.status(500).json({ error: 'Ошибка получения поста' });
    }
});

// СОЗДАТЬ ПОСТ
router.post('/', authenticate, async (req, res) => {
    console.log('📝 Создание нового поста');
    console.log('Пользователь:', req.user);
    console.log('Данные поста:', req.body);
    
    const { title, content, excerpt, category_id, status, featured_image } = req.body;

    if (!title || !content) {
        console.log('❌ Ошибка: нет заголовка или содержания');
        return res.status(400).json({ error: 'Заголовок и содержание обязательны' });
    }

    // Создаём slug из заголовка
    const slug = title.toLowerCase()
        .replace(/[^a-zа-яё0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();

    try {
        const [result] = await db.query(`
            INSERT INTO posts (title, slug, content, excerpt, category_id, author_type, author_id, status, featured_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, slug, content, excerpt, category_id || null, req.user.type, req.user.id, status || 'published', featured_image || null]);

        console.log(`✅ Пост создан! ID: ${result.insertId}, Slug: ${slug}`);
        
        res.json({ 
            id: result.insertId, 
            slug, 
            message: 'Пост успешно создан' 
        });
        
    } catch (error) {
        console.error('❌ Ошибка создания поста:', error);
        res.status(500).json({ error: 'Ошибка создания поста: ' + error.message });
    }
});

// ОБНОВИТЬ ПОСТ
router.put('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, content, excerpt, category_id, status, featured_image } = req.body;

    try {
        const [posts] = await db.query('SELECT * FROM posts WHERE id = ?', [id]);
        
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        const post = posts[0];
        
        if (post.author_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Вы можете редактировать только свои посты' });
        }

        await db.query(`
            UPDATE posts SET
                title = COALESCE(?, title),
                content = COALESCE(?, content),
                excerpt = COALESCE(?, excerpt),
                category_id = COALESCE(?, category_id),
                status = COALESCE(?, status),
                featured_image = COALESCE(?, featured_image)
            WHERE id = ?
        `, [title, content, excerpt, category_id, status, featured_image, id]);

        res.json({ message: 'Пост обновлён' });
        
    } catch (error) {
        console.error('❌ Ошибка обновления поста:', error);
        res.status(500).json({ error: 'Ошибка обновления поста' });
    }
});

// УДАЛИТЬ ПОСТ
router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const [posts] = await db.query('SELECT author_id, author_type FROM posts WHERE id = ?', [id]);
        
        if (posts.length === 0) {
            return res.status(404).json({ error: 'Пост не найден' });
        }

        const post = posts[0];
        
        if (post.author_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Вы можете удалять только свои посты' });
        }

        await db.query('DELETE FROM posts WHERE id = ?', [id]);
        res.json({ message: 'Пост удалён' });
        
    } catch (error) {
        console.error('❌ Ошибка удаления поста:', error);
        res.status(500).json({ error: 'Ошибка удаления поста' });
    }
});

module.exports = router;