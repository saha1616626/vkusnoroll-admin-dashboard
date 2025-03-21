import React, { useState, useEffect } from "react";
import "./../../styles/header.css";

// Импорт иконок
import userIcon from './../../assets/icons/user.png';
import settingsIcon from './../../assets/icons/settings.png';

// Дополнительные компоненты
import Menu from './../UnderHeader/Menu';

const Header = () => {

    const [selectedButton, setSelectedButton] = useState(() => {
        const savedIndex = localStorage.getItem('selectedButtonHeaderIndex'); // Получаем индекс выбранной кнопки из localStorage
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    });

    const handleButtonClick = (buttonIndex) => {
        setSelectedButton(buttonIndex); // Установка индекса Выбранной кнопки
        localStorage.setItem('selectedButtonHeaderIndex', buttonIndex); // Сохранение индекса выбранной кнопки
    }

    // Названия кнопок
    const buttonLables = ['Меню', 'Новости', 'Отчет по продажам'];

    // Стилизация контейнера кнопок
    const buttonStyle = {
        display: 'flex',
        gap: '10px',
        justifyContent: 'center',
        margin: '0',
        padding: '0'
    }

    // Отображение меню или страницы при выборе кнопки в навигационном меню
    const renderSelectComponent = () => {
        switch (selectedButton) {
            case 0:
                return <Menu />;
            default:
                return null; // Если выбранный индекс кнопки не соответствует ни одному компоненту
        }
    }

    return (
        <div>

            <header className="header">
                {/* Логотип */}
                <div className="logo">
                    ВкусноРолл.Админ
                </div>

                <nav style={buttonStyle}>
                    {buttonLables.map((label, index) => (
                        <button className="nav-button"
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

                {/* Кнопки иконки */}
                <div className="icons">
                    <img src={userIcon} alt="User" />
                    <img src={settingsIcon} alt="Settings" />
                </div>
            </header>

            {/* Отображение выбранного компонента через кнопки в шапке */}
            <div>
                {renderSelectComponent()}
            </div>

        </div>
    );
};

export default Header;