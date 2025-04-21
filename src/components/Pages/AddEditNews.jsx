// Управление новостями. Добавление или редактирование

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // useNavigate - позволяет программно изменять маршрут (навигацию) приложения, nакже позволяет передавать состояние и управлять историей переходов с помощью таких параметров, как replace (заменить текущий элемент в истории) и state (передавать дополнительные данные в маршрут). useLocation - позволяет получать доступ к объекту location, представляющему текущее местоположение (маршрут) приложения. При вызове useLocation объект включает такие свойства, как pathname, search и state.
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство.

// Импорт стилей
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditNews.css"; // Основной для данной страницы

// Импорт иконок
import crossIcon from './../../assets/icons/cross.png' // Крестик

// Импорт компонентов
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
import ValidationErrorModal from "../Elements/ValidationErrorModal"; // Модальное окно вывода ошибки ввода при сохранении данных
import ErrorModal from "../Elements/ErrorModal"; // Модальное окно для отображения прочих ошибок

// Импорт API
import api from '../../utils/api';

const AddEditNews = ({ mode }) => {

    /* 
===========================
Управление страницей
===========================
*/

    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [initialData, setInitialData] = useState(null); // Исходные данные о Блюде, которые были получены при загрузке страницы (Если таковые имеются)

    const { id } = useParams(); // Получаем ID только в режиме редактирования
    const navigate = useNavigate(); // Для управления маршрутом приложения

    // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации

    // Модальное окно вывода ошибки ввода при сохранении данных
    const [validationErrors, setValidationErrors] = useState([]); // Ошибки
    const [showValidationModal, setShowValidationModal] = useState(false); // Отображение    

    // Модальное окно для отображения прочих ошибок
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки

    // Обработчик для кнопки "Назад" браузера
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault();

                // Показываем модальное окно и блокируем переход
                setPendingNavigation(() => () => {
                    // При подтверждении выполняем переход
                    window.history.replaceState(null, null, "/news");
                    navigate("/news", { replace: true });
                });
                setShowNavigationConfirmModal(true);
            }
        };

        // Добавляем новую запись в историю вместо замены
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [isDirty, navigate]);

    // Обработчик отмены перехода
    const handleCancelNavigation = () => {
        // Возвращаем исходный URL при отмене перехода назад через popstate браузера
        window.history.pushState(null, null, window.location.pathname);
        setShowNavigationConfirmModal(false);
    };

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

    // Инициализация данных при монтировании текущего компонента
    useEffect(() => {

        if (mode === 'edit' && id) { // Проверка режима редактирования и наличие переданного id
            const fetchNews = async () => {
                try {

                    const response = await api.getNewsPostsById(id);
                    const news = response.data; // Получаем данные

                    // Проверяем наличие данных
                    if (!news) {
                        throw new Error('Invalid category data');
                    }

                    // Заполняем поля полученными данными
                    const formattedData = formatNewsData(news);
                    setFormData(formattedData); // Текущие значения в полях
                    setInitialData(formattedData); // Сохранение исходных данных
                    setIsDirty(false); // Изменений на странице, требующих сохранений, нет

                    // Устанавливаем видимость полей
                    setIsArchived(news.isArchived);

                } catch (error) {
                    console.error('Error:', error.response ? error.response.data : error.message);
                    navigate('/news', { replace: true }); // Перенаправление при ошибке
                }
            };

            fetchNews();
        }

        if (mode === 'add') {
            // Заполняем пустыми данными
            setFormData(formatNewsData({})); // Текущие значения в полях
            setInitialData(formatNewsData({})); // Сохранение исходных данных
        }

    }, [mode, id, navigate]); // Срабатывает при маршрутизации, изменении режима и id

    // Функция для форматирования данных новости
    const formatNewsData = (news) => {
        return {
            dateTimePublication: news.dateTimePublication || null,
            image: news.image || null,
            title: news.title || '',
            message: news.message || '',
            isArchived: !!news.isArchived
        };
    };

    // Проверка изменений, требующих сохранения
    const checkDirty = useCallback((currentData) => {
        return !isEqual(initialData, currentData); // Проверка, изменились ли данные в полях по отношению к первоначальным. Если да, то требуется сохранение изменения
    }, [initialData]);

    // Обработчик изменений в полях
    const handleInputChange = (e) => {
        const newData = { ...formData, [e.target.name]: e.target.value }; // Изменяем определенные поля
        setFormData(newData);
        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
    };

    // Блокируем закрытие страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (e) => { // Пользователь пытается покинуть страницу
            if (isDirty) { // Есть несохраненные изменения
                e.preventDefault(); // Предотвращает уход с текущей страницы
                e.returnValue = ''; // Всплывающее окно, которое предупреждает пользователя
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload); // Обработчик handleBeforeUnload добавляется к объекту window всякий раз, когда пользователь пытается покинуть страницу
        return () => window.removeEventListener('beforeunload', handleBeforeUnload); // Функция очистки, которая удаляет обработчик события, когда компонент размонтируется или когда isDirty изменяется
    }, [isDirty]); // Обработчик события будет добавляться каждый раз, когда isDirty изменяется

    // Обработчик закрытия
    const handleClose = (forceClose = false) => { // Функция принимает аргумент forceClose, по умолчанию равный false. Аргумент позволяет при необходимости принудительно закрыть окно или перейти на другую страницу, минуя любые проверки
        if (!forceClose && isDirty) { // Если есть несохраненные изменения
            // Показываем модальное окно вместо confirm
            setPendingNavigation(() => () => {
                navigate('/news', { replace: true });
            });
            setShowNavigationConfirmModal(true);
            return;
        }
        navigate('/news', { replace: true }); // Возврат пользователя на страницу categories с удалением предыдущего маршрута
    };

    // Обработчик сохранения
    const handleSave = async () => {
        try {
            const errors = []; // Ошибки заполнения

            if (!formData.title.trim() && !formData.image) errors.push('Введите заголовок или прикрепите изображение');

            if (errors.length > 0) { // Если есть ошибки, отображаем модальное окно
                setValidationErrors(errors);
                setShowValidationModal(true);
                return;
            }

            // Преобразуем данные перед отправкой
            const payload = {
                dateTimePublication: mode === 'add'
                    ? getCurrentDateTimeInMoscow()
                    : convertToMoscowDateTime(formData.dateTimePublication),
                image: formData.image ? formData.image.split(',')[1] : null, // Заменяем на null, если нет изображения
                title: formData.title.trim() || null,
                message: formData.message.trim() || null,
                isArchived: Boolean(formData.isArchived)
            };

            if (mode === 'add') {
                await api.createNewsPost(payload);
            } else {
                await api.updateNewsPost(id, payload);
            }

            // Обработка успешной операции
            setIsDirty(false); // Несохраненных изменений нет
            setInitialData(formData); // Обновляем начальные данные полей на странице, чтобы проверка наличия сохранения данных начиналась от них
            navigate('/news');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Произошла ошибка при сохранении: ' +
                (error.response?.data?.message || error.message));
        }
    }

    // Конвертация существующей даты в московское время
    const convertToMoscowDateTime = (dateTime) => {
        const date = new Date(dateTime);

        // Добавляем смещение для московского времени (UTC+6)
        const moscowOffset = 6 * 60; // минуты
        const localOffset = date.getTimezoneOffset();
        const moscowTime = new Date(date.getTime() + (localOffset + moscowOffset) * 60000);

        return formatDateToMoscowString(moscowTime);
    };

    // Общая функция форматирования даты
    const formatDateToMoscowString = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');

        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
            `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
    };

    // Получения текущей даты и времени по МСК
    const getCurrentDateTimeInMoscow = () => {
        const date = new Date();
        const moscowOffset = 6 * 60 * 60000; // MSK UTC+6 в миллисекундах
        const moscowTime = new Date(date.getTime() + (date.getTimezoneOffset() * 60000) + moscowOffset);

        return formatDateToMoscowString(moscowTime);
    };

    // Блокируем обноывление страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isDirty) {
                const confirmationMessage = 'Есть несохранённые изменения. Уйти?';
                event.returnValue = confirmationMessage; // Для старых браузеров
                return confirmationMessage; // Для современных браузеров
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    /* 
    ===========================
        Поля и прочая разметка страницы
    ===========================
    */

    const [selectedImage, setSelectedImage] = useState(null); // Выбранное изображение
    const [isArchived, setIsArchived] = useState(false); // Архив

    const [formData, setFormData] = useState({ // Инициализация полей
        dateTimePublication: null,
        image: null,
        title: '',
        message: '',
        isArchived: false
    });

    // Обработчик установки изображения на отображние при загрузке страницы
    useEffect(() => {
        if (formData?.image) { // Если изображение передано
            setSelectedImage(formData.image);
        }
    }, [formData])

    // Обработчик загрузки изображения из файлов
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // < 5 МБ
                setErrorMessages(['Файл слишком большой. Максимальный размер - 5 МБ']);
                setShowErrorModal(true);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {

                setSelectedImage(reader.result);

                const newData = { ...formData, image: reader.result }; // Обновляем изображение. Сохраняем только чистый base64
                setFormData(newData); // Фиксируем изменения
                setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
            };
            reader.readAsDataURL(file);
        }
    };

    // Убрать изображение
    const handleImageRemove = () => {
        setSelectedImage(null);

        const newData = { ...formData, image: null }; // Обновляем изображение
        setFormData(newData); // Фиксируем изменения
        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
    };

    return (
        <main className="addEditPage-container">

            <div className="control-components">

                {/* Заголовок страницы */}
                <div className="page-name">{id ? 'Редактирование новости' : 'Добавить новость'}</div>

                <div className="archive-close-save-group">
                    {/* Архивировать */}
                    <label className="archiving-object-container">
                        <input className="archiving-object-checkbox"
                            type="checkbox"
                            checked={isArchived}
                            onChange={(e) => {
                                setIsArchived(e.target.checked); // Установили новое значение чекбокса
                                if (!e.target.checked) { // Если чекбокс не нажат, то мы устанавливаем false
                                    // Фиксируем изменения
                                    const newData = { ...formData, isArchived: false };
                                    setFormData(newData);
                                    setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                }
                                else { // Если чекбокс нажат, то мы устанавливаем true
                                    const newData = { ...formData, isArchived: true };
                                    setFormData(newData);
                                    setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                }
                            }}
                        />
                        <div className="archiving-object-text">Архивировать</div>
                    </label>

                    <button className="button-control close" onClick={() => handleClose()}>Закрыть</button>
                    <button className="button-control save" type="submit" onClick={handleSave}>Сохранить</button>
                </div>

            </div>

            {/* Основное содержимое */}
            <div className="addEditNewsPage-data">

                {/* Левая часть страницы */}
                <div className="addEditNewsPage-left-column" style={{ width: '50%', paddingRight: '0px' }}>

                    <div style={{ width: '80%' }}>
                        {/* Полоска + подзаголовок */}
                        <h3 className="section-title" style={{ width: '100%' }}> </h3>

                        <div className="form-group">
                            <label className="input-label">Заголовок</label>
                            <input
                                maxLength={100}
                                type="text"
                                className="input-field"
                                style={{ width: 'auto', height: '30px' }}
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group" style={{ width: '100%' }}>
                            <label className="input-label">Сообщение</label>
                            <textarea
                                maxLength={3000}
                                className="input-field"
                                style={{ width: 'auto', height: '260px' }}
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                            <input
                                type="file"
                                id="imageUpload"
                                hidden
                                onChange={handleImageUpload}
                                accept="image/*"
                            />
                            <label
                                htmlFor="imageUpload"
                                className="button-control dish-upload-button"
                            >
                                Загрузить изображение
                            </label>
                        </div>

                    </div>

                </div>

                {/* Правая часть страницы */}
                <div className="addEditNewsPage-right-column" style={{ width: '50%' }}>
                    <div className="news-image-upload-container-AddEditNews">
                        {selectedImage && (
                            <div className="news-image-preview-wrapper">
                                <img
                                    src={selectedImage}
                                    alt="Preview"
                                    className="news-image-preview-AddEditNews"
                                />
                                <button
                                    className="news-remove-image-btn-AddEditNews"
                                    onClick={handleImageRemove}>
                                    <img src={crossIcon} alt="Remove" />
                                </button>
                            </div>
                        )}
                        {!selectedImage && (
                            <div className="image-upload-prompt-AddEditNews">
                                <span>Изображение отсутствует</span>
                                <span>Рекомендуемый размер: 1280 x 720 px (16:9)</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Модальное окно подтверждения ухода со страницы */}
            <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={pendingNavigation}
                onCancel={handleCancelNavigation}
            />

            {/* Модальное окно вывода ошибки ввода при сохранении данных */}
            <ValidationErrorModal
                errors={validationErrors}
                onClose={() => setShowValidationModal(false)}
                isOpen={showValidationModal}
            />

            {/* Модальное окно для отображения прочих ошибок */}
            <ErrorModal
                isOpen={showErrorModal}
                title="Ошибка загрузки"
                errors={errorMessages}
                onClose={() => setShowErrorModal(false)}
            />

        </main>
    );
};

export default AddEditNews;
