import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import "./../../styles/header.css";

// Импорт иконок
import userIcon from './../../assets/icons/user.png';
import settingsIcon from './../../assets/icons/settings.png';

// Импорт компонентов
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Получаем текущий маршрут

    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации
    const [selectedButton, setSelectedButton] = useState(0);

    // Данные об авторизованном пользователе
    const [userData, setUserData] = useState({
        name: localStorage.getItem('userName') || '',
        role: localStorage.getItem('userRole') || ''
    });

    // Инициализация при рендере компонента
    useEffect(() => {
        // Если текущий путь не соответствует ни одному из маршрутов
        if (
            !location.pathname.startsWith('/menu') &&
            !location.pathname.startsWith('/news') &&
            !location.pathname.startsWith('/sales-report') &&
            !location.pathname.startsWith('/personal-account') &&
            !location.pathname.startsWith('/settings')
        ) {
            navigate('/menu'); // Перенаправляем на маршрут по умолчанию
        }
    }, [navigate, location.pathname]);

    // Определение активной кнопки при загрузке и изменении маршрута
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/menu')) setSelectedButton(0);
        else if (path.startsWith('/news')) setSelectedButton(1);
        else if (path.startsWith('/sales-report')) setSelectedButton(2);
        else if (path.startsWith('/personal-account')) setSelectedButton(null); // Снимаем выделение кнопки
        else if (path.startsWith('/settings')) setSelectedButton(null);
    }, [location.pathname]);

    // Очистка localStorage при размонтировании
    useEffect(() => {
        return () => {
            localStorage.removeItem('selectedButtonHeaderIndex'); // Хеадер
            localStorage.removeItem('selectedButtonUnderHeaderMenuIndex'); // Подменю (Блюда, категории)
        };
    }, []);

    // Навигация
    const handleNavigation = (path, shouldUpdateButton) => {
        const checkNavigation = () => {
            navigate(path);
            if (shouldUpdateButton) {
                const index = ['/menu', '/news', '/sales-report'].indexOf(path);
                setSelectedButton(index);
                localStorage.setItem('selectedButtonHeaderIndex', index);
            }
            else { //  Если нажата кнопка с маршрутом "/personal-account" или "/settings", сбрасываем выделение кнопки
                setSelectedButton(null);
                localStorage.setItem('selectedButtonHeaderIndex', selectedButton);
            }
        };

        // Проверка на несохраненные изменения
        if (sessionStorage.getItem('isDirty') === 'true') { // На false isDirty при выходе без сохранения менять не нужно, так как компонент размонтируется и удалит состоние isDirty в localStorage
            setPendingNavigation(() => checkNavigation);
            setShowNavigationConfirmModal(true);
        } else {
            checkNavigation();
        }
    };

    // Обработчики кликов
    const handleLogoClick = () => handleNavigation('/menu', true);
    const handleUserClick = () => handleNavigation('/personal-account', false);
    const handleSettingsClick = () => handleNavigation('/settings', false);
    const handleMenuButton = (index) =>
        handleNavigation(['/menu', '/news', '/sales-report'][index], true);

    return (
        <div>
            <header className="header">
                <div
                    className="logo"
                    onClick={handleLogoClick}
                    style={{ cursor: 'pointer' }}
                >
                    ВкусноРолл.Админ
                </div>

                <nav style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '0', padding: '0' }}>
                    {['Меню', 'Новости', 'Отчет по продажам'].map((label, index) => (
                        <button
                            className="nav-button"
                            key={index}
                            onClick={() => handleMenuButton(index)}
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
                    <div className="user-details-Headers">
                        <span className="user-name-Header">{userData.name}</span>
                        <span className="user-role-Header">{userData.role}</span>
                    </div>
                    <img
                        src={userIcon}
                        alt="User"
                        onClick={handleUserClick}
                        style={{ cursor: 'pointer' }}
                    />
                    <img
                        src={settingsIcon}
                        alt="Settings"
                        onClick={handleSettingsClick}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            </header>

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

export default Header;