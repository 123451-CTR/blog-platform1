const express = require('express');
const db = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Получить все категории (публично)
router.get('/', async (req, res) => {
    try {
        const [categories] = await db.query('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

// Создать категорию (только админ)
router.post('/', authenticate, requireAdmin, async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    try {
        const [result] = await db.query(
            'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
            [name, slug, description || null]
        );
        res.json({ id: result.insertId, name, slug });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ error: 'Category already exists.' });
        } else {
            res.status(500).json({ error: 'Failed to create category.' });
        }
    }
});

// Удалить категорию (только админ)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete category.' });
    }
});

module.exports = router;