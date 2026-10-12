const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();


// ПОЛУЧИТЬ КОММЕНТАРИИ К ПОСТУ

router.get('/post/:postId', async (req, res) => {
    const { postId } = req.params;
    
    try {
        const [comments] = await db.query(`
            SELECT c.*, 
                   CASE 
                       WHEN c.author_type = 'user' THEN u.username
                       ELSE a.username
                   END as author_name
            FROM comments c
            LEFT JOIN users u ON c.author_type = 'user' AND c.author_id = u.id
            LEFT JOIN admins a ON c.author_type = 'admin' AND c.author_id = a.id
            WHERE c.post_id = ? AND c.status = 'approved'
            ORDER BY c.created_at ASC
        `, [postId]);
        
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения комментариев' });
    }
});


// ДОБАВИТЬ КОММЕНТАРИЙ

router.post('/post/:postId', authenticate, async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Текст комментария обязателен' });
    }
    
    try {
        const [result] = await db.query(`
            INSERT INTO comments (content, post_id, author_type, author_id, status)
            VALUES (?, ?, ?, ?, 'approved')
        `, [content, postId, req.user.type, req.user.id]);
        
        res.json({ id: result.insertId, message: 'Комментарий добавлен' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка добавления комментария' });
    }
});

//УДАЛЕНИЕ КОМЕНТАРИЕВ С ПОСТА ТОЛЬКО АДМИН ИЛИ АВТОР ПОСТА

router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    
    try {
        const [comments] = await db.query('SELECT author_id, author_type FROM comments WHERE id = ?', [id]);
        
        if (comments.length === 0) {
            return res.status(404).json({ error: 'Комментарий не найден' });
        }
        
        const comment = comments[0];
        
        if (comment.author_id !== req.user.id && req.user.type !== 'admin') {
            return res.status(403).json({ error: 'Нет прав для удаления комментария' });
        }
        
        await db.query('DELETE FROM comments WHERE id = ?', [id]);
        res.json({ message: 'Комментарий удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления комментария' });
    }
});

module.exports = router;