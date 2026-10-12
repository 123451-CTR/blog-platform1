const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ПОЛУЧИТЬ ВСЕ ОПУБЛИКОВАННЫЕ ЖУРНАЛЫ

router.get('/', async (req, res) => {
    console.log('📖 GET /api/magazines - Запрос на получение журналов');
    
    try {
        // Простой запрос без подзапросов
        const [magazines] = await db.query(`
            SELECT id, title, slug, description, cover_image, editor_type, editor_id, status, subscribers, created_at, updated_at
            FROM magazines 
            WHERE status = 'published'
            ORDER BY created_at DESC
        `);

        console.log(`✅ Найдено журналов: ${magazines.length}`);

        // Добавляем имена редакторов и количество выпусков для каждого журнала
        for (let mag of magazines) {
            // Получаем имя редактора
            if (mag.editor_type === 'user') {
                const [user] = await db.query('SELECT username FROM users WHERE id = ?', [mag.editor_id]);
                mag.editor_name = user[0]?.username || 'Неизвестный';
            } else {
                const [admin] = await db.query('SELECT username FROM admins WHERE id = ?', [mag.editor_id]);
                mag.editor_name = admin[0]?.username || 'Неизвестный';
            }
            
            // Получаем количество выпусков
            const [countResult] = await db.query('SELECT COUNT(*) as count FROM issues WHERE magazine_id = ? AND status = "published"', [mag.id]);
            mag.issues_count = countResult[0]?.count || 0;
            
            // Получаем последний номер выпуска
            const [lastIssue] = await db.query('SELECT MAX(issue_number) as last FROM issues WHERE magazine_id = ? AND status = "published"', [mag.id]);
            mag.last_issue = lastIssue[0]?.last || null;
        }

        res.json(magazines);
        
    } catch (error) {
        console.error('❌ Ошибка GET /api/magazines:', error);
        res.status(500).json({ error: 'Ошибка получения журналов: ' + error.message });
    }
});

// ПОЛУЧИТЬ ЖУРНАЛ ПО SLUG

router.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    console.log(`📖 GET /api/magazines/${slug} - Запрос журнала`);
    
    try {
        // Получаем журнал
        const [magazines] = await db.query(
            'SELECT id, title, slug, description, cover_image, editor_type, editor_id, status, subscribers, created_at, updated_at FROM magazines WHERE slug = ? AND status = "published"',
            [slug]
        );

        if (magazines.length === 0) {
            console.log(`❌ Журнал не найден: ${slug}`);
            return res.status(404).json({ error: 'Журнал не найден' });
        }

        const magazine = magazines[0];
        
        // Получаем имя редактора
        if (magazine.editor_type === 'user') {
            const [user] = await db.query('SELECT username FROM users WHERE id = ?', [magazine.editor_id]);
            magazine.editor_name = user[0]?.username || 'Неизвестный';
        } else {
            const [admin] = await db.query('SELECT username FROM admins WHERE id = ?', [magazine.editor_id]);
            magazine.editor_name = admin[0]?.username || 'Неизвестный';
        }
        
        // Получаем все выпуски журнала
        const [issues] = await db.query(
            'SELECT id, magazine_id, issue_number, title, content, cover_image, views, created_at, updated_at FROM issues WHERE magazine_id = ? AND status = "published" ORDER BY issue_number DESC',
            [magazine.id]
        );

        magazine.issues = issues;
        
        console.log(`✅ Журнал найден: ${magazine.title}, выпусков: ${issues.length}`);
        res.json(magazine);
        
    } catch (error) {
        console.error('❌ Ошибка GET /api/magazines/:slug:', error);
        res.status(500).json({ error: 'Ошибка получения журнала: ' + error.message });
    }
});


// СОЗДАТЬ ЖУРНАЛ (только авторизованные)

router.post('/', authenticate, async (req, res) => {
    const { title, description, cover_image, status } = req.body;
    console.log('📝 POST /api/magazines - Создание журнала');
    console.log('Пользователь:', req.user);
    console.log('Данные:', { title, description, cover_image, status });

    if (!title) {
        return res.status(400).json({ error: 'Название журнала обязательно' });
    }

    // Создаем slug из названия
    const slug = title.toLowerCase()
        .replace(/[^a-zа-яё0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now();

    try {
        const [result] = await db.query(`
            INSERT INTO magazines (title, slug, description, cover_image, editor_type, editor_id, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [title, slug, description || null, cover_image || null, req.user.type, req.user.id, status || 'published']);

        console.log(`✅ Журнал создан: ${title}, ID: ${result.insertId}`);
        res.json({ id: result.insertId, slug, message: 'Журнал создан' });
        
    } catch (error) {
        console.error('❌ Ошибка POST /api/magazines:', error);
        res.status(500).json({ error: 'Ошибка создания журнала: ' + error.message });
    }
});

// ДОБАВИТЬ ВЫПУСК В ЖУРНАЛ

router.post('/:magazineId/issues', authenticate, async (req, res) => {
    const { magazineId } = req.params;
    const { issue_number, title, content, cover_image, status } = req.body;
    console.log(`📝 POST /api/magazines/${magazineId}/issues - Добавление выпуска`);
    console.log('Данные:', { issue_number, title, content });

    if (!issue_number || !content) {
        return res.status(400).json({ error: 'Номер выпуска и содержание обязательны' });
    }

    try {
        // Проверяем существование журнала
        const [magazines] = await db.query('SELECT id, editor_id, editor_type FROM magazines WHERE id = ?', [magazineId]);
        
        if (magazines.length === 0) {
            return res.status(404).json({ error: 'Журнал не найден' });
        }

        const magazine = magazines[0];
        
        // Проверяем права (только редактор или админ)
        if (magazine.editor_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Нет прав для добавления выпуска' });
        }

        // Добавляем выпуск
        const [result] = await db.query(`
            INSERT INTO issues (magazine_id, issue_number, title, content, cover_image, status, published_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [magazineId, issue_number, title || null, content, cover_image || null, status || 'published']);

        console.log(`✅ Выпуск добавлен: журнал ID ${magazineId}, выпуск №${issue_number}`);
        res.json({ id: result.insertId, message: 'Выпуск добавлен' });
        
    } catch (error) {
        console.error('❌ Ошибка POST /api/magazines/:magazineId/issues:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Выпуск с таким номером уже существует' });
        } else {
            res.status(500).json({ error: 'Ошибка добавления выпуска: ' + error.message });
        }
    }
});

// ОБНОВИТЬ ВЫПУСК

router.put('/issues/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { issue_number, title, content, cover_image, status } = req.body;

    try {
        // Проверяем права доступа
        const [issues] = await db.query(
            `SELECT i.*, m.editor_id, m.editor_type 
             FROM issues i 
             JOIN magazines m ON i.magazine_id = m.id 
             WHERE i.id = ?`,
            [id]
        );
        
        if (issues.length === 0) {
            return res.status(404).json({ error: 'Выпуск не найден' });
        }
        
        const issue = issues[0];
        
        if (issue.editor_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Нет прав для редактирования выпуска' });
        }
        
        await db.query(
            `UPDATE issues SET 
                issue_number = COALESCE(?, issue_number),
                title = COALESCE(?, title),
                content = COALESCE(?, content),
                cover_image = COALESCE(?, cover_image),
                status = COALESCE(?, status),
                updated_at = NOW()
             WHERE id = ?`,
            [issue_number, title, content, cover_image, status, id]
        );
        
        res.json({ message: 'Выпуск обновлён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления выпуска' });
    }
});


// ПОЛУЧИТЬ ВЫПУСК ПО ID

router.get('/issues/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    
    try {
        const [issues] = await db.query(
            `SELECT i.*, m.title as magazine_title, m.slug as magazine_slug
             FROM issues i 
             JOIN magazines m ON i.magazine_id = m.id 
             WHERE i.id = ?`,
            [id]
        );
        
        if (issues.length === 0) {
            return res.status(404).json({ error: 'Выпуск не найден' });
        }
        
        res.json(issues[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения выпуска' });
    }
});

module.exports = router;