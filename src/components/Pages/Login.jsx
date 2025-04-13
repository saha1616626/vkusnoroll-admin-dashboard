// Авторизация

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { isTokenValid } from './../../utils/auth'; // Проверка токена

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/login.css"; // Стили только для данной страницы

// Импорт иконок
import eyeIcon from './../../assets/icons/eye.png'
import hiddenEyeIcon from './../../assets/icons/hiddenEye.png'

const Login = ({ updateAuth }) => {
    const [login, setLogin] = useState(''); // Ввод логина
    const [password, setPassword] = useState(''); // Ввод пароля
    const [error, setError] = useState(''); // Ошибки
    const navigate = useNavigate(); // Навигация

    const [showPassword, setShowPassword] = useState(false); // Отображение пароля

    // Авто перенаправление пользвоателя в меню, если он перешел на страницу авторизации
    useEffect(() => {
        const token = localStorage.getItem('authAdminToken');
        if (isTokenValid(token)) {
            navigate('/menu');
        }
    }, [navigate]);

    // Обработка авторизации
    const handleSubmit = async (e) => {
        e.preventDefault(); // Отменяет действие события по умолчанию
        try {
            const response = await api.login({ login, password });
            // Сохраняем токен из куки (сервер уже установил его)
            const token = response.data.token;
            localStorage.setItem('authAdminToken', token);
            localStorage.setItem('userRole', response.data.role); // Сохраняем роль, которую вернул сервер
            localStorage.setItem('userId', response.data.userId);
            localStorage.setItem('userName', response.data.userName); //  Сохраняем имя, которое вернул сервер

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
                    {error && <div className="login-error-message">{error}</div>}
                    <div className="login-input-group">
                        <label htmlFor="login">Логин</label>
                        <input
                            id="login"
                            maxLength={30}
                            type="text"
                            placeholder="Логин"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            required
                        />
                    </div>
                    <div className="login-input-group" style={{ marginTop: '-25px' }}>
                        <label htmlFor="password">Пароль</label>
                        <div className="login-password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                maxLength={100}
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="login-toggle-password"
                                onMouseDown={() => setShowPassword(true)}
                                onMouseUp={() => setShowPassword(false)}
                                onBlur={() => setShowPassword(false)}
                            >
                                 <img src={showPassword ? hiddenEyeIcon : eyeIcon} alt="Eye" className="icon-button" />
                            </button>
                        </div>
                    </div>
                    {/* {error && <div className="login-error-message">{error}</div>} */}
                    <button type="submit" className="login-button">Войти</button>
                    <a href="/forgot-password" className="login-forgot-password">Забыли пароль?</a>
                </form>
            </div>
        </div>
    );
};

export default Login;