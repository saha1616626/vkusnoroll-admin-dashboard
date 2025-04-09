// Компонент для отображения подменю "Menu" и его дочерних страниц
import React from "react";
import Menu from "./Menu";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
    return (
        <div>
            <Menu />
            <Outlet /> {/* Здесь будут отображаться дочерние маршруты */}
        </div>
    );
};

export default MainLayout;
