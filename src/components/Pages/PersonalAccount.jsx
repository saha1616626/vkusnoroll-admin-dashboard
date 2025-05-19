// Личный кабинет

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

// Импорт компонентов
import Loader from '../Elements/Loader';  // Анимация загрузки данных
import ConfirmationModal from '../Elements/ConfirmationModal'; // Модальное окно подтверждения

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/personalAccount.css"; // Стили только для данной страницы

const PersonalAccount = ({ updateAuth }) => {

    /* 
    ===========================
     Константы и рефы
    ===========================
    */

    const navigate = useNavigate();
    const [userData, setUserData] = useState(null); // Данные пользователя
    const [isLoading, setIsLoading] = useState(true); // Анимация загрузки данных

    const [showConfirmation, setShowConfirmation] = useState(false); // Отображение модального окна для подтверждения действия

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Получение данных авторизованного пользователя
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = localStorage.getItem('userId'); // Получение id пользователя из локального хранилища
                const response = await api.getAccountById(userId);
                setUserData(response.data);
                if(response?.data?.name) localStorage.setItem('userName', response?.data?.name); // Обновляем имя в шапке
            } catch (error) {
                console.error('Ошибка загрузки данных:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Кнопка выход. Вызов модального окна подтверждения выхода из учетной записи
    const handleActionConfirmation = () => {
        setShowConfirmation(true); // Отображаем модальное окно
    };

    // Подтверждение в модальном окне о выходе из учетной записи
    const handleConfirmAction = async () => {
        try {
            await handleLogout();
        } finally {
            setShowConfirmation(false); // После выполнения выхода закрываем модальное окно
        }
    };

    // Выход из аккаунта
    const handleLogout = () => {
        // Токен, роль, id и имя удаляется из локального хранилища
        ['authAdminToken', 'userRole', 'userId', 'userName']
            .forEach(key => localStorage.removeItem(key));
        updateAuth(false); // Передаем состояние о выходе
        navigate('/login');
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    if (isLoading) return <Loader isWorking={isLoading} />; // 

    return (
        <div className="personal-account-container">
            <div className="personal-account-header">
                <h1 className="personal-account-title">Личный кабинет</h1>
                <button
                    onClick={() => handleActionConfirmation()}
                    className="button-control personal-account-logout-button"
                >
                    Выйти
                </button>
            </div>

            <div className="personal-account-content">
                <h2 className="personal-account-subtitle">Личные данные</h2>

                <div className="personal-account-info-card">
                    <div className="personal-account-info-row">
                        <span className="personal-account-info-label">Имя:</span>
                        <span className="personal-account-info-value">{userData?.name || '—'}</span>
                    </div>

                    <div className="personal-account-info-row">
                        <span className="personal-account-info-label">Фамилия:</span>
                        <span className="personal-account-info-value">{userData?.surname || '—'}</span>
                    </div>

                    <div className="personal-account-info-row">
                        <span className="personal-account-info-label">Отчество:</span>
                        <span className="personal-account-info-value">{userData?.patronymic || '—'}</span>
                    </div>

                    <div className="personal-account-info-row">
                        <span className="personal-account-info-label">Email:</span>
                        <span className="personal-account-info-value">{userData?.email || '—'}</span>
                    </div>

                    <div className="personal-account-info-row">
                        <span className="personal-account-info-label">Телефон:</span>
                        <span className="personal-account-info-value">
                            {userData?.numberPhone || '—'}
                        </span>
                    </div>

                    <div className="personal-account-info-row">
                        <span className="personal-account-info-label">Системная роль:</span>
                        <span className="personal-account-info-value">{userData?.role || '—'}</span>
                    </div>
                </div>
            </div>

            {/* Модальное окно подтверждения действия */}
            <ConfirmationModal
                isOpen={showConfirmation}
                title={'Вы уверены, что хотите выйти из своей учётной записи?'}
                message={'Подтвердите действие'}
                onConfirm={handleConfirmAction}
                onCancel={() => setShowConfirmation(false)}
            />

        </div>
    );
};

export default PersonalAccount;