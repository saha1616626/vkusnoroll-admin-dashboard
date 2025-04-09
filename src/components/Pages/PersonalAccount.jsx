// Личный кабинет

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/personalAccount.css"; // Стили только для данной страницы

const PersonalAccount = ({ updateAuth }) => {
    const navigate = useNavigate();

    // Выход из аккаунта
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        updateAuth(false); // Передаем состояние о выходе
        navigate('/login');
    };

    return (
        <div className="account-container">
            <h2>Личный кабинет</h2>
            <button onClick={handleLogout} className="logout-button">
                Выйти
            </button>
        </div>
    );
};

export default PersonalAccount;