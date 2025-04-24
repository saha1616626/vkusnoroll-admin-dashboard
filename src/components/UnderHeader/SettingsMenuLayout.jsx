// Компонент для отображения подменю "Settings" и его дочерних страниц
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { Outlet } from "react-router-dom";

// Импорт компонентов
import SettingsMenu from "./SettingsMenu"; // Подменю настроек

const SettingsMenuLayout = () => {

    const location = useLocation(); // Получаем текущий маршрут
    const [showSettingsMenu, setShowSettingsMenu] = useState(true); // Состояние отображения меню
    const navigate = useNavigate(); // Навигация

    // Автоматическое закрытие/открытие меню при открытии страницы для редактирования или добавления
    useEffect(() => {
        // Проверяем путь с помощью регулярного выражения
        const isEditOrAddRoute = /\/settings\/.+\/(edit|new)/.test(location.pathname);
        setShowSettingsMenu(!isEditOrAddRoute);
    }, [navigate, location.pathname]);

    return (
        <div style={{ display: 'flex' }}>
            {showSettingsMenu && <SettingsMenu />}
            <div style={{
                marginLeft: showSettingsMenu ? 'calc(243px + 3em)' : 0, 
                width: showSettingsMenu ? 'calc(100% - 250px)' : '100%', 
                padding: showSettingsMenu ? '20px' : 0,
                transition: 'margin-left 0.3s ease', // Добавляем анимацию
            }}>
                <Outlet />
            </div>
        </div>
    );
};

export default SettingsMenuLayout;