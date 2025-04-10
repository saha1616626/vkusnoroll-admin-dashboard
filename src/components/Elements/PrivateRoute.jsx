// Частный маршрут. В него обёрнуты все страницы маршрута, которые будут доступны после авторизации

import React from "react";
import { Navigate, Outlet } from 'react-router-dom';
import { isTokenValid } from './../../utils/auth'; // Проверка токена

const PrivateRoute = ({ isAuthenticated }) => {
    const token = localStorage.getItem('authToken');
    if (!isAuthenticated || !isTokenValid(token)) {
        localStorage.removeItem('authToken');
        return <Navigate to="/login" replace />;
    }

    return <Outlet />; // Если пользователь авторизовался, то Outlet доступен
};

export default PrivateRoute;