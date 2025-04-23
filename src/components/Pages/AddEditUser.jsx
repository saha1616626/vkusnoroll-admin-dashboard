// Управление пользователями. Добавление или редактирование

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // useNavigate - позволяет программно изменять маршрут (навигацию) приложения, nакже позволяет передавать состояние и управлять историей переходов с помощью таких параметров, как replace (заменить текущий элемент в истории) и state (передавать дополнительные данные в маршрут). useLocation - позволяет получать доступ к объекту location, представляющему текущее местоположение (маршрут) приложения. При вызове useLocation объект включает такие свойства, как pathname, search и state.
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство.
import { IMaskInput } from 'react-imask'; // Создание маски на номер телефона

// Импорт стилей 
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditUser.css"; // Стили только для данной страницы

// Импорт компонентов
import api from '../../utils/api'; // API сервера
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
import ErrorModal from "../Elements/ErrorModal"; // Модальное окно для отображения любых ошибок с кастомным заголовком
import ConfirmationModal from '../Elements/ConfirmationModal'; // Модальное окно подтверждения действия


const AddEditUser = ({ mode }) => {

    /* 
    ==============================
     Константы, рефы и состояния
    ==============================
    */

    // Формат данных
    const dataFormat = {
        name: '',
        email: '',
        numberPhone: '',
        isAccountTermination: false,
    }

    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [formData, setFormData] = useState(dataFormat); // Основные данные формы
    const [initialData, setInitialData] = useState(dataFormat); // Исходные данные при загрузке страницы
    const { id } = useParams(); // Переданный id пользователя в URL запроса
    const navigate = useNavigate();

    // Состояния для модальных окон

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

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Загрузка начальных данных
    useEffect(() => {

        if (mode === 'edit' && id) { // Режим редактироваия данных
            const fetchUsers = async () => {
                try {
                    const response = await api.getAccountById(id);
                    const userData = response.data;

                    setFormData(userData);
                    setInitialData(userData);
                } catch (error) {
                    console.error('Error:', error.response ? error.response.data : error.message);
                    navigate('/settings/users', { replace: true }); // Перенаправление при ошибке
                }
            };
            fetchUsers();
        }
    }, [mode, id, navigate]);

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

    // Проверка изменений в полях
    useEffect(() => {
        const dirty = !isEqual(formData, initialData);
        setIsDirty(dirty);
    }, [formData, initialData]); // Вызов при наличии изменений в полях или начальных данных

    // Обработка нажатия кнопки "Назад" в браузере
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault();
                setPendingNavigation(() => () => { //  Подтверждение перехода
                    window.history.replaceState(null, null, "/settings/users");
                    navigate("/settings/users", { replace: true });
                    setIsDirty(false);
                });
                setShowNavigationConfirmModal(true); // Показываем модальное окно подтверждения
            }
            else {
                navigate("/settings/users", { replace: true }); //  Подтверждение перехода
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

    // Обработчик сохранения
    const handleSave = async () => {

        try {
            const payload = {
                isAccountTermination: Boolean(formData.isAccountTermination)
            };

            const response = await api.updateClient(id, payload);

            if (response.error) {
                setErrorMessages([response.error]);
                setShowErrorModal(true);
            } else {
                if (mode === 'edit') {
                    navigate('/settings/users');
                }
            }
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка сохранения';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    };

    // Обработчик вызова модального окна для подтверждения удаления пользователя
    const handleDeleteInit = async () => {
        setConfirmationMessage('Учетная запись пользователя, включая адреса и личную информацию, будет удалена. История заказов останется прежней.');
        setShowDeleteConfirm(true); // Запуск модального окна
    }

    // Обработчик удаления пользователя
    const handleConfirmDelete = async () => {
        try {
            api.deleteClient(formData.id); // Удаление сотрудника
            setShowDeleteConfirm(false); // Скрытие модального окна
            navigate('/settings/users', { replace: true });
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
                navigate('/settings/users', { replace: true });
            });
            setShowNavigationConfirmModal(true);
            return;
        }
        navigate('/settings/users', { replace: true }); // Возврат пользователя на предыдущую страницу с удалением маршрута
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <main className="addEditPage-container">
            <div className="addEditUser-controls">
                <h1 className="page-name">
                    Пользователь
                </h1>

                <div className="addEditUser-button-group">
                    {mode === 'edit' && <button
                        className="button-control addEditUser-delete"
                        onClick={() => handleDeleteInit()}
                    >
                        Удалить пользователя
                    </button>
                    }
                    <button className="button-control close" onClick={handleClose}>Закрыть</button>
                    <button className="button-control save" onClick={handleSave}>Сохранить</button>
                </div>
            </div>

            <div className="addEditUser-content">
                {/* Личные данные */}
                <section className="addEditUser-section">
                    <h3 className="section-title">Личные данные</h3>

                    <div className="form-column">
                        {['Имя', 'Email'].map((field) => (
                            <div className="form-group" key={field}>
                                <label className="input-label">
                                    {field}
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    name={field === 'Имя' ? 'name' : 'email'}
                                    value={formData[field === 'Имя' ? 'name' : 'email']}
                                    onChange={handleInputChange}
                                    required={field !== 'Отчество'}
                                    disabled={true}
                                />
                            </div>
                        ))}

                        <div className="form-group">
                            <label className="input-label">Телефон*</label>
                            <IMaskInput
                                name="numberPhone"
                                mask="+7(000)000-00-00"
                                value={formData.numberPhone}
                                className="input-field"
                                placeholder="+7(___) ___-__-__"
                                disabled={true}
                            />
                        </div>
                    </div>
                </section>


                {/* Дополнительные настройки */}
                <section className="addEditUser-section">
                    <h3 className="section-title">Доступ</h3>

                    <div className="form-column">
                        <label className="addEditUser-checkbox-label">
                            <input
                                type="checkbox"
                                name="isAccountTermination"
                                checked={formData.isAccountTermination}
                                onChange={handleInputChange}
                            />
                            <span className="addEditUser-checkbox-caption">Ограничить доступ к учетной записи</span>
                        </label>
                    </div>
                </section>

                 {/* Модальные окна */}
                 <NavigationConfirmModal
                    isOpen={showNavigationConfirmModal}
                    onConfirm={pendingNavigation}
                    onCancel={() => setShowNavigationConfirmModal(false)}
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
                            ? `${confirmationMessage}\nВы уверены, что хотите удалить учетную запись пользователя?`
                            : "Вы уверены, что хотите удалить учетную запись пользователя?"
                    }
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowDeleteConfirm(false)}
                />

            </div>
        </main>
    );
};

export default AddEditUser;

