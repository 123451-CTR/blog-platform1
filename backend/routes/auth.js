const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_CODE = process.env.ADMIN_CODE || 'ADMIN2026';

// РЕГИСТРАЦИЯ ОБЫЧНОГО ПОЛЬЗОВАТЕЛЯ

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('📝 Регистрация пользователя:', { username, email });

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    try {
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO users (username, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, 'user', true]
        );

        const token = jwt.sign(
            { id: result.insertId, type: 'user', username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: result.insertId,
                username,
                email,
                type: 'user'
            }
        });
    } catch (error) {
        console.error('❌ Ошибка регистрации пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// РЕГИСТРАЦИЯ АДМИНИСТРАТОРА

router.post('/register-admin', async (req, res) => {
    const { username, email, password, full_name, adminCode } = req.body;
    
    console.log('👑 Регистрация администратора:', { username, email, adminCode });

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
    }

    if (adminCode !== ADMIN_CODE) {
        console.log('❌ Неверный код:', adminCode, 'Ожидался:', ADMIN_CODE);
        return res.status(403).json({ error: 'Неверный код регистрации администратора' });
    }

    try {
        // Проверяем, не существует ли уже такой админ
        const [existing] = await db.query(
            'SELECT id FROM admins WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'Администратор с таким email или именем уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const [result] = await db.query(
            'INSERT INTO admins (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name || username, 'super_admin']
        );

        console.log('✅ Администратор создан, ID:', result.insertId);

        const token = jwt.sign(
            { id: result.insertId, type: 'admin', username, role: 'super_admin' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: result.insertId,
                username,
                email,
                full_name: full_name || username,
                type: 'admin',
                role: 'super_admin'
            }
        });
        
    } catch (error) {
        console.error('❌ Ошибка регистрации админа:', error);
        res.status(500).json({ error: 'Ошибка сервера: ' + error.message });
    }
});

// ЛОГИН

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('🔐 Вход:', email);

    try {
        // Ищем среди пользователей
        let [users] = await db.query(
            'SELECT id, username, email, password, role, is_approved FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length > 0) {
            const user = users[0];
            
            if (user.role === 'admin' && !user.is_approved) {
                return res.status(403).json({ error: 'Аккаунт не активирован' });
            }
            
            const valid = await bcrypt.compare(password, user.password);
            if (valid) {
                const token = jwt.sign(
                    { id: user.id, type: 'user', username: user.username, role: user.role },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );
                return res.json({
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        type: 'user',
                        role: user.role
                    }
                });
            }
        }

        // Ищем среди администраторов
        let [admins] = await db.query(
            'SELECT id, username, email, password, full_name, role FROM admins WHERE email = ?',
            [email]
        );
        
        if (admins.length > 0) {
            const admin = admins[0];
            const valid = await bcrypt.compare(password, admin.password);
            if (valid) {
                const token = jwt.sign(
                    { id: admin.id, type: 'admin', username: admin.username, role: admin.role },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );
                return res.json({
                    token,
                    user: {
                        id: admin.id,
                        username: admin.username,
                        email: admin.email,
                        full_name: admin.full_name,
                        type: 'admin',
                        role: admin.role
                    }
                });
            }
        }

        res.status(401).json({ error: 'Неверный email или пароль' });
    } catch (error) {
        console.error('❌ Ошибка входа:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});


// ПОЛУЧИТЬ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ

router.get('/me', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Нет токена' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (decoded.type === 'user') {
            const [users] = await db.query(
                'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
                [decoded.id]
            );
            if (users.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
            res.json({ ...users[0], type: 'user' });
        } else {
            const [admins] = await db.query(
                'SELECT id, username, email, full_name, role, created_at FROM admins WHERE id = ?',
                [decoded.id]
            );
            if (admins.length === 0) return res.status(404).json({ error: 'Админ не найден' });
            res.json({ ...admins[0], type: 'admin' });
        }
    } catch (error) {
        console.error('❌ Ошибка проверки токена:', error);
        res.status(403).json({ error: 'Неверный токен' });
    }
});


// ВОССТАНОВЛЕНИЕ ПАРОЛЯ

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.json({ message: 'Если пользователь существует, ссылка будет отправлена' });
        }
        
        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        await db.query(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
            [email, token, expiresAt]
        );
        
        const resetLink = `http://localhost:5173/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        console.log('🔗 Ссылка для сброса пароля:', resetLink);
        
        res.json({ message: 'Ссылка для сброса пароля отправлена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { email, token, new_password } = req.body;

    if (!email || !token || !new_password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    try {
        const [resets] = await db.query(
            'SELECT * FROM password_resets WHERE email = ? AND token = ? AND used = FALSE AND expires_at > NOW()',
            [email, token]
        );
        
        if (resets.length === 0) {
            return res.status(400).json({ error: 'Неверная или просроченная ссылка' });
        }
        
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
        await db.query('UPDATE password_resets SET used = TRUE WHERE id = ?', [resets[0].id]);
        
        res.json({ message: 'Пароль успешно изменён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Нет токена' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'user') {
      const [users] = await db.query(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [decoded.id]
      );
      if (users.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
      res.json({ ...users[0], type: 'user' });
    } else {
      const [admins] = await db.query(
        'SELECT id, username, email, full_name, role, created_at FROM admins WHERE id = ?',
        [decoded.id]
      );
      if (admins.length === 0) return res.status(404).json({ error: 'Админ не найден' });
      res.json({ ...admins[0], type: 'admin' });
    }
  } catch (error) {
    res.status(403).json({ error: 'Неверный токен' });
  }
});

module.exports = router;