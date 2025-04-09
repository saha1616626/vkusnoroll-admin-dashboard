// Авторизация

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/login.css"; // Стили только для данной страницы

const Login = ({ updateAuth }) => {
    const [login, setLogin] = useState(''); // Ввод логина
    const [password, setPassword] = useState(''); // Ввод пароля
    const [error, setError] = useState(''); // Ошибки
    const navigate = useNavigate(); // Навигация

    // Обработка авторизации
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.login({ login, password });
            localStorage.setItem('authToken', response.token); //  JWT-токен, который сгенерировал сервер
            localStorage.setItem('userRole', response.role); //  Роль, которую вернул сервер
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