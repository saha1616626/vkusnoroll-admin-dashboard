// Компонент для отображения подменю "Settings" и его дочерних страниц
import React from "react";
import { Outlet } from "react-router-dom";

// Импорт компонентов
import SettingsMenu from "./SettingsMenu"; // Подменю настроек

const SettingsMenuLayout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <SettingsMenu />
            <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', padding: '20px' }}>
                <Outlet />
            </div>
        </div>
    );
};

export default SettingsMenuLayout;