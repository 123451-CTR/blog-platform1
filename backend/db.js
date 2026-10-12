const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Создаем пул соединений с MySQL
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'blog_platform',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true
});

// Проверка подключения
pool.getConnection((err, connection) => {
    if (err) {
        console.error('\x1b[31m%s\x1b[0m', '❌ ОШИБКА ПОДКЛЮЧЕНИЯ К MySQL!');
        console.error('Причина:', err.message);
        console.error('\n📌 ПРОВЕРЬТЕ:');
        console.error('   1. Запущен ли MySQL сервер (MySQL Workbench)');
        console.error('   2. Правильный ли пароль в файле .env');
        console.error('   3. Существует ли база данных blog_platform');
        console.error('\n💡 Если не хотите MySQL - используйте SQLite:');
        console.error('   npm install sqlite3');
        process.exit(1);
    } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ ПОДКЛЮЧЕНО К MYSQL!');
        console.log(`   Хост: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
        console.log(`   База: ${process.env.DB_NAME || 'blog_platform'}`);
        console.log(`   Пользователь: ${process.env.DB_USER || 'root'}`);
        connection.release();
    }
});

// Преобразуем в promise для удобства
const promisePool = pool.promise();

module.exports = promisePool;