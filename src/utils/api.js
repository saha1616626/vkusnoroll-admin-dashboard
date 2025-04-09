// Интеграция с серверной частью

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

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