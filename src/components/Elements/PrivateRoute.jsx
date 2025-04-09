// Частный маршрут. В него обёрнуты все страницы маршрута, которые будут доступны после авторизации

import React from "react";
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ isAuthenticated }) => {
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" />; // Если пользователь авторизовался, то Outlet доступен
};

export default PrivateRoute;