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
    const token = localStorage.getItem('authAdminToken'); // Извлекается токен аутентификации из локального хранилища браузера
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
            // Токен, роль, id и имя удаляется из локального хранилища
            ['authAdminToken', 'userRole', 'userId', 'userName']
                .forEach(key => localStorage.removeItem(key));
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
    login: (credentials) => api.post('/auth/admin/login', credentials), // Вход
    logout: () => api.post('/auth/admin/logout'), // Выход

    // Роли
    getRoles: () => api.get('/roles'),

    // Учетные записи
    getAccountById: (id) => api.get(`/accounts/user/${id}`), // Пользователь
    updateEmail: (id, data) => api.put(`/accounts/user/${id}`, data),
    getEmployees: () => api.get('/accounts/employees'), // Сотрудники
    createEmploye: (data) => api.post('/accounts/employees', data),
    updateEmploye: (id, data) => api.put(`/accounts/employees/${id}`, data),
    checkActiveChats: (id) => api.get(`/accounts/employees/${id}/active-chats`), // Наличие открытых чатов
    deleteEmployee: (id) => api.delete(`/accounts/employees/${id}`),
    getClients: () => api.get('/accounts/clients'), // Клиенты
    updateClient: (id, data) => api.put(`/accounts/clients/${id}`, data),
    deleteClient: (id) => api.delete(`/accounts/clients/${id}`),

    // Статусы заказов
    getOrderStatuses: () => api.get('/orderStatuses'),
    getOrderStatusById: (id) => api.get(`/orderStatuses/${id}`), // Пользователь
    createOrderStatus: (data) => api.post('/orderStatuses', data),
    updateOrderStatus: (id, data) => api.put(`/orderStatuses/${id}`, data),
    deleteOrderStatus: (id) => api.delete(`/orderStatuses/${id}`).then(res => res.data)
        .catch(error => {
            if (error.response.status === 409) { // Статус используется в заказах
                return error.response.data;
            }
            throw error;
        }),
    updateOrderStatusesSequence: (sequence) => api.put('/orderStatuses/sequence', { sequence }),

    // Подтверждение почты администратором
    sendEmployeeСonfirmationСodeEmail: (id) => api.post(`/accounts/employees/${id}/send-code`), // Отправка кода подтверждения на Email
    verifyEmployeeСonfirmationСodeEmail: (id, code) =>
        api.post(`/accounts/employees/${id}/verify-code`, { code: code.toString() }), // Проверка кода подтверждения

    // Рабочее время ресторана
    getListRestaurantWorkingTime: () => api.get('/deliveryWork'),
    createRestaurantWorkingTime: (data) => api.post('/deliveryWork', data),
    deleteRestaurantWorkingTime: (ids) => api.delete('/deliveryWork', { data: { ids } }), // Удаление
    updateRestaurantWorkingTime: (id, data) => api.put(`/deliveryWork/${id}`, data),

};

// Экспортируем объект по умолчанию
export default apiMethods;