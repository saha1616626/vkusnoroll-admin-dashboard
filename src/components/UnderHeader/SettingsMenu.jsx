// Меню настроек

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';

// Стили
import "./../../styles/settingsMenu.css";

// Импорт компонентов
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных

const SettingsMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации
    const [selectedButton, setSelectedButton] = useState(0); // Нажатая кнопка

    // Определение активной кнопки при загрузке
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/settings/employees')) setSelectedButton(0);
        else if (path.startsWith('/settings/users')) setSelectedButton(1);
        else if (path.startsWith('/settings/order-statuses')) setSelectedButton(2);
        else if (path.startsWith('/settings/schedule')) setSelectedButton(3);
        else if (path.startsWith('/settings/delivery')) setSelectedButton(4);
    }, [location.pathname]);

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            localStorage.removeItem('selectedSettingsButtonIndex');
        };
    }, []);

    // Навигация
    const handleNavigation = (path, buttonIndex) => {
        const checkNavigation = () => {
            navigate(path, { state: { forceReset: true } }); // forceReset - Сброс состояния страницы
            setSelectedButton(buttonIndex);
            localStorage.setItem('selectedSettingsButtonIndex', buttonIndex);
        };

        // Проверка на несохраненные изменения
        if (localStorage.getItem('isDirty') === 'true') { // На false isDirty при выходе без сохранения менять не нужно, так как компонент размонтируется и удалит состоние isDirty в localStorage
            setPendingNavigation(() => checkNavigation);
            setShowNavigationConfirmModal(true);
        } else {
            checkNavigation();
        }
    };

    // Обработчики кликов
    const buttonLabels = [
        { label: 'Сотрудники', path: 'employees' },
        { label: 'Пользователи', path: 'users' },
        { label: 'Статусы заказов', path: 'order-statuses' },
        { label: 'График работы', path: 'schedule' },
        { label: 'Доставка', path: 'delivery' }
    ];

    return (
        <div className="settings-menu-container">
            <h2 className="settings-title">Настройки</h2>
            <nav className="settings-nav">
                {buttonLabels.map((item, index) => (
                    <button
                        key={index}
                        className="settings-nav-button"
                        onClick={() => handleNavigation(`/settings/${item.path}`, index)}
                        style={{
                            backgroundColor: selectedButton === index ? '#f0f0f0' : 'transparent',
                            color: selectedButton === index ? '#333' : '#666'
                        }}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

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

export default SettingsMenu;