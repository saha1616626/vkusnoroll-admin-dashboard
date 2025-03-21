import React, { useState, useEffect } from "react";

// Импорт стилей
import "./../../styles/pages.css";

// Импорт иконок
import updateIcon from './../../assets/icons/update.png';
import addIcon from './../../assets/icons/add.png'

const Dishes = () => {

    // Состяние кнопки обновления данных на странице
    const [isRotating, setIsRotating] = useState(false);

    // Кнопка обновления данных на странице
    const rebootData = () => {
        // Вращение кнопки после нажатия
        setIsRotating(true);
        setTimeout(() => {
            setIsRotating(false);
        }, 500); // Сбрасываем состояние кнопки после окончания анимации через 500 мс
    };

    return (
        <main className="page">

            {/* Обновить страницу, название, добавить, фильтрация, изменить, поиcк, архив и настройка колонок */}
            <div className="control-components">
                <button className={`button-reboot ${isRotating ? 'rotate' : ''}`}
            onClick={rebootData}>
                    <img src={updateIcon} alt="Update" className="icon" />
                    <span className="tooltip">Обновить страницу</span>
                </button>

                <div className="page-name">
                    Блюда
                </div>

                <button className="button-add">
                    <img src={addIcon} alt="Update" className="icon-button" />
                    Блюдо
                </button>

            </div>

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах