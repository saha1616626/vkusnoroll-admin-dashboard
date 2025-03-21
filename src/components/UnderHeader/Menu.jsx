import React, { useState, useEffect } from "react";

// Стили
import "./../../styles/underHeaderMenu.css";

// Компоненты страниц
import Dishes from './../Pages/Dishes';


const Menu = () => {

    // Получение индекса кнопки из localStorage
    const [selectedButton, setSelectedButton] = useState(() => {
        const savedIndex = localStorage.getItem('selectedButtonUnderHeaderMenuIndex') // Получаем индекс выбранной кнопки из localStorage
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    });

    // Получение индекса выбранной кнопки
    const handleButtonClick = (buttonIndex) => {
        setSelectedButton(buttonIndex); // Установка индекса Выбранной кнопки
        localStorage.setItem('selectedButtonUnderHeaderMenuIndex', buttonIndex); // Сохранение индекса выбранной кнопки
    }

    // Названия кнопок
    const buttonLables = ['Блюда', 'Категории блюд']

    // Стилизация контейнера кнопок
    const buttonStyle = {
        display: 'flex',
        justifyContent: 'left'
    }

    // Отображение страницы при нажатии меню под шапкой
    const renderSelectComponent = () => {
        switch (selectedButton) {
            case 0:
                return <Dishes />;
            default:
                return null; // Если выбранный индекс кнопки не соответствует ни одному компоненту
        }
    }

    return (
        <div>

            <nav style={buttonStyle} className="menu">
                {buttonLables.map((label, index) => (
                    <button className="nav-under-button"
                        key={index}
                        onClick={() => handleButtonClick(index)}
                        style={{
                            backgroundColor: selectedButton === index ? 'gray' : 'transparent',
                            color: selectedButton === index ? 'white' : 'black'
                        }}>
                        {label}
                    </button>
                ))}
            </nav>

            {/* Отображение выбранного компонента страницы через кнопки меню под шапкой */}
            <div>
                {renderSelectComponent()}
            </div>

        </div>
    );
};

export default Menu;