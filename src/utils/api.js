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
    getCategories: () => api.get('/categories')
};

// Экспортируем объект по умолчанию
export default apiMethods;