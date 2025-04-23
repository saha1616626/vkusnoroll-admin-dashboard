// Управление сотрудниками. Добавление или редактирование

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // useNavigate - позволяет программно изменять маршрут (навигацию) приложения, nакже позволяет передавать состояние и управлять историей переходов с помощью таких параметров, как replace (заменить текущий элемент в истории) и state (передавать дополнительные данные в маршрут). useLocation - позволяет получать доступ к объекту location, представляющему текущее местоположение (маршрут) приложения. При вызове useLocation объект включает такие свойства, как pathname, search и state.
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство.
import { IMaskInput } from 'react-imask'; // Создание маски на номер телефона

// Импорт компонентов
import api from '../../utils/api'; // API сервера
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
import ValidationErrorModal from "../Elements/ValidationErrorModal"; // Модальное окно отображения ошибок ввода при сохранении данных
import ErrorModal from "../Elements/ErrorModal"; // Модальное окно для отображения любых ошибок с кастомным заголовком
import ConfirmationModal from '../Elements/ConfirmationModal'; // Модальное окно подтверждения действия
import Loader from '../Elements/Loader'; // Анимация загрузки данных

// Импорт стилей 
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditStaff.css"; // Стили только для данной страницы

// Импорт иконок
import resetIcon from './../../assets/icons/reset.png';
import { replace } from "lodash";

const AddEditStaff = ({ mode }) => {

    /* 
    ==============================
     Константы, рефы и состояния
    ==============================
    */

    // Формат данных
    const dataFormat = {
        response: '',
        roleId: '',
        role: '',
        name: '',
        surname: '',
        patronymic: '',
        email: '',
        numberPhone: '',
        login: '',
        password: '',
        confirmPassword: '',
        isAccountTermination: false,
        isEmailConfirmed: false,
        isOrderManagementAvailable: false,
        isMessageCenterAvailable: false
    }

    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [formData, setFormData] = useState(dataFormat); // Основные данные формы
    const [initialData, setInitialData] = useState(dataFormat); // Исходные данные при загрузке страницы
    const { id } = useParams(); // Переданный id пользователя в URL запроса
    const navigate = useNavigate();

    // Состояния для модальных окон

    // Модальное окно ошибки ввода при сохранении данных
    const [validationErrors, setValidationErrors] = useState([]); // Отображение 
    const [showValidationModal, setShowValidationModal] = useState(false); // Отображение

    // Модальное окно для отображения любых ошибок с кастомным заголовком
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [titleErrorModal, setTitleErrorModal] = useState('Ошибка'); // Заголвок окна

    // Модальное окно для  подтверждения действия
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Отображение 
    const [confirmationMessage, setConfirmationMessage] = useState(''); // Ошибки

    // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации

    const [roles, setRoles] = useState([]); // Список ролей

    // Подтверждение Email
    const [showCodeInput, setShowCodeInput] = useState(false); // Поле для код из Email
    const [tempEmail, setTempEmail] = useState('');
    const [timer, setTimer] = useState(60); // Таймер
    const [isTimerActive, setIsTimerActive] = useState(false); // Запуск таймера
    const [confirmationCode, setConfirmationCode] = useState('');

    // Последнее время генерации кода
    const [lastCodeSentTime, setLastCodeSentTime] = useState(null);

    const timeOut = 500; // Задержка перед отключением анимации загрузки данных
    const [isLoading, setIsLoading] = useState(false); // Отображение анимации загрузки данных

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Загрузка начальных данных
    useEffect(() => {

        // Получаем список ролей
        const fetchRoles = async () => {
            try {
                const response = await api.getRoles();

                // Проверяем наличие данных
                if (!response.data || !Array.isArray(response.data)) { throw new Error('Invalid roles data'); }

                if (mode === 'add') {
                    response.data = response.data.filter(role => role.name !== 'Пользователь'
                        && role.name !== 'Администратор'
                    ); // Исключаем роли в режиме добавления
                } else {
                    response.data = response.data.filter(role => role.name !== 'Пользователь');
                }

                setRoles(response.data); // Устанавливаем список ролей
            } catch (error) {
                console.error('Error:', error.response ? error.response.data : error.message);
                navigate('/settings/employees', { replace: true }); // Перенаправление при ошибке
            }
        };

        fetchRoles();

        if (mode === 'edit' && id) { // Режим редактироваия данных
            const fetchStaff = async () => {
                try {
                    const response = await api.getAccountById(id);
                    const staffData = response.data;

                    // Сохраняем время последней генерации кода из серверных данных
                    if (staffData.dateTimeСodeCreation) {
                        const serverTime = new Date(staffData.dateTimeСodeCreation).getTime();
                        setLastCodeSentTime(serverTime);

                        // Рассчитываем оставшееся время до возможности запроса нового кода для подтверждения Email
                        const now = Date.now();
                        const timeDiff = now - serverTime;
                        const remaining = Math.ceil((60 * 1000 - timeDiff) / 1000);

                        if (remaining > 0) {
                            setTimer(remaining);
                            setIsTimerActive(true);
                            setShowCodeInput(true);
                        }
                    }

                    setFormData(staffData);
                    setInitialData(staffData);
                } catch (error) {
                    console.error('Error:', error.response ? error.response.data : error.message);
                    navigate('/settings/employees', { replace: true }); // Перенаправление при ошибке
                }
            };
            fetchStaff();
        }
    }, [mode, id, navigate]);

    // Проверка изменений в полях
    useEffect(() => {
        const dirty = !isEqual(formData, initialData);
        setIsDirty(dirty);
    }, [formData, initialData]); // Вызов при наличии изменений в полях или начальных данных

    // Сохраняем состояние о наличии несохраненных данных на странице
    useEffect(() => {
        sessionStorage.setItem('isDirty', isDirty.toString());
    }, [isDirty]);

    // Очистка состояния о наличии несохраненных данных при размонтировании
    useEffect(() => {
        return () => {
            sessionStorage.removeItem('isDirty');
        };
    }, []);

    // Эффект для таймера кода подтверждения
    useEffect(() => {
        let interval;
        if (isTimerActive && lastCodeSentTime) {
            interval = setInterval(() => {
                const now = Date.now();
                const timePassed = now - lastCodeSentTime;
                const remaining = Math.ceil((60 * 1000 - timePassed) / 1000);

                if (remaining > 0) {
                    setTimer(remaining);
                } else {
                    setIsTimerActive(false);
                    setTimer(60);
                    clearInterval(interval);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, lastCodeSentTime]);

    // Эффект для синхронизации статуса подтверждения
    useEffect(() => {
        if (formData.email === initialData.email) {
            setFormData(prev => ({
                ...prev,
                isEmailConfirmed: initialData.isEmailConfirmed
            }));
        }
    }, [formData.email, initialData.email, initialData.isEmailConfirmed]);

    // Обработка нажатия кнопки "Назад" в браузере
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault();
                setPendingNavigation(() => () => { //  Подтверждение перехода
                    window.history.replaceState(null, null, "/settings/employees");
                    navigate("/settings/employees", { replace: true });
                    setIsDirty(false);
                });
                setShowNavigationConfirmModal(true); // Показываем модальное окно подтверждения
            }
            else {
                navigate("/settings/employees", { replace: true }); //  Подтверждение перехода
            }
        };

        // Добавляем новую запись в историю вместо замены
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [isDirty, navigate]);

    // Блокируем закрытие и обновление страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (e) => { // Пользователь пытается покинуть страницу
            if (isDirty) { // Есть несохраненные изменения
                e.preventDefault(); // Предотвращает уход с текущей страницы
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload); // Обработчик handleBeforeUnload добавляется к объекту window всякий раз, когда пользователь пытается покинуть страницу
        return () => window.removeEventListener('beforeunload', handleBeforeUnload); // Функция очистки, которая удаляет обработчик события, когда компонент размонтируется или когда isDirty изменяется
    }, [isDirty]); // Обработчик события будет добавляться каждый раз, когда isDirty изменяется

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Обработчик изменений в полях
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target; // Изменяем определенные поля
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Валидация Email
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    // Валидация Пароля
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push('Минимум 8 символов');
        if (!/[A-Za-z]/.test(password)) errors.push('Латиница обязательна');
        if (!/[0-9]/.test(password)) errors.push('Хотя бы одна цифра');
        if (!/[!@#$%^&*]/.test(password)) errors.push('Хотя бы один спецсимвол');
        if (/[\u0400-\u04FF]/.test(password)) errors.push('Кириллица недопустима'); // Проверка на кириллицу
        return errors;
    };

    // Обработчик сохранения
    const handleSave = async () => {

        const errors = []; // Ошибки заполнения полей
        if (!formData.surname.trim()) errors.push('Фамилия');
        if (!formData.name.trim()) errors.push('Имя');
        if (!formData.email.trim()) errors.push('Email');
        if (!formData.numberPhone || formData.numberPhone.length !== 11) errors.push('Телефон');
        if (!formData.login.trim()) errors.push('Логин');
        if (mode === 'add' && !formData.password.trim()) errors.push('Пароль');
        if (mode === 'add' && formData.password.trim() !== formData.confirmPassword.trim()) errors.push('Пароли не совпадают');
        if (!formData.roleId) errors.push('Роль');

        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationModal(true);
            return;
        }

        // Валидация Email
        if (!validateEmail(formData.email)) {
            setErrorMessages(['Неверный формат email']);
            setShowErrorModal(true);
            return;
        }

        // Валидация пароля
        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            setTitleErrorModal('Пароль некорректен');
            setErrorMessages(passwordErrors);
            setShowErrorModal(true);
            return;
        }

        try {
            const payload = {
                roleId: Number(formData.roleId),
                name: formData.name.trim(),
                surname: formData.surname.trim(),
                patronymic: formData.patronymic || null,
                email: formData.email.trim(),
                numberPhone: formData.numberPhone.trim(),
                login: formData.login.trim(),
                password: formData.password.trim(),
                isAccountTermination: Boolean(formData.isAccountTermination),
                isOrderManagementAvailable: Boolean(formData.isOrderManagementAvailable),
                isMessageCenterAvailable: Boolean(formData.isMessageCenterAvailable)
            };

            const response = mode === 'add'
                ? await api.createEmploye(payload)
                : await api.updateEmploye(id, payload);

            if (response.error) {
                setErrorMessages([response.error]);
                setShowErrorModal(true);
            } else {
                if (mode === 'add') {
                    setIsLoading(true); // Включаем анимацию загрузки данных
                    navigate(`/settings/employees/edit/${response.data.id}`);
                } else {
                    navigate('/settings/employees');
                }
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка сохранения';
            setErrorMessages([message]);
            setShowErrorModal(true);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };

    // Сохранение измененной почты
    const handleSaveEmail = async () => {
        const errors = []; // Ошибки заполнения полей
        if (!formData.email) errors.push('Email');

        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationModal(true);
            return;
        }

        // Валидация Email
        if (!validateEmail(formData.email)) {
            setErrorMessages(['Неверный формат email']);
            setShowErrorModal(true);
            return;
        }

        try {
            const payload = {
                email: formData.email.trim()
            };

            const response = await api.updateEmail(id, payload);

            if (response.error) {
                setErrorMessages([response.error]);
                setShowErrorModal(true);
            } else {
                // Обновляем начальные данные
                setInitialData(prev => ({
                    ...prev,
                    email: formData.email
                }));
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка сохранения';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    }

    // Обработчик вызова модального окна для подтверждения удаления пользователя
    const handleDeleteInit = async () => {
        try {
            const response = await api.checkActiveChats(formData.id); // Проверка незавершенных чатов
            const hasActiveChats = response.data.activeChats > 0; // Кол-во незавершенных чатов

            setConfirmationMessage(
                hasActiveChats
                    ? `У сотрудника есть ${response.data.activeChats} ${getCorrectWordOne(response.data.activeChats)} ${getCorrectWordTwo(response.data.activeChats)}. После удаления они будут возвращены в центр сообщений как непринятые с сохранением истории переписки.`
                    : null
            );

            setShowDeleteConfirm(true); // Запуск модального окна
        } catch (error) {
            console.error('Ошибка проверки зависимых чатов в центре сообщений:', error);
        }
    }

    // Изменение окончания слова "незавершенный" в зависимости от кол-ва зависимостей
    const getCorrectWordOne = (count) => {
        if (count % 10 === 1 && count % 100 !== 11) {
            return "незавершенный"; // 1 (н. ч.)
        } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
            return "незавершенных"; // 2, 3, 4 (н. ч.)
        }
        return "незавершенных"; // 0, 5-9, 11-14 (н. ч.)
    };

    // Изменение окончания слова "чата" в зависимости от кол-ва зависимостей
    const getCorrectWordTwo = (count) => {
        let chatWord = 'чата'; // По умолчанию используется форма "чата"

        if (count % 10 === 1 && count % 100 !== 11) {
            chatWord = 'чат'; // 1 чат
        } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14)) {
            chatWord = 'чата'; // 2-4 чата
        } else {
            chatWord = 'чатов'; // 0, 5-9, 11-14 чатов
        }

        return `${chatWord}`; // Возвращаем полное слово
    };


    // Обработчик удаления пользователя
    const handleConfirmDelete = async () => {
        try {
            api.deleteEmployee(id); // Удаление сотрудника
            setShowDeleteConfirm(false); // Скрытие модального окна
            navigate('/settings/employees/', { replace: true });
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка удаления';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    }

    // Обработчик закрытия страницы
    const handleClose = () => { // Функция принимает аргумент forceClose, по умолчанию равный false. Аргумент позволяет при необходимости принудительно закрыть окно или перейти на другую страницу, минуя любые проверки
        if (isDirty) { // Если есть несохраненные изменения
            // Показываем модальное окно вместо confirm
            setPendingNavigation(() => () => {
                navigate('/settings/employees', { replace: true });
            });
            setShowNavigationConfirmModal(true);
            return;
        }
        navigate('/settings/employees', { replace: true }); // Возврат пользователя на предыдущую страницу с удалением маршрута
    };

    // Ввод номера телефона
    const handlePhoneChange = (value) => {
        const cleanedValue = value.replace(/\D/g, ''); // Получаем введенные данные. Убираем все пробелы
        if (cleanedValue.length <= 11) { // Не более 11 символов
            setFormData(prev => ({
                ...prev,
                numberPhone: cleanedValue?.trim() || ''
            }));
        }
    };

    // Обработчик изменения поля email
    const handleEmailChange = (e) => {
        const value = e.target.value;

        // Убираем все пробелы
        const trimmedValue = value.replace(/\s/g, ''); // Заменяем все пробелы на пустую строку

        setFormData(prev => ({
            ...prev,
            email: trimmedValue?.trim(),
            isEmailConfirmed: formData.email !== initialData.email ? false : formData.isEmailConfirmed
        }));

        // Скрываем поле для ввода код подтверждения, если email изменился
        if ((!formData.isEmailConfirmed || formData.email !== initialData.email) && mode === 'edit') {
            setShowCodeInput(false);
        }
    };

    // Обработчик отправки кода подтверждения
    const handleSendConfirmation = async () => {
        try {
            const response = await api.sendEmployeeСonfirmationСodeEmail(formData.id);
            if (response.data.success) {
                // Получаем серверное время генерации кода
                const serverTime = new Date(response.data.dateTimeСodeCreation).getTime();

                setLastCodeSentTime(serverTime);
                setShowCodeInput(true);
                setIsTimerActive(true);
                setTimer(60); // Сбрасываем таймер на полную минуту
                setTempEmail(formData.email);

                // Сохраняем в sessionStorage
                sessionStorage.setItem('lastCodeSentTime', serverTime.toString());
            }
        } catch (error) {
            setErrorMessages(['Ошибка отправки кода подтверждения']);
            setShowErrorModal(true);
        }
    };

    // Обработчик проверки кода
    const handleVerifyCode = async () => {
        try {
            const response = await api.verifyEmployeeСonfirmationСodeEmail(
                formData.id,
                confirmationCode.toString() // Преобразуем код в строку
            );
            if (response.data.success) {
                setShowCodeInput(false); // Скрываем поле для ввода кода
                setIsTimerActive(false); // Сброс таймера
                // Обновляем оба состояния
                setFormData(prev => ({ ...prev, isEmailConfirmed: true }));
                setInitialData(prev => ({ ...prev, isEmailConfirmed: true }));
            }
        } catch (error) {
            setErrorMessages([error.response?.data?.error || 'Неверный код подтверждения']);
            setShowErrorModal(true);
        }
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <main className="addEditPage-container">
            {isLoading ? <Loader isWorking={isLoading} /> : (<>
                <div className="addEditStaff-controls">
                    <h1 className="page-name">
                        {mode === 'add' ? 'Добавить сотрудника' : 'Сотрудник'}
                    </h1>

                    <div className="addEditStaff-button-group">
                        {mode === 'edit' && <button
                            className="button-control addEditStaff-delete"
                            disabled={formData.role === 'Администратор'}
                            onClick={formData.role !== 'Администратор' ? () => handleDeleteInit() : null}
                            title={formData.role === 'Администратор' ? 'Нельзя удалить учетную запись администратора' : null}
                        >
                            Удалить сотрудника
                        </button>
                        }
                        <button className="button-control close" onClick={handleClose}>Закрыть</button>
                        <button className="button-control save" onClick={handleSave}>Сохранить</button>
                    </div>
                </div>

                <div className="addEditStaff-content">
                    {/* Личные данные */}
                    <section className="addEditStaff-section">
                        <h3 className="section-title">Личные данные</h3>
                        <div className="form-column">
                            {['Имя', 'Фамилия', 'Отчество'].map((field) => (
                                <div className="form-group" key={field}>
                                    <label className="input-label">
                                        {field}{field !== 'Отчество' && '*'}
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        name={field === 'Фамилия' ? 'surname' : field === 'Имя' ? 'name' : 'patronymic'}
                                        value={formData[field === 'Фамилия' ? 'surname' : field === 'Имя' ? 'name' : 'patronymic']}
                                        onChange={handleInputChange}
                                        required={field !== 'Отчество'}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="form-column">

                            <div className="form-row" style={{ alignItems: 'center' }}>
                                <div className="form-group addEditStaff-email-group" style={{ width: '100%' }}>
                                    <label className="input-label">Email*</label>
                                    <input
                                        type="text"
                                        className={`input-field ${isTimerActive ? 'addEditStaff-email-disabled' : ''}`}
                                        name="email"
                                        value={formData.email}
                                        onChange={handleEmailChange}
                                        disabled={isTimerActive}
                                    />
                                </div>

                                {/* Подтверждение email */}
                                {((!formData.isEmailConfirmed && formData.email === initialData.email) ||
                                    formData.email !== initialData.email) &&
                                    mode === 'edit' && (
                                        <div className="addEditStaff-email-buttons">
                                            {formData.email !== initialData.email ? (
                                                <>
                                                    <button
                                                        className="button-control addEditStaff-reset-email"
                                                        onClick={() => setFormData(prev => ({
                                                            ...prev,
                                                            email: initialData.email,
                                                            isEmailConfirmed: initialData.isEmailConfirmed, // Сбрасываем статус подтверждения

                                                        }))}
                                                        title="Сбросить изменения Email"
                                                    >
                                                        <img src={resetIcon} alt="Reset" className="addEditStaff-icon-reset" />
                                                    </button>
                                                    <button
                                                        className="button-control addEditStaff-save-email"
                                                        onClick={handleSaveEmail}
                                                    >
                                                        Сохранить
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className="button-control addEditStaff-confirm"
                                                    onClick={handleSendConfirmation}
                                                    disabled={isTimerActive}
                                                >
                                                    {isTimerActive ? `${timer} сек` : 'Выслать код'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* Поле ввода кода подтверждения */}
                            {showCodeInput && (
                                <div className="addEditStaff-code-container">
                                    <div className="form-group addEditStaff-code-group">
                                        <label className="input-label">Код подтверждения</label>
                                        <input
                                            type="number"
                                            className="input-field addEditStaff-code-input"
                                            value={confirmationCode}
                                            onChange={(e) => setConfirmationCode(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="button-control addEditStaff-verify"
                                        onClick={handleVerifyCode}
                                    >
                                        Подтвердить
                                    </button>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="input-label">Телефон*</label>
                                <IMaskInput
                                    name="numberPhone"
                                    mask="+7(000)000-00-00"
                                    value={formData.numberPhone}
                                    onAccept={handlePhoneChange}
                                    className="input-field"
                                    placeholder="+7(___) ___-__-__"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Учетные данные */}
                    <section className="addEditStaff-section">
                        <h3 className="section-title">Учетные данные</h3>
                        <div className="form-column">
                            <div className="form-group">
                                <label className="input-label">Логин*</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    name="login"
                                    value={formData.login}
                                    onChange={handleInputChange}
                                    disabled={mode === 'edit' && formData.role !== 'Администратор'} // Блокирует выбор, если mode === 'add'
                                />
                            </div>
                        </div>

                        {mode === 'add' && (
                            <div className="form-column">
                                {['Пароль', 'Повтор пароля'].map((field, index) => (
                                    <div className="form-group" key={field}>
                                        <label className="input-label">{field}*</label>
                                        <input
                                            type="password"
                                            className="input-field"
                                            name={index === 0 ? 'password' : 'confirmPassword'}
                                            value={index === 0 ? formData.password : formData.confirmPassword}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Дополнительные настройки */}
                    <section className="addEditStaff-section">
                        <h3 className="section-title">Доступ</h3>

                        <div className="form-column">
                            <div className="form-group">
                                <label className="input-label">Роль*</label>
                                <select
                                    className="input-field"
                                    name="roleId"
                                    value={formData.roleId || ''}
                                    onChange={handleInputChange}
                                    disabled={mode === 'edit'} // Блокирует выбор, если mode === 'add'
                                >
                                    <option value="">Выберите роль</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-column" style={{ marginTop: '40px', display: formData.role === 'Администратор' ? 'none' : '' }}>

                                <label className="addEditStaff-checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isAccountTermination"
                                        checked={formData.isAccountTermination}
                                        onChange={handleInputChange}
                                    />
                                    <span className="addEditStaff-checkbox-caption">Ограничить доступ к учетной записи</span>
                                </label>

                                <label className="addEditStaff-checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isOrderManagementAvailable"
                                        checked={formData.isOrderManagementAvailable}
                                        onChange={handleInputChange}
                                    />
                                    <span className="addEditStaff-checkbox-caption">Управление заказами</span>
                                </label>

                                <label className="addEditStaff-checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isMessageCenterAvailable"
                                        checked={formData.isMessageCenterAvailable}
                                        onChange={handleInputChange}
                                    />
                                    <span className="addEditStaff-checkbox-caption">Доступ к центру сообщений</span>
                                </label>
                            </div>

                        </div>
                    </section>
                </div>

                {/* Модальные окна */}
                <NavigationConfirmModal
                    isOpen={showNavigationConfirmModal}
                    onConfirm={pendingNavigation}
                    onCancel={() => setShowNavigationConfirmModal(false)}
                />

                <ValidationErrorModal
                    errors={validationErrors}
                    isOpen={showValidationModal}
                    onClose={() => setShowValidationModal(false)}
                />

                <ErrorModal
                    isOpen={showErrorModal}
                    title={titleErrorModal || 'Ошибка'}
                    errors={errorMessages}
                    onClose={() => setShowErrorModal(false)}
                />

                {/* Подтверждение удаления */}
                <ConfirmationModal
                    isOpen={showDeleteConfirm}
                    title="Подтвердите удаление"
                    message={
                        confirmationMessage
                            ? `${confirmationMessage}\nВы уверены, что хотите удалить учетную запись сотрудника?`
                            : "Вы уверены, что хотите удалить учетную запись сотрудника?"
                    }
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />
            </>)}
        </main>
    );
};

export default AddEditStaff;