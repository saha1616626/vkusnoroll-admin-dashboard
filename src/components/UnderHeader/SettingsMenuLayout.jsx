// Компонент для отображения подменю "Settings" и его дочерних страниц
import React from "react";
import { Outlet } from "react-router-dom";

// Импорт компонентов
import SettingsMenu from "./SettingsMenu"; // Подменю настроек

const SettingsMenuLayout = () => {
    return (
        <div>
            <SettingsMenu />
            <Outlet /> {/* Здесь будут отображаться дочерние маршруты */}
        </div>
    );
};

export default SettingsMenuLayout;