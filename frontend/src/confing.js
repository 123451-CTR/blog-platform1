// Определяем базовый URL для API
const getApiUrl = () => {
    // Локальная разработка
    return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

console.log('🔗 API URL:', API_URL);