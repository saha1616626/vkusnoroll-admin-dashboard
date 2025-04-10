// Интеграция с серверной частью

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Интерсепторы Axios

// Автоматическая отправка токена авторизации в заголовки каждого исходящего HTTP-запроса
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken'); // Извлекается токен аутентификации из локального хранилища браузера
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // Если токен существует, он добавляется в заголовок Authorization с типом Bearer
    }
    return config;
});

// Обработка ответов и автоматическая переаутентификация
api.interceptors.response.use(
    response => response, // Если запрос успешный (т.е. сервер вернул ответ с кодом состояния 2xx), то просто возвращаем ответ
    error => {
        if (error.response?.status === 401) { // Токен недействителен или отсутствует
            localStorage.removeItem('authToken'); // Токен удаляется из локального хранилища
            window.location.href = '/login'; // Переход на страницу входа
        }
        return Promise.reject(error); // Возвращает ошибку для дальнейшей обработки в компонентах
    }
);

const apiMethods = {
    // Блюда
    getDishes: () => api.get('/dishes'),
    getDishById: (id) => api.get(`/dishes/${id}`),
    createDish: (data) => api.post('/dishes', data),
    updateDish: (id, data) => api.put(`/dishes/${id}`, data),
    deleteDishes: (ids) => api.delete('/dishes', { data: { ids } }), // Удаление блюд
    archiveDishes: (ids, archive) => api.put('/dishes', { ids, archive }), // Архивация и разархивация блюд

    // Категории
    getCategories: () => api.get('/categories'),
    getСategoryById: (id) => api.get(`/categories/${id}`),
    createСategory: (data) => api.post('/categories', data),
    updateСategory: (id, data) => api.put(`/categories/${id}`, data),
    deleteCategories: (ids) => api.delete('/categories', { data: { ids } }), // Удаление категорий
    archiveCategories: (ids, archive) => api.put('/categories', { ids, archive }), // Архивация и разархивация категорий

    // Новостные посты
    getNewsPosts: () => api.get('/newsPosts'),
    getNewsPostsById: (id) => api.get(`/newsPosts/${id}`),
    createNewsPost: (data) => api.post('/newsPosts', data),
    updateNewsPost: (id, data) => api.put(`/newsPosts/${id}`, data),
    deleteNewsPosts: (ids) => api.delete('/newsPosts', { data: { ids } }), // Удаление
    archiveNewsPosts: (ids, archive) => api.put('/newsPosts', { ids, archive }), // Архивация и разархивация

    // Авторизация и выход
    login: (credentials) => api.post('/auth/login', credentials), // Вход
    logout: () => api.post('/auth/logout'), // Выход
};

// Экспортируем объект по умолчанию
export default apiMethods;