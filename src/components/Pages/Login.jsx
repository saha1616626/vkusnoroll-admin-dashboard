// Авторизация

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { isTokenValid } from './../../utils/auth'; // Проверка токена

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/login.css"; // Стили только для данной страницы

const Login = ({ updateAuth }) => {
    const [login, setLogin] = useState(''); // Ввод логина
    const [password, setPassword] = useState(''); // Ввод пароля
    const [error, setError] = useState(''); // Ошибки
    const navigate = useNavigate(); // Навигация

    // Авто перенаправление пользвоателя в меню, если он перешел на страницу авторизации
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (isTokenValid(token)) {
            navigate('/menu');
        }
    }, [navigate]);

    // Обработка авторизации
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.login({ login, password });
            // Сохраняем токен из куки (сервер уже установил его)
            const token = response.data.token;
            localStorage.setItem('authToken', token);
            localStorage.setItem('userRole', response.data.role); //  Роль, которую вернул сервер
            
            updateAuth(true); // Вызываем функцию обновления
            navigate('/menu');
        } catch (err) {
            setError('Неверные учетные данные'); // Вывод ошибки
        }
    };

    return (
        <div className="login-container">
            <h1 className="login-logo">ВкусноРолл.Админ</h1>
            <div className="login-form-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Вход</h2>
                    <input
                        maxLength={30}
                        type="text"
                        placeholder="Логин"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        required
                    />
                    <input
                        maxLength={100}
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button type="submit" className="login-button">Войти</button>
                    <a href="/forgot-password" className="forgot-password">Забыли пароль?</a>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default Login;