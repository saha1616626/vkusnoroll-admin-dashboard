// Настройка графика работы

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/schedule.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'
import deleteIcon from './../../assets/icons/delete.png'
import timeIcon from './../../assets/icons/time.png'

// Импорт компонентов
import api from '../../utils/api'; // API сервера
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import ConfirmationModal from '../Elements/ConfirmationModal'; // Окно для подтверждения удаления
import ErrorModal from "../Elements/ErrorModal"; //Модальное окно для отображения ошибок
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
import Loader from '../Elements/Loader'; // Анимация загрузки данных
import FilterButton from "../Elements/FilterButton"; // Кнопка фильтра
import FilterMenu from '../Elements/FilterMenu'; // Кнопка меню фильтра
import CustomTable from "../Elements/CustomTable"; // Таблица

const Schedule = () => {

    /* 
    ===========================
     Константы и рефы
    ===========================
    */

    const pageId = 'schedule-page'; // Уникальный идентификатор страницы
    const navigate = useNavigate(); // Для управления маршрутом приложения
    const location = useLocation();
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных

    /* 
    ===========================
     Состояния
    ===========================
    */

    const [isLoading, setIsLoading] = useState(true); // Анимация загрузки данных

    const [rawData, setRawData] = useState([]); // Оригинальные данные с сервера
    const [filteredData, setFilteredData] = useState([]); // Отфильтрованные данные для отображения

    const [showModal, setShowModal] = useState(false); // Отображение модального окна для редактирования и добавления
    const [editingSchedule, setEditingSchedule] = useState(null); // Передача элемента для редактирования
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Отображение модального окна для подтверждения удаления

    // Модальное окно для отображения ошибок: удаления и редактирования
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки

    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [defaultTime, setDefaultTime] = useState({ start: '', end: '' }); // Состояние стандартного времени работы доставки
    const [initialData, setInitialData] = useState({ start: '', end: '' }); // Исходные данные, которые были получены при загрузке страницы (Если таковые имеются)

    // Фильтрация
    const [filters, setFilters] = useState([]); // Функции фильтра
    const [filterState, setFilterState] = useState({ // Управление состоянием фильтра (неактивный фильтр по умолчанию)
        isOpen: false, // Меню закрыто
        isActive: false, // Кнопка не нажата
        formData: {} // Поля фильтрации пустые
    });
    const [activeFilters, setActiveFilters] = useState({}); // Состояние полей фильтра

    // Таблица
    const columnOptions = ['Дата', 'Тип дня', 'Время работы доставки']; // Массив всех возможных колонок для отображения
    const [selectedSchedulesIds, setSelectedSchedulesIds] = useState([]);  // Массив выбранных строк в таблице

    /* 
    ===========================
     Управление данными
    ===========================
    */

    // Функция загрузки данных из БД
    const fetchData = useCallback(async () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            const response = await api.getListRestaurantWorkingTime();
            const sortedData = response.data;

            setRawData(sortedData);
            setFilteredData(transformData(sortedData));
        } catch (error) {
            console.error('Ошибка загрузки статусов:', error);
        } finally { // Выключаем анимацию загрузки данных
            setTimeout(() => setIsLoading(false), timeOut);
        }
    }, []);

    // Трансформация данных для представления в таблице
    const transformData = (data) => data.map(item => {

        // Функция для форматирования даты в нужный формат
        const formatDate = (dateString) => {
            try {
                const date = new Date(dateString);

                // Проверка на валидность даты «10.04.2025 15:00»
                if (isNaN(date.getTime())) return '—';

                // Форматирование компонентов даты
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();

                return `${day}.${month}.${year}`;
            } catch (e) {
                return '—'; // Возвращаем прочерк при ошибке
            }
        };

        const formatTime = (startTime, endTime) => {
            if (!startTime || !endTime) return '—';

            const formatSingleTime = (timeString) => {
                try {
                    return timeString.split(':').slice(0, 2).join(':'); // Убираем миллисекунды
                } catch (e) {
                    return '—';
                }
            };

            return `${formatSingleTime(startTime)} – ${formatSingleTime(endTime)}`;
        };

        return {
            id: item.id,
            'Дата': formatDate(item.date),
            'Тип дня': item.isWorking ? 'Рабочий' : 'Выходной',
            'Время работы доставки': formatTime(item.startDeliveryWorkTime, item.endDeliveryWorkTime)
        };
    });

    // Обновление данные на странице (Иконка)
    const refreshData = async () => {
        await fetchData().then(() => {
            // Обновление данных с применением фильтров
            try {
                // Сохраняем значения полей фильтра
                setActiveFilters(filterState.formData);
                saveFilterState({ ...filterState, formData: filterState.formData });
            } catch (error) {
                console.error('Refresh error:', error);
            }
        });
    };

    // Обработчик вызова модального окна для подтверждения удаления времени
    const handleDeleteInit = async () => {
        if (selectedSchedulesIds && selectedSchedulesIds.length > 0) {
            setShowDeleteConfirm(true); // Запуск модального окна
        }
    }

    // Обработчик удаления рабочего времени в модальном окне
    const handleConfirmDelete = async () => {
        try {
            // TODO 
            api.deleteRestaurantWorkingTime(selectedSchedulesIds); // Удаление
            setShowDeleteConfirm(false); // Скрытие модального окна
            navigate('/settings/schedule', { replace: true }); // Перезагрузка страницы с обновлением данных
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка удаления';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    }

    // Обработчик сохранения стандартного времени
    const handleSaveDefaultTime = async () => {
        try {
            await api.updateDefaultWorkingTime(defaultTime);
            setInitialData(defaultTime);
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка сохранения времени';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    };

    /* 
    ===========================
     Управление таблицей
    ===========================
    */

    // Выбор строк(и) в таблице
    const handleSelectionChange = (selectedIndices) => {
        const selectedIds = selectedIndices
            .map(index => filteredData[index]?.id)
            .filter(id => id !== undefined);
        setSelectedSchedulesIds(selectedIds);
    };

    // Обработчик клика по строке таблицы
    const handleRowClick = (rowData) => { // Обработчик клика по строке в таблице
        const original = rawData.find(item => item.id === rowData.id);
        if (original) {
            setEditingSchedule(original); // Передача элемента для редактирования
            setShowModal(true); // Запуск модального окна
        }
    };


    /* 
    ===========================
     Управление фильтрами
    ===========================
    */

    // Сохранение состояния фильтров
    const saveFilterState = (state) => {
        localStorage.setItem(`filterState_${pageId}`, JSON.stringify(state));
    };

    const initFilters = (roles) => {
        setFilters([
            {
                type: 'date-range-no-time',
                name: 'simpleDate',
                label: 'Период'
            },
            { type: 'select', name: 'isWorking', label: 'Тип дня', options: ['Выходной', 'Рабочий'] }
        ]);
    };

    // Фильтрация данных по выставленным параметрам фильтра
    const applyFilters = useCallback((data, filters) => {
        let result = data;

        // Применяем фильтры, только стоят две даты
        if (filters.simpleDate?.start && filters.simpleDate?.end) {
            result = result.filter(news => {
                const postDate = new Date(news.date); // Преобразование в дату
                const startDate = new Date(filters.simpleDate.start);
                const endDate = new Date(filters.simpleDate.end);

                return postDate >= startDate && postDate <= endDate; // Отбираем значения, которые входят в диапазон
            });
        }

        // Применяем фильтры, только стоит start дата
        if (filters.simpleDate?.start) {
            result = result.filter(news => {
                const postDate = new Date(news.date); // Преобразование в дату
                const startDate = new Date(filters.simpleDate.start);

                return postDate >= startDate; // Отбираем значения, которые входят в диапазон
            });
        }

        // Применяем фильтры, только стоит end дата
        if (filters.simpleDate?.end) {
            result = result.filter(news => {
                const postDate = new Date(news.date); // Преобразование в дату
                const endDate = new Date(filters.simpleDate.end);

                return postDate <= endDate; // Отбираем значения, которые входят в диапазон
            });
        }

        // Фильтрация по типу дня
        if (filters.isWorking) {
            const isWorking = filters.isWorking === "Рабочий" ? true : false;
            result = result.filter(client => client.isWorking === isWorking);
        }

        return result;
    }, []);

    // Кнопка закрыть/открыть меню фильтра
    const toggleFilter = () => {
        setFilterState(prev => { // Обновление состояния фильтра
            const newState = {
                ...prev,
                isOpen: !prev.isOpen, // Управление меню
                isActive: !prev.isActive // Управление кнопкой
            };
            saveFilterState(newState); // Сохраняем состояние фильтра в localStorage
            return newState;
        });
    };

    // Обновление данных формы фильтров (Введенные значения в поля)
    const handleFilterFormUpdate = (name, value) => {
        setFilterState(prev => ({
            ...prev,
            formData: { ...prev.formData, [name]: value }
        }));
    };

    // Кнопка "Поиск" в фильтре
    const handleFilterSearch = () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Сохраняем значения полей фильтра
            setActiveFilters(filterState.formData);
            saveFilterState({ ...filterState, formData: filterState.formData });
        } catch (error) {
            console.error('Filter search error:', error);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };

    // Кнопка "Очистка" в фильтре
    const handleFilterReset = () => {
        setIsLoading(true);
        try {
            setFilterState(prev => ({
                ...prev,
                formData: {}
            }));
            setActiveFilters({});
            saveFilterState({
                isOpen: true,
                isActive: true,
                formData: {}
            });
        } catch (error) {
            console.error('Filter reset error:', error);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };


    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Загрузка данных в таблицу при монтировании текущей страницы
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Хук useEffect для обработки переходов на текущую страницу.
    // Этот эффект срабатывает каждый раз, когда меняется ключ местоположения (location.key), 
    // что происходит при переходах внутри навигационного меню, даже если пользователь остается на том же URL.
    // Это особенно важно при удалении сотрудника, так как данные на странице будут корректно обновляться
    useEffect(() => {
        // Обновляем данные на странице
        fetchData();
    }, [location.key, fetchData]); // location.key меняется при каждом переходе (даже на тот же URL)

    // Инициализация фильтров
    useEffect(() => {
        const loadCategories = async () => {
            initFilters();
            const savedState = localStorage.getItem(`filterState_${pageId}`);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                setFilterState(parsedState);
                setActiveFilters(parsedState.formData); // Восстанавливаем активные фильтры
            }
        };
        loadCategories();
    }, []);

    // Загрузка стандартного времени
    useEffect(() => {
        const loadDefaultTime = async () => {
            try {
                const response = await api.getDefaultWorkingTime();
                //  Проверка ответа
                if (response.data?.start && response.data?.end) {
                    // Устанавливаем оба состояния атомарно
                    const serverData = {
                        start: response.data.start.slice(0, 5) || '', // Обрезаем секунды если есть
                        end: response.data.end.slice(0, 5) || ''
                    };
                    setDefaultTime(serverData);
                    setInitialData(serverData);
                }
            } catch (error) {
                console.error('Ошибка загрузки стандартного времени:', error);
                setErrorMessages(['Не удалось загрузить настройки времени']);
                setShowErrorModal(true);
            }
        };
        loadDefaultTime();
    }, []);

    // Проверка изменений во временном интервале
    useEffect(() => {
        if (defaultTime && initialData) {
            const dirty = !isEqual(defaultTime, initialData);
            setIsDirty(dirty);
        } else {
            setIsDirty(false); // Пока данные не загружены - кнопка неактивна
        }
    }, [defaultTime, initialData]); // Вызов при наличии изменений в полях или начальных данных

    // Применяем фильтр
    useEffect(() => {
        const applyFiltersData = () => {
            let result = rawData;

            if (Object.keys(activeFilters).length > 0) { // Применяем фильтры, только если они есть
                result = applyFilters(result, activeFilters);
            }
            return transformData(result);
        };
        setFilteredData(applyFiltersData());
    }, [rawData, activeFilters, applyFilters]);

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="page" style={{ marginTop: '35px', marginLeft: '1.5rem', marginRight: '1.5rem' }}>

            <div className="control-components schedule-controls">
                <div className="grouping-groups-elements">
                    {/* Обновить страницу */}
                    <RefreshButton title="Обновить страницу" onRefresh={refreshData} />

                    {/* Заголовок страницы */}
                    <div className="page-name">
                        График работы
                    </div>
                </div>

                <div className="grouping-elements">
                    {/* Кнопка добавить */}
                    <button className="button-control add"
                        onClick={() => setShowModal(true)}>
                        <img src={addIcon} alt="Update" className="icon-button" />
                        Расписание
                    </button>

                    {/* Кнопка удалить */}
                    <button className="button-control add"
                        onClick={() => handleDeleteInit()}>
                        <img src={deleteIcon} alt="Delete" className="icon-button" />
                        Удалить
                    </button>

                    {/* Кнопка фильтра */}
                    <FilterButton
                        isActive={filterState.isActive}
                        toggleFilter={toggleFilter}
                    />
                </div>
            </div>

            {/* Меню фильтра */}
            <div className="page-filter">
                <FilterMenu
                    isOpen={filterState.isOpen}
                    filters={filters}
                    formData={filterState.formData}
                    onFormUpdate={handleFilterFormUpdate}
                    onSearch={handleFilterSearch}
                    onReset={handleFilterReset}
                />
            </div>

            {/* Подтверждение удаления */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                title="Подтвердите удаление"
                message="Вы уверены, что хотите удалить выбранный статус?"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setShowDeleteConfirm(false); }}
            />

            <div className="schedule-column-group">
                {/* Левая секция - таблица */}
                <div>
                    {isLoading ? <Loader isWorking={isLoading} /> : <CustomTable // Отображение анимации загрузки при загрузке данных
                        columns={columnOptions}
                        data={filteredData}
                        onSelectionChange={handleSelectionChange}
                        onRowClick={handleRowClick}
                        tableId={pageId}
                        centeredColumns={['Дата', 'Тип дня', 'Время работы доставки']}  // Cписок центрируемых колонок
                    />}
                </div>

                {/* Правая секция - стандартное время */}
                <div className="schedule-standard-time">
                    <div className="schedule-standard-time-header" style={{ lineHeight: '24px' }}>
                        <img src={timeIcon} alt="Время" style={{ width: '24px', verticalAlign: 'middle', marginRight: '10px' }} />
                        Стандартный интервал доставки
                    </div>


                    <div className="schedule-time-input-group">
                        <label className="schedule-time-input-label">Начало работы:</label>
                        <input
                            type="time"
                            className="schedule-time-input"
                            value={defaultTime.start || ''}
                            onChange={(e) => setDefaultTime({ ...defaultTime, start: e.target.value })}
                        />
                    </div>

                    <div className="schedule-time-input-group">
                        <label className="schedule-time-input-label">Окончание работы:</label>
                        <input
                            type="time"
                            className="schedule-time-input"
                            value={defaultTime.end || ''}
                            onChange={(e) => setDefaultTime({ ...defaultTime, end: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                        <button
                            className={`schedule-save-button ${isDirty ? 'active' : ''}`}
                            onClick={handleSaveDefaultTime}
                            disabled={!isDirty}
                        >
                            {isDirty ? 'Сохранить' : 'Сохранено'}
                        </button>
                    </div>

                </div>
            </div>

            {/* Модальное окно для отображения ошибок: удаления и редактирования */}
            <ErrorModal
                isOpen={showErrorModal}
                title="Ошибка"
                errors={errorMessages}
                onClose={() => { setShowErrorModal(false); setErrorMessages(null) }}
            />

            {/* Модальное окно добавления и редактирования */}
            {showModal && (
                <DeliveryWorkModal
                    schedule={editingSchedule}
                    onClose={() => {
                        setShowModal(false);
                        setEditingSchedule(null);
                    }}
                    onSave={fetchData}
                />
            )}

        </div>
    );
};

// Компонент модального окна
const DeliveryWorkModal = ({ schedule, onClose, onSave }) => {

    /* 
    ===========================
     Состояния
    ===========================
    */

    const [showFormDisplay, setShowFormDisplay] = useState(true); // Отображение модальноего окна    const [showFormDisplay, setShowFormDisplay] = useState(true); // Отображение модальноего окна

    // Формат данных
    const dataFormat = {
        date: '',
        isWorking: true,
        startTime: '',
        endTime: ''
    };

    const [formData, setFormData] = useState(dataFormat);
    const [initialFormData, setInitialFormData] = useState(dataFormat); // Начальные данные формы
    const [isDirty, setIsDirty] = useState(false); // Наличие несохраненных данных

    // Модальное окно для отображения ошибок: удаления и редактирования
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки

    // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации

    const [isClosingAnimation, setIsClosingAnimation] = useState(false); // Анимация закрытия модального окна

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Загрузка данных при редактировании
    useEffect(() => {
        if (schedule) {
            // Используем локальный часовой пояс для корректного отображения
            const date = new Date(schedule.date);
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
                .toISOString()
                .split('T')[0];

            const initialData = {
                date: localDate,
                isWorking: schedule.isWorking,
                startTime: schedule.startDeliveryWorkTime?.slice(0, 5) || '',
                endTime: schedule.endDeliveryWorkTime?.slice(0, 5) || ''
            };
            setFormData(initialData);
            setInitialFormData(initialData);
        }
    }, [schedule]);

    // Проверка изменений в полях
    useEffect(() => {
        const dirty = !isEqual(formData, initialFormData);
        setIsDirty(dirty);
    }, [formData, initialFormData]); // Вызов при наличии изменений в полях или начальных данных

    // Управление отображением модального окна формы, когда пользователь пытается совершить навигацию без сохранения изменений
    useEffect(() => {
        if (showNavigationConfirmModal) {
            setShowFormDisplay(false); // При открытом модальном окне форма добавления/редактирования скрыта
        }
        else {
            setShowFormDisplay(true);
        }
    }, [showNavigationConfirmModal]);

    // Управление отображением модального окна формы, когда пользователь пытается сохранить 2 статуса с положительным финалом
    useEffect(() => {
        if (showErrorModal) {
            setShowFormDisplay(false); // При открытом модальном окне форма добавления/редактирования скрыта
        }
        else {
            setShowFormDisplay(true);
        }
    }, [showErrorModal]);

    // Блокировка закрытия страницы
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Обработка нажатия кнопки "Назад" в браузере
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault(); // Блокируем переход, если есть несохраненные изменения
                setPendingNavigation(() => () => {
                    handleConfirmNavigation(); // Вызываем функцию подтверждения перехода
                });
                setShowNavigationConfirmModal(true); // Показываем модальное окно подтверждения
            }
            else {
                handleConfirmNavigation();
            }
        };

        const handleConfirmNavigation = () => {
            onClose(); // Вызываем функцию подтверждения перехода
            setIsDirty(false); // Сбрасываем флаг после успешного сохранения
        };

        // Добавляем новую запись в историю для корректного отслеживания переходов
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [isDirty, onClose]);

    // Блокируем обновление страницы, если есть несохраненные данные
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

    // Убираем скролл с перекрытой страницы при запуске модального окна
    useEffect(() => {
        document.body.classList.add('no-scroll');
        return () => document.body.classList.remove('no-scroll');
    }, [onClose]);

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Сохранить новый или обновить статус заказа
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                date: new Date(formData.date).toISOString(),
                isWorking: formData.isWorking,
                startDeliveryWorkTime: formData.isWorking ? formData.startTime : null,
                endDeliveryWorkTime: formData.isWorking ? formData.endTime : null
            };

            if (schedule) {
                await api.updateRestaurantWorkingTime(schedule.id, data);
            } else {
                await api.createRestaurantWorkingTime(data);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            setErrorMessages([error.response?.data?.error || 'Ошибка сохранения']);
            setShowErrorModal(true);
        }
    };

    // Обработчик отмены перехода на другую страницу через модальное окно
    const handleCancelNavigation = () => {
        // Возвращаем исходный URL при отмене перехода назад через popstate браузера
        window.history.pushState(null, null, window.location.pathname);
        setShowNavigationConfirmModal(false);
    };

    // Обработчик закрытия через кнопку "Закрыть"
    const handleClose = () => {
        if (isDirty) {
            // Показываем модальное окно вместо confirm
            setPendingNavigation(() => () => {
                setShowNavigationConfirmModal(false);
                onClose();
            });
            setShowNavigationConfirmModal(true);
        } else {

            setIsClosingAnimation(true);
            setTimeout(() => {
                onClose(); // Закрытие модального окна
                setIsClosingAnimation(false);
            }, 300); // Длительность анимации

        }
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <>
            {/* Отображение формы */}
            {showFormDisplay && <><div className={`schedule-modal-overlay ${isClosingAnimation ? 'closing' : ''}`}>
                <div className="schedule-modal">
                    <form onSubmit={handleSubmit}>
                        <div className="schedule-modal-header">
                            {schedule ? 'Редактирование расписания' : 'Новое расписание'}
                        </div>

                        {/* Поле выбора даты */}
                        <div className="schedule-modal-field-group">
                            <label>Дата</label>
                            <input
                                type="date"
                                className="schedule-modal-input"
                                value={formData.date || ''}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>

                        {/* Чекбокс рабочего дня */}
                        <div className="schedule-modal-checkbox">
                            <input
                                type="checkbox"
                                checked={formData.isWorking}
                                onChange={(e) => setFormData({ ...formData, isWorking: e.target.checked })}
                            />
                            <label>Рабочий день</label>
                        </div>

                        {/* Поля времени */}
                        {formData.isWorking && (
                            <div className="schedule-modal-time-group">
                                <div className="schedule-modal-field-group">
                                    <label>Начало работы</label>
                                    <input
                                        className="schedule-modal-input"
                                        type="time"
                                        value={formData.startTime || ''}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="schedule-modal-field-group">
                                    <label>Окончание работы</label>
                                    <input
                                        className="schedule-modal-input"
                                        type="time"
                                        value={formData.endTime || ''}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="schedule-modal-actions">
                            <button type="button" className="button-control close" onClick={() => handleClose()}>
                                Отмена
                            </button>
                            <button type="submit" className="button-control save">
                                Сохранить
                            </button>
                        </div>
                    </form>
                </div>
            </div>  </>}
            {/* Модальное окно для отображения ошибок: удаления и редактирования */}
            <ErrorModal
                isOpen={showErrorModal}
                title="Ошибка"
                errors={errorMessages}
                onClose={() => { setShowErrorModal(false); setErrorMessages(null) }}
            />

            {/* Модальное окно подтверждения ухода со страницы */}
            <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={pendingNavigation}
                onCancel={handleCancelNavigation}
            />
        </>
    );
};

export default Schedule;