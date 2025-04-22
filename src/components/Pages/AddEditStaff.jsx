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

// Импорт стилей 
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditStaff.css"; // Стили только для данной страницы

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
        isEmailConfirmed: false
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

    const [roles, setRoles] = useState([]); // Список ролей

    // Подтверждение Email
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [tempEmail, setTempEmail] = useState('');
    const [timer, setTimer] = useState(60);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [confirmationCode, setConfirmationCode] = useState('');

    /* 
    ===========================
     Работа с данными
    ===========================
    */

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
        if (isTimerActive && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsTimerActive(false);
            setTimer(60);
        }
        return () => clearInterval(interval);
    }, [isTimerActive, timer]);

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

    // Обработчик сохранения
    const handleSave = async () => {

        const errors = []; // Ошибки заполнения полей
        if (!formData.surname.trim()) errors.push('Фамилия');
        if (!formData.name.trim()) errors.push('Имя');
        if (!formData.email.trim()) errors.push('Email');
        if (!formData.numberPhone) errors.push('Телефон');
        if (!formData.login.trim()) errors.push('Логин');
        if (mode === 'add' && !formData.password.trim()) errors.push('Пароль');
        if (formData.password.trim() !== formData.confirmPassword.trim()) errors.push('Пароли не совпадают');
        if (!formData.roleId) errors.push('Роль');

        if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationModal(true);
            return;
        }

        try {
            const payload = {
                roleId: Number(formData.roleId),
                name: formData.name.trim(),
                surname: formData.surname.trim(),
                patronymic: formData.patronymic.trim() || null,
                email: formData.email.trim(),
                numberPhone: formData.numberPhone.trim(),
                login: formData.login.trim(),
                password: formData.password.trim(),
                isAccountTermination: Boolean(formData.isAccountTermination)
            };

            const response = mode === 'add'
                ? await api.createEmploye(payload)
                : await api.updateStaff(id, payload);

            if (response.error) {
                setErrorMessages([response.error]);
                setShowErrorModal(true);
            } else {
                navigate(`/settings/employees/edit/${response.data.id}`);
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка сохранения';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    };

    // Обработчик закрытия страницы
    const handleClose = () => navigate('/settings/employees');

    // Ввод номера телефона
    const handlePhoneChange = (value) => {
        const cleanedValue = value.replace(/\D/g, ''); // Получаем введенные данные. Убираем все пробелы
        if (cleanedValue.length <= 11) { // Не более 11 символов
            setFormData(prev => ({
                ...prev,
                numberPhone: cleanedValue?.trim() || null
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
            isEmailConfirmed: false
        }));

        // TODO isEmailConfirmed нужно менять, если адрес сброшен
    };

    // Обработчик отправки кода подтверждения
    const handleSendConfirmation = async () => {
        try {
            const response = await api.sendConfirmationCode(formData.email);
            if (response.success) {
                setShowCodeInput(true);
                setIsTimerActive(true);
                setTempEmail(formData.email);
            }
        } catch (error) {
            setErrorMessages(['Ошибка отправки кода подтверждения']);
            setShowErrorModal(true);
        }
    };

    // Обработчик проверки кода
    const handleVerifyCode = async () => {
        try {
            const response = await api.verifyConfirmationCode(formData.id, confirmationCode);
            if (response.success) {
                setShowCodeInput(false);
                setFormData(prev => ({ ...prev, isEmailConfirmed: true }));
            }
        } catch (error) {
            setErrorMessages(['Неверный код подтверждения']);
            setShowErrorModal(true);
        }
    };

    /* 
    ===========================
     Подтверждение Email
    ===========================
    */



    return (
        <main className="addEditPage-container">
            <div className="addEditStaff-controls">
                <h1 className="page-name">
                    {mode === 'add' ? 'Добавить сотрудника' : 'Сотрудник'}
                </h1>

                <div className="addEditStaff-button-group">
                    {mode === 'edit' && <button
                        className="button-control addEditStaff-delete"
                        disabled={formData.role === 'Администратор'}
                        onClick={formData.role !== 'Администратор' ? handleClose : null}
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
                                    className={`input-field ${showCodeInput ? 'addEditStaff-email-disabled' : ''}`}
                                    name="email"
                                    value={formData.email}
                                    onChange={handleEmailChange}
                                    disabled={showCodeInput}
                                />
                            </div>

                            {/* Подтверждение email */}
                            {((!formData.isEmailConfirmed || formData.email !== initialData.email) && mode === 'edit') && (
                                <div className="addEditStaff-email-buttons">
                                    {formData.email !== initialData.email ? (
                                        <>
                                            <button
                                                className="button-control addEditStaff-save-email"
                                            // onClick={handleSaveEmail}
                                            >
                                                Сохранить
                                            </button>
                                            <button
                                                className="button-control addEditStaff-reset-email"
                                                onClick={() => setFormData(prev => ({ ...prev, email: initialData.email }))}
                                            >
                                                Сбросить
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="button-control addEditStaff-confirm"
                                            onClick={handleSendConfirmation}
                                            disabled={isTimerActive}
                                        >
                                            {isTimerActive ? `${timer} сек` : 'Подтвердить'}
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
                                    Проверить код
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

                        <div className="form-column" style={{ marginTop: '40px' }}>

                            <label className="addEditStaff-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isAccountTermination"
                                    checked={formData.isAccountTermination}
                                    onChange={handleInputChange}
                                    disabled={formData.role === 'Администратор'}
                                />
                                <span className="addEditStaff-checkbox-caption">Доступ к учетной записи</span>
                            </label>

                            <label className="addEditStaff-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isAccountTermination"
                                    checked={formData.isAccountTermination}
                                    onChange={handleInputChange}
                                    disabled={formData.role === 'Администратор'}
                                />
                                <span className="addEditStaff-checkbox-caption">Управление заказами</span>
                            </label>

                            <label className="addEditStaff-checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isAccountTermination"
                                    checked={formData.isAccountTermination}
                                    onChange={handleInputChange}
                                    disabled={formData.role === 'Администратор'}
                                />
                                <span className="addEditStaff-checkbox-caption">Доступ к центру сообщений</span>
                            </label>
                        </div>

                    </div>
                </section>
            </div>

            {/* Модальные окна */}
            {/* <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={pendingNavigation}
                onCancel={() => setShowNavigationConfirmModal(false)}
            /> */}

            <ValidationErrorModal
                errors={validationErrors}
                isOpen={showValidationModal}
                onClose={() => setShowValidationModal(false)}
            />

            <ErrorModal
                isOpen={showErrorModal}
                title="Ошибка"
                errors={errorMessages}
                onClose={() => setShowErrorModal(false)}
            />
        </main>
    );
};

export default AddEditStaff;

