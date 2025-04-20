// Список сотрудников

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/staff.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import FilterButton from "../Elements/FilterButton"; // Кнопка фильтра
import FilterMenu from '../Elements/FilterMenu'; // Кнопка меню фильтра
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import DropdownColumnSelection from "../Elements/DropdownColumnSelection"; // Выбор колонок для отображения таблицы
import CustomTable from "../Elements/CustomTable"; // Таблица
import Loader from '../Elements/Loader'; // Анимация загрузки данных

import api from '../../utils/api'; // API сервера

const Staff = () => {
    /* 
    ===========================
     Константы и рефы
    ===========================
    */
    const pageId = 'staff-page'; // Уникальный идентификатор страницы
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных
    const searchInputRef = React.useRef(); // Ссылка на поле поиска
    const defaultColumns = ['Имя', 'Фамилия', 'Отчество', 'Логин', 'Email', 'Номер телефона', 'Роль']; // Колонки для отображения по умолчанию
    const columnOptions = [...defaultColumns, 'Зарегистрирован', 'Заблокирован']; // Массив всех возможных колонок для отображения

    /* 
    ===========================
     Состояния
    ===========================
    */

    const navigate = useNavigate();

    // Основные данные
    const [rawData, setRawData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Фильтрация
    const [filters, setFilters] = useState([]); // Функции фильтра
    const [filterState, setFilterState] = useState({ // Управление состоянием фильтра (неактивный фильтр по умолчанию)
        isOpen: false, // Меню закрыто
        isActive: false, // Кнопка не нажата
        formData: {} // Поля фильтрации пустые
    });
    const [activeFilters, setActiveFilters] = useState({}); // Состояние полей фильтра

    // Поиск
    const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос

    // Таблица
    const [selectedColumns, setSelectedColumns] = useState(defaultColumns); // Отображаемые столбцы таблицы
    const [selectedStaffIds, setSelectedStaffIds] = useState([]);  // Массив выбранных строк в таблице

    /* 
    ===========================
     Навигация и CRUD операции
    ===========================
    */
    const handleAddClick = () => navigate('/settings/employees/new'); // Переход на страницу добавления
    const handleEditClick = (staff) => navigate(`/settings/employees/edit/${staff.id}`); // Переход на страницу редактирования
    const handleRowClick = (rowData) => { // Обработчик клика по строке в таблице
        const originalDish = rawData.find(dish => dish.id === rowData.id); // Получаем исходные данные по id из выбранной строки
        if (originalDish) handleEditClick(originalDish); // Передаем данные выбранной строки и запускаем страницу для редактирования
    };

    /* 
    ===========================
     Работа с данными
    ===========================
    */

    // Трансформация данных для представления в таблице
    const transformStaffData = (data) => data.map(staff => {

        // Функция для форматирования даты в нужный формат
        const formatRegistrationDate = (dateString) => {
            try {
                const date = new Date(dateString);

                // Проверка на валидность даты «10.04.2025 15:00»
                if (isNaN(date.getTime())) return '—';

                // Форматирование компонентов даты
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');

                return `${day}.${month}.${year} ${hours}:${minutes}`;
            } catch (e) {
                return '—'; // Возвращаем прочерк при ошибке
            }
        };

        return {
            id: staff.id,
            'Имя': staff.name,
            'Фамилия': staff.surname,
            'Отчество': staff.patronymic,
            'Логин': staff.login,
            'Email': staff.email || '—',
            'Номер телефона': staff.numberPhone || '—',
            'Роль': staff.role,
            'Зарегистрирован': formatRegistrationDate(staff.registrationDate),
            'Заблокирован': staff.isAccountTermination ? '✓' : '✗'
        };
    });

    // Универсальная функция загрузки данных из БД
    const fetchData = useCallback(async () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            const response = await api.getEmployees();
            const staff = response.data; // Получаем данные

            // Проверяем наличие данных
            if (!staff || !Array.isArray(staff)) { throw new Error('Invalid staff data') };

            setRawData(staff.sort((a, b) => b.id - a.id)); // Сохраняем необработанные данные и упорядочиваем их по убыванию идентификатора
            setTableData(transformStaffData(staff));
        } catch (error) { // Обработка ошибок axios
            console.error('Error:', error.response ? error.response.data : error.message);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut);
        }
    }, []);

    /* 
    ===========================
    Обновление данных
    ===========================
    */

    // Обновление страницы
    const refreshData = (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Сохраняем значения полей фильтра после нажатия "Enter"
            setActiveFilters(filterState.formData);
            saveFilterState({ ...filterState, formData: filterState.formData });
            const searchQuery = searchInputRef.current.search();  // Получаем текущее введенное значение из поля поиска
            setSearchQuery(searchQuery);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut); // Отключаем анимацию загрузки данных
        }
    };

    /* 
    ===========================
     Фильтрация
    ===========================
    */

    // Сохранение состояния фильтров
    const saveFilterState = (state) => {
        localStorage.setItem(`filterState_${pageId}`, JSON.stringify(state));
    };

    // Получение списка ролей
    const fetchRoles = async () => {
        try {
            const response = await api.getRoles();

            // Проверяем наличие данных
            if (!response.data || !Array.isArray(response.data)) { throw new Error('Invalid roles data'); }

            response.data = response.data.filter(role => role.name !== 'Пользователь'); // Исключаем роль

            return response.data.map(role => role.name);
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            return [];
        }
    };

    // Инициализация фильтров
    const initFilters = (roles) => {
        setFilters([
            { type: 'text', name: 'numberPhone', label: 'Телефон', placeholder: '' },
            { type: 'text', name: 'email', label: 'E-mail', placeholder: '' },
            { type: 'select', name: 'role', label: 'Роль', options: roles },
            { type: 'text', name: 'login', label: 'Логин', placeholder: '' },
            { type: 'select', name: 'isAccountTermination', label: 'Доступ', options: ['Заблокирован', 'Не заблокирован'] }
        ]);
    };

    // Фильтрация данных по выставленным параметрам фильтра
    const applyFilters = useCallback((data, filters) => {
        let result = data;

        // Фильтрация по номеру телефона
        if (filters.numberPhone && filters.numberPhone.trim()) {
            result = result.filter(staff => staff.numberPhone === filters.numberPhone.trim());
        }

        // Фильтрация по email
        if (filters.email && filters.email.trim()) {
            result = result.filter(staff => staff.email === filters.email.trim());
        }

        // Фильтрация по роли
        if (filters.role) {
            result = result.filter(staff => staff.role === filters.role);
        }

        // Фильтрация по логину
        if (filters.login && filters.login.trim()) {
            result = result.filter(staff => staff.login === filters.login.trim());
        }

        // Фильтрация по доступу к учетной записи
        if (filters.isAccountTermination) {
            const isTermination = filters.isAccountTermination === "Заблокирован" ? true : false;
            result = result.filter(staff => staff.isAccountTermination === isTermination);
        }

        return result;
    }, []);

    /* 
    ===========================
     Управление фильтрами
    ===========================
    */

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
            setSearchQuery(''); // Обнолвение значения поля поиска
            searchInputRef.current?.clear(); // Очистка поля поиска и обновление таблицы
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
            setSearchQuery('');
            searchInputRef.current?.clear();
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

    // Загружаем выбранные столбцы из localStorage
    useEffect(() => {
        const savedOptions = localStorage.getItem(`selectedOptions_${pageId}`);
        if (savedOptions) {
            setSelectedColumns(JSON.parse(savedOptions));
        }
    }, [pageId]);

    // Загрузка данных в таблицу при монтировании текущей страницы
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Загрузка ролей и инициализация фильтров
    useEffect(() => {
        const loadCategories = async () => {
            const roles = await fetchRoles();
            initFilters(roles);
            const savedState = localStorage.getItem(`filterState_${pageId}`);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                setFilterState(parsedState);
                setActiveFilters(parsedState.formData); // Восстанавливаем активные фильтры
            }
        };
        loadCategories();
    }, []);

    // Применяем фильтр и поле поиска
    useEffect(() => {
        const applyFiltersAndSearch = () => {
            let result = rawData
                .filter(staff =>
                    searchQuery
                        ? `${staff.surname} ${staff.name} ${staff.patronymic}`.toLowerCase().includes(searchQuery.toLowerCase()) // Проверяем, содержится ли searchQuery в объединенной строке
                        : true
                );

            if (Object.keys(activeFilters).length > 0) { // Применяем фильтры, только если они есть
                result = applyFilters(result, activeFilters);
            }
            return transformStaffData(result);
        };
        setTableData(applyFiltersAndSearch());
    }, [rawData, searchQuery, activeFilters, applyFilters]);

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Поиск
    const handleSearch = (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Сохраняем значения полей фильтра после нажатия "Enter"
            setActiveFilters(filterState.formData);
            saveFilterState({ ...filterState, formData: filterState.formData });

            setSearchQuery(term.trim());
        } finally {
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };

    // Выбор строки в таблице
    const handleSelectionChange = (selectedIndices) => {
        const selectedIds = selectedIndices
            .map(index => tableData[index]?.id)
            .filter(id => id !== undefined);
        setSelectedStaffIds(selectedIds);
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="page" style={{ marginTop: '35px', marginLeft: '1.5rem', marginRight: '1.5rem' }}>

            {/* Обновить страницу, название, добавить, фильтрация, поиcк, колонки */}
            <div className="control-components">

                <div className="grouping-groups-elements">
                    {/* Обновить страницу */}
                    <RefreshButton onRefresh={refreshData} title="Обновить страницу" />

                    {/* Заголовок страницы */}
                    <div className="page-name">
                        Сотрудники
                    </div>
                </div>

                <div className="grouping-groups-elements">
                    <div className="grouping-elements">

                        {/* Кнопка добавить */}
                        <button className="button-control add" onClick={handleAddClick}>
                            <img src={addIcon} alt="Update" className="icon-button" />
                            Сотрудник
                        </button>

                        {/* Кнопка фильтра */}
                        <FilterButton
                            isActive={filterState.isActive}
                            toggleFilter={toggleFilter}
                        />

                    </div>

                    {/* Поиск */}
                    <SearchInput
                        ref={searchInputRef}
                        placeholder="Поиск сотрудника по ФИО"
                        onSearch={handleSearch}
                    />

                    {/* Настройка колонок */}
                    <DropdownColumnSelection
                        options={columnOptions}
                        title="Колонки"
                        defaultSelected={defaultColumns}
                        setSelectedColumns={setSelectedColumns} // Передаем функцию для обновления выбранных колонок
                        pageId={pageId}
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

            {/* Таблица */}
            <div className="table-page">
                {isLoading ? <Loader isWorking={isLoading} /> : <CustomTable // Loader - Отображение анимации загрузки данных
                    columns={selectedColumns}
                    data={tableData}
                    onSelectionChange={handleSelectionChange}
                    onRowClick={handleRowClick}
                    tableId={pageId}
                />}
            </div>

        </div>
    );
};

export default Staff;