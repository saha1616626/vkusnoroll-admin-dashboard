// Интеграция с серверной частью

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true
});

// Интерсепторы Axios

// Обработка ответов и автоматическая переаутентификация
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Удаляются только пользовательские данные
            ['userRole', 'userId', 'userName'].forEach(key =>
                localStorage.removeItem(key)
            );

            if (window.location.pathname !== '/login') {  // Редирект только если не на целевой странице
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
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
    checkAuth: () => api.get('/auth/check'), // Проверка аутентификации 

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
    getClientsPaginationFilters: (params) => api.get('/accounts/clients/filters', { params }), // Получение списка пользователей с пагинацией и фильтрами
    updateClient: (id, data) => api.put(`/accounts/clients/${id}`, data),
    deleteClient: (id) => api.delete(`/accounts/clients/${id}`),

    sendCodeAdministratorRecoveryPassword: (email) =>
        api.post(`/accounts/administrator/send-code-recovery`, { email: email.toString() }), // Отправка кода подтверждения для восстановления пароля к учетной записи
    checkingCodeResettingPassword: (id, code) =>
        api.post(`/accounts/user/${id}/verify-code`, { code: code.toString() }), // Проверка кода подтверждения, отправленного на email при восстановлении пароля
    changingPassword: (id, password) =>
        api.put(`/accounts/user/${id}/changing-password`, { password: password }), // Смена пароля

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
    getDefaultWorkingTime: () => api.get('/deliveryWork/default-time'),
    updateDefaultWorkingTime: (data) => api.post(`/deliveryWork/default-time`, data),

    // Настройки доставки ресторана
    getSettings: () => api.get('/deliverySettings'), // Получить все настройки доставки
    saveSettings: (data) => api.post('/deliverySettings', data), // Обновить все настройки доставки

    // Заказы
    getOrders: (params) => api.get('/orders/manager/all', { params }), // Получение всех заказов с пагинацией
    getDishSalesReport: (params) => api.get('/orders/report/dish', { params }),  // Получить отчёт по продажам блюд с пагинацией, группировкой и фильтрами
    getOrdersReport: (params) => api.get('/orders/report/order', { params }), // Получить отчёт по заказам с пагинацией и статистикой
    generateReport: (reportMode, params) => api.get(`/orders/reports/generation/${reportMode}`, { params, responseType: 'arraybuffer' }), // Генерация отчета


};

// Экспортируем объект по умолчанию
export default apiMethods;