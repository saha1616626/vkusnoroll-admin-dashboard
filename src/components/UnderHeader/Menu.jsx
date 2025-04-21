import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

// Стили
import "./../../styles/underHeaderMenu.css";

// Импорт компонентов
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных

const Menu = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Получаем текущий маршрут

    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации

    // Определяем активную кнопку на основе текущего пути
    const getInitialButtonIndex = () => {
        // Получение индекса кнопки из localStorage
        const savedIndex = localStorage.getItem('selectedButtonUnderHeaderMenuIndex');

        // Если текущий путь соответствует одному из маршрутов кнопок, то запускаем подходящий маршрут
        if (location.pathname.startsWith('/menu/dishes')) return 0;
        if (location.pathname.startsWith('/menu/categories')) return 1;

        // Если нет - используем сохранённое значение
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    };

    const [selectedButton, setSelectedButton] = useState(getInitialButtonIndex());

    // Автоматическая навигация при изменении кнопки
    useEffect(() => {
        const routes = ['/menu/dishes', '/menu/categories']; // Все маршруты
        const targetRoute = routes[selectedButton]; // Индекс кнопки соответствует 1 маршруту

        // Навигация только если текущий путь НЕ начинается с целевого маршрута
        if (!location.pathname.startsWith(targetRoute)) {
            navigate(targetRoute);
        }
    }, [selectedButton, navigate, location.pathname]);

    // Получение индекса выбранной кнопки и навигация
    const handleButtonClick = (buttonIndex) => {

        // Проверка на несохраненные изменения
        if (sessionStorage.getItem('isDirty') === 'true') {
            // Сохраняем целевую навигацию и показываем модалку
            setPendingNavigation(() => () => { // Если пользователь подтвредит переход
                sessionStorage.setItem('isDirty', 'false');
                performNavigation(buttonIndex); // Осуществляем навигацию по меню
            });
            setShowNavigationConfirmModal(true);
            return;
        }

        // Осуществляем навигацию по меню
        performNavigation(buttonIndex);
    };

    // Навигация по меню
    const performNavigation = (buttonIndex) => {
        const routes = ['/menu/dishes', '/menu/categories'];

        // Обновляем состояние только если меняется выбор
        if (buttonIndex !== selectedButton) {
            setSelectedButton(buttonIndex);
            localStorage.setItem('selectedButtonUnderHeaderMenuIndex', buttonIndex);
        }
        navigate(routes[buttonIndex]); // Всегда переходим на страницу
    };

    // Названия кнопок
    const buttonLabels = ['Блюда', 'Категории блюд']

    // Стилизация контейнера кнопок
    const buttonStyle = {
        display: 'flex',
        justifyContent: 'left'
    }

    return (
        <div>
            <nav style={buttonStyle} className="menu">
                {buttonLabels.map((label, index) => (
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

            {/* Модальное окно подтверждения ухода со страницы */}
            <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={() => {
                    pendingNavigation?.();
                    setShowNavigationConfirmModal(false);
                }}
                onCancel={() => setShowNavigationConfirmModal(false)}
            />

        </div>
    );
};

export default Menu;