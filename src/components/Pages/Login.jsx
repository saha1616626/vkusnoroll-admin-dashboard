// Авторизация

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/login.css"; // Стили только для данной страницы

// Импорт иконок
import eyeIcon from './../../assets/icons/eye.png'
import hiddenEyeIcon from './../../assets/icons/hiddenEye.png'

const Login = ({ updateAuth }) => {

    /* 
    ===============================
     Состояния, константы и ссылки
    ===============================
    */

    const [login, setLogin] = useState(''); // Ввод логина
    const [password, setPassword] = useState(''); // Ввод пароля
    const [message, setMessage] = useState({
        text: '',
        type: 'error' // 'error' | 'success' 
    }); // Сообщения
    const navigate = useNavigate(); // Навигация
    const [showPassword, setShowPassword] = useState(true); // Отображение пароля

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Скрыть сообщение через несколько секунд
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage(prev => ({ ...prev, fading: true }));

                // Удаляем сообщение после завершения анимации
                setTimeout(() => {
                    setMessage({ text: '', type: 'error', fading: false });
                }, 300); // Должно совпадать с временем анимации
            }, 3000); // Общее время показа сообщения

            return () => clearTimeout(timer);
        }
    }, [message.text]);

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Обработка авторизации
    const handleSubmit = async (e) => {
        e.preventDefault(); // Отменяет действие события по умолчанию
        try {
            const response = await api.login({ login, password });
                localStorage.setItem('userRole', response.data.role); // Сохраняем роль, которую вернул сервер
                localStorage.setItem('userId', response.data.userId);
                localStorage.setItem('userName', response.data.userName); //  Сохраняем имя, которое вернул сервер

                updateAuth(true); // Вызываем функцию обновления
                navigate('/menu');
        } catch (err) {
           setMessage({ // Вывод ошибки
                text: err.response.data.error,
                type: 'error'
            });
        }
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="login-container">
            <h1 className="login-logo">ВкусноРолл.Админ</h1>
            <div className="login-form-container">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Вход</h2>

                    {message.text && (
                        <div className={`
                            login-page-form-message 
                            ${message.type} 
                            ${message.fading ? 'fade-out' : ''}
                        `}>
                            {message.text}
                        </div>
                    )}

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
                                type={!showPassword ? 'text' : 'password'}
                                maxLength={100}
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="login-toggle-password"
                                onMouseDown={() => setShowPassword(false)}
                                onMouseUp={() => setShowPassword(true)}
                                onBlur={() => setShowPassword(true)}
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