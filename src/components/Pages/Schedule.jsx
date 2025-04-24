// Настройка графика работы

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [initialData, setInitialData] = useState(null); // Исходные данные о списке статусов, которые были получены при загрузке страницы (Если таковые имеются)

    const [rawData, setRawData] = useState([]); // Оригинальные данные с сервера
    const [filteredData, setFilteredData] = useState([]); // Отфильтрованные данные для отображения
    const [editableData, setEditableData] = useState([]); // Данные в режиме редактирования

    const [showModal, setShowModal] = useState(false); // Отображение модального окна для редактирования и добавления
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Отображение модального окна для подтверждения удаления

    // Модальное окно для отображения ошибок: удаления и редактирования
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки

    const [restaurantWorkingTimeToDelete, setRestaurantWorkingTimeToDelete] = useState(null); // Передача объекта для удаления

    // Состояние стандартного времени работы доставки
    const [defaultTime, setDefaultTime] = useState({
        start: '10:00',
        end: '22:00'
    });

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
            setEditableData(sortedData);
            setInitialData({ ...response, data: sortedData });
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

        const formatTime = (timeString) => {

        };

        return {
            id: item.id,
            'Дата': formatDate(item.date),
            'Тип дня': item.isWorking ? 'Рабочий' : 'Выходной',
            'Время работы доставки': formatTime(item.registrationDate) || '—',
        };
    });

    // Обновление данные на странице (Иконка)
    const refreshData = async () => {
        await fetchData().then(() => {
            // Обновление данных с применением фильтров

        });
    };

    // Обработчик вызова модального окна для подтверждения удаления времени
    const handleDeleteInit = async () => {
        setShowDeleteConfirm(true); // Запуск модального окна
    }

    // Обработчик удаления рабочего времени в модальном окне
    const handleConfirmDelete = async () => {
        try {
            // TODO 
            // api.deleteRestaurantWorkingTime(); // Удаление
            setShowDeleteConfirm(false); // Скрытие модального окна
            navigate('/settings/schedule', { replace: true });
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка удаления';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    }

    // Обработчик сохранения стандартного времени
    const handleSaveDefaultTime = async () => {
        try {
            // await api.saveDefaultDeliveryTime(defaultTime);
            alert('Стандартное время сохранено!');
        } catch (error) {
            setErrorMessages(['Ошибка сохранения времени']);
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

    const handleRowClick = (rowData) => { // Обработчик клика по строке в таблице
        const originalClient = rawData.find(client => client.id === rowData.id); // Получаем исходные данные по id из выбранной строки
        if (originalClient) { // Передаем выбранный объект в модальное окно для редактирования

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
                name: 'date',
                label: 'Период'
            },
            { type: 'select', name: 'isWorking', label: 'Тип дня', options: ['Выходной', 'Рабочий'] }
        ]);
    };

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
                onCancel={() => { setShowDeleteConfirm(false); setRestaurantWorkingTimeToDelete(null); }}
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
                            value={defaultTime.start}
                            onChange={(e) => setDefaultTime({ ...defaultTime, start: e.target.value })}
                        />
                    </div>

                    <div className="schedule-time-input-group">
                        <label className="schedule-time-input-label">Окончание работы:</label>
                        <input
                            type="time"
                            className="schedule-time-input"
                            value={defaultTime.end}
                            onChange={(e) => setDefaultTime({ ...defaultTime, end: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                        <button
                            className="schedule-save-button"
                            onClick={handleSaveDefaultTime}
                        >
                            Сохранить
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default Schedule;