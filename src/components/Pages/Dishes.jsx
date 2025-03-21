import React, { useState, useEffect } from "react";

// Импорт стилей
import "./../../styles/pages.css";

// Импорт иконок
import updateIcon from './../../assets/icons/update.png';
import addIcon from './../../assets/icons/add.png'

const Dishes = () => {

    return (
        <main className="page">

            {/* Обновить страницу, название, добавить, фильтрация, изменить, поиcк, архив и настройка колонок */}
            <div className="control-components">
                <button>
                    <img src={updateIcon} alt="Update" className="icon" />
                </button>

                <div className="page-name">
                    Блюда
                </div>

                <button className="control-button">
                    <img src={addIcon} alt="Update" className="icon-button" />
                    Блюдо
                </button>

            </div>

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах