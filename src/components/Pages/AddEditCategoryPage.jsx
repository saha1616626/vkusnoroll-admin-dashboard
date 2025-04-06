// Управление категорией. Добавление или редактирование

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // useNavigate - позволяет программно изменять маршрут (навигацию) приложения, nакже позволяет передавать состояние и управлять историей переходов с помощью таких параметров, как replace (заменить текущий элемент в истории) и state (передавать дополнительные данные в маршрут). useLocation - позволяет получать доступ к объекту location, представляющему текущее местоположение (маршрут) приложения. При вызове useLocation объект включает такие свойства, как pathname, search и state.
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство.

// Импорт стилей
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditCategoryPage.css"; // Основной для данной страницы

// Импорт компонентов
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных

// Импорт API
import api from '../../utils/api';

const AddEditCategoryPage = ({ mode }) => {

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

    // Обработчик для кнопки "Назад" браузера
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault();

                // Показываем модальное окно и блокируем переход
                setPendingNavigation(() => () => {
                    // При подтверждении выполняем переход
                    window.history.replaceState(null, null, "/menu/categories");
                    navigate("/menu/categories", { replace: true });
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
        localStorage.setItem('isDirty', isDirty.toString());
    }, [isDirty]);

    // Очистка состояния о наличии несохраненных данных при размонтировании
    useEffect(() => {
        return () => {
            localStorage.removeItem('isDirty');
        };
    }, []);

    // Инициализация данных при монтировании текущего компонента
    useEffect(() => {

        if (mode === 'edit' && id) { // Проверка режима редактирования и наличие переданного id
            const fetchCategory = async () => {
                try {

                    const response = await api.getСategoryById(id);
                    const category = response.data; // Получаем данные

                    // Проверяем наличие данных
                    if (!category) {
                        throw new Error('Invalid category data');
                    }

                    // Заполняем поля полученными данными
                    const formattedData = formatCategoryData(category);
                    setFormData(formattedData); // Текущие значения в полях
                    setInitialData(formattedData); // Сохранение исходных данных
                    setIsDirty(false); // Изменений на странице, требующих сохранений, нет

                    // Устанавливаем видимость полей
                    setIsArchived(category.isArchived);

                } catch (error) {
                    console.error('Error:', error.response ? error.response.data : error.message);
                    navigate('/menu/categories', { replace: true }); // Перенаправление при ошибке
                }
            };

            fetchCategory();
        }

        if (mode === 'add') {
            // Заполняем пустыми данными
            setFormData(formatCategoryData({})); // Текущие значения в полях
            setInitialData(formatCategoryData({})); // Сохранение исходных данных
        }

    }, [mode, id, navigate]); // Срабатывает при маршрутизации, изменении режима и id

    // Функция для форматирования данных блюда
    const formatCategoryData = (category) => {
        return {
            name: category.name || '',
            description: category.description || '',
            isArchived: !!category.isArchived
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
                navigate('/menu/categories', { replace: true });
            });
            setShowNavigationConfirmModal(true);
            return;
        }
        navigate('/menu/categories', { replace: true }); // Возврат пользователя на страницу categories с удалением предыдущего маршрута
    };

    // Обработчик сохранения
    const handleSave = async () => {
        try {
            if (!formData.name) {
                alert('Заполните обязательные поля (помечены *)');
                return;
            }

            // Преобразуем данные перед отправкой
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                isArchived: Boolean(formData.isArchived)
            };

            if (mode === 'add') {
                await api.createСategory(payload);
            } else {
                await api.updateСategory(id, payload);
            }

            // Обработка успешной операции
            setIsDirty(false); // Несохраненных изменений нет
            setInitialData(formData); // Обновляем начальные данные полей на странице, чтобы проверка наличия сохранения данных начиналась от них
            navigate('/menu/categories');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Произошла ошибка при сохранении: ' +
                (error.response?.data?.message || error.message));
        }
    }

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

    const [isArchived, setIsArchived] = useState(false); // Архив

    const [formData, setFormData] = useState({ // Инициализация полей
        name: '',
        description: '',
        isArchived: false
    });

    return (
        <main className="addEditPage-container">

            <div className="control-components">

                {/* Заголовок страницы */}
                <div className="page-name">{id ? 'Редактирование блюда' : 'Добавить блюдо'}</div>

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
            <div className="addEditCategoryPage-data">

                {/* Левая часть страницы */}
                <div className="addEditCategoryPage-left-column" style={{ paddingRight: '20px' }}>

                    <div style={{ width: '40%' }}>
                        <h3 className="section-title" style={{ width: '100%' }}>Общие данные</h3>

                        <div className="form-group">
                            <label className="input-label">Наименование категории*</label>
                            <input
                                maxLength={50}
                                type="text"
                                className="input-field"
                                style={{ width: 'auto', height: '30px' }}
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-group" style={{ width: '70%' }}>
                            <label className="input-label">Описание</label>
                            <textarea
                                maxLength={200}
                                className="input-field"
                                style={{ width: 'auto', height: '100px' }}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                </div>

            </div>

            {/* Модальное окно подтверждения ухода со страницы */}
            <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={pendingNavigation}
                onCancel={handleCancelNavigation}
            />

        </main>
    );

};

export default AddEditCategoryPage;