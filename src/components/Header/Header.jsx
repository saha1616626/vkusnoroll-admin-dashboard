import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import "./../../styles/header.css";

// Импорт иконок
import userIcon from './../../assets/icons/user.png';
import settingsIcon from './../../assets/icons/settings.png';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Получаем текущий маршрут

    // Определяем активную кнопку на основе текущего пути
    const getInitialButtonIndex = () => {
        // Получение индекса кнопки из localStorage
        const savedIndex = localStorage.getItem('selectedButtonHeaderIndex');

        // Если текущий путь соответствует одному из маршрутов кнопок, то запускаем подходящий маршрут
        if (location.pathname.startsWith('/menu')) return 0;
        if (location.pathname.startsWith('/news')) return 1;
        if (location.pathname.startsWith('/sales-report')) return 2;

        // Если нет - используем сохранённое значение
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    };

    const [selectedButton, setSelectedButton] = useState(getInitialButtonIndex);

    // Автоматическая навигация при изменении кнопки
    useEffect(() => {
        const routes = ['/menu', '/news', '/sales-report']; // Все маршруты
        const targetRoute = routes[selectedButton]; // Индекс кнопки соответствует 1 маршруту

        // Навигация только если текущий путь НЕ начинается с целевого маршрута
        if (!location.pathname.startsWith(targetRoute)) {
            navigate(targetRoute);
        }
    }, [selectedButton, navigate, location.pathname]);

    // Получение индекса выбранной кнопки и навигация
    const handleButtonClick = (buttonIndex) => {
        const routes = ['/menu', '/news', '/sales-report'];
        // Обновляем состояние только если меняется выбор
        if (buttonIndex !== selectedButton) {
            setSelectedButton(buttonIndex);
            localStorage.setItem('selectedButtonHeaderIndex', buttonIndex);
        }
        navigate(routes[buttonIndex]);
    };

    // Названия кнопок
    const buttonLabels = ['Меню', 'Новости', 'Отчет по продажам'];

    return (
        <div>
            <header className="header">
                <div className="logo">ВкусноРолл.Админ</div>

                <nav style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '0', padding: '0' }}>
                    {buttonLabels.map((label, index) => (
                        <button
                            className="nav-button"
                            key={index}
                            onClick={() => handleButtonClick(index)}
                            style={{
                                backgroundColor: selectedButton === index ? 'gray' : 'transparent',
                                color: selectedButton === index ? 'white' : 'black'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="icons">
                    <img src={userIcon} alt="User" />
                    <img src={settingsIcon} alt="Settings" />
                </div>
            </header>
        </div>
    );
};

export default Header;