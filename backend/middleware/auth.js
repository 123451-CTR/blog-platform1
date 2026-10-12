const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Общая аутентификация (и пользователи, и админы)
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, type, username, role? }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
};

// Проверка, что пользователь - администратор
const requireAdmin = (req, res, next) => {
    if (req.user.type !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
    }
    next();
};

// Проверка, что пользователь - обычный пользователь
const requireUser = (req, res, next) => {
    if (req.user.type !== 'user') {
        return res.status(403).json({ error: 'User access required.' });
    }
    next();
};

module.exports = { authenticate, requireAdmin, requireUser };