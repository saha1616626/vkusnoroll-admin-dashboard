// Список пользователей

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/users.css"; // Стили только для данной страницы

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import FilterButton from "../Elements/FilterButton"; // Кнопка фильтра
import FilterMenu from '../Elements/FilterMenu'; // Кнопка меню фильтра
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import DropdownColumnSelection from "../Elements/DropdownColumnSelection"; // Выбор колонок для отображения таблицы
import CustomTable from "../Elements/CustomTable"; // Таблица
import Loader from '../Elements/Loader'; // Анимация загрузки данных
import PaginationBar from '../Elements/PaginationBar';  // Панель разбиения контента на страницы
import api from '../../utils/api'; // API сервера

const Users = () => {

    /* 
    ===============================
     Состояния, константы и ссылки
    ===============================
    */

    const pageId = 'users-page'; // Уникальный идентификатор страницы
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных
    const searchInputRef = React.useRef(); // Очистка поля поиска

    const defaultColumns = ['Имя', 'Email', 'Номер телефона']; // Колонки для отображения по умолчанию
    const columnOptions = [...defaultColumns, 'Зарегистрирован', 'Заблокирован']; // Массив всех возможных колонок для отображения

    // Управление пагинацией
    const [currentPage, setCurrentPage] = useState(0); // Текущая страница
    const [totalNumberItems, setTotalNumberItems] = useState(0); // Общее количество записей
    const itemsPerPage = 15; // Кол-во элементов в списке на отображение

    /* 
    ===========================
     Состояния
    ===========================
    */

    const navigate = useNavigate();
    const location = useLocation();

    // Основные данные
    const [rawData, setRawData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Фильтрация
    const [isFiltersInitialized, setIsFiltersInitialized] = useState(false); // Отслеживание инициализации фильтров
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
    const [selectedUsersIds, setSelectedUsersIds] = useState([]);  // Массив выбранных строк в таблице

    /* 
    ===========================
     Навигация и CRUD операции
    ===========================
    */

    const handleEditClick = (client) => navigate(`/settings/users/edit/${client.id}`); // Переход на страницу редактирования
    const handleRowClick = (rowData) => { // Обработчик клика по строке в таблице
        const originalClient = rawData.find(client => client.id === rowData.id); // Получаем исходные данные по id из выбранной строки
        if (originalClient) handleEditClick(originalClient); // Передаем данные выбранной строки и запускаем страницу для редактирования
    };

    /* 
    ===========================
     Работа с данными
    ===========================
    */

    // Трансформация данных для представления в таблице
    const transformClientsData = (data) => data.map(client => {

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
            id: client.id,
            'Имя': client.name,
            'Фамилия': client.surname,
            'Отчество': client.patronymic,
            'Логин': client.login,
            'Email': client.email || '—',
            'Номер телефона': client.numberPhone || '—',
            'Роль': client.role,
            'Зарегистрирован': formatRegistrationDate(client.registrationDate),
            'Заблокирован': client.isAccountTermination ? '✓' : '✗'
        };
    });

    // Универсальная функция загрузки данных из БД
    const fetchData = useCallback(async () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        if (isFiltersInitialized) { // Проверка, что фильтры инициализировались
            try {
                // Параметры запроса
                const params = {
                    page: currentPage + 1,
                    limit: itemsPerPage,
                    ...activeFilters // Все активные фильтры
                };

                const response = await api.getClientsPaginationFilters(params);

                // Проверяем наличие данных
                if (response.data) {
                    const client = response.data.data; // Получаем данные
                    const total = Number(response.data.total) || 0; // Гарантированное число записей
                    setTotalNumberItems(total); // Общее количество записей
                    setRawData(client.sort((a, b) => b.id - a.id)); // Сохраняем необработанные данные и упорядочиваем их по убыванию идентификатора
                    setTableData(transformClientsData(client));
                }
            } catch (error) { // Обработка ошибок axios
                console.error('Error:', error.response ? error.response.data : error.message);
            } finally {
                setTimeout(() => setIsLoading(false), timeOut);
            }
        }
    }, [currentPage, activeFilters, isFiltersInitialized]);

    /* 
    ===========================
    Обновление данных
    ===========================
    */

    // Обновление страницы
    const refreshData = async (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Формируем параметры фильтра
            const serverFilters = { ...filterState.formData };

            serverFilters.numberPhone = filterState.formData.numberPhone;
            serverFilters.name = filterState.formData.name;
            serverFilters.isAccountTermination = filterState.formData.isAccountTermination;
            serverFilters.search = searchInputRef.current.search(); // Устанавливаем значение поиска

            // Создаем копию serverFilters БЕЗ поля search для filterState
            const { search, ...formDataWithoutSearch } = serverFilters;

            // Сохраняем новые фильтры в filterState (без search)
            const newFilterState = {
                ...filterState,
                formData: formDataWithoutSearch
            };

            // Сохраняем в localStorage
            saveFilterState(newFilterState);

            // Обновляем состояние filterState (без search)
            setFilterState(prev => ({
                ...prev,
                formData: formDataWithoutSearch
            }));

            // Сохраняем значения полей фильтра
            setActiveFilters(serverFilters);
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

    // Конфигурация фильтра
    const initFilters = (roles) => {
        setFilters([
            { type: 'text', name: 'numberPhone', label: 'Телефон', placeholder: '' },
            { type: 'text', name: 'name', label: 'Имя', placeholder: '' },
            { type: 'select', name: 'isAccountTermination', label: 'Доступ', options: ['Заблокирован', 'Не заблокирован'] }
        ]);
    };

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
            // Нормализуем данные перед отправкой
            const serverFilters = {
                numberPhone: filterState.formData.numberPhone,
                name: filterState.formData.name,
                isAccountTermination: filterState.formData.isAccountTermination,
            };

            setCurrentPage(0); // Сброс номера страницы списка пагинации
            searchInputRef.current?.clear(); // Очистка поля поиска

            // Сохраняем значения полей фильтра
            setActiveFilters(serverFilters);
            saveFilterState({ ...filterState, formData: serverFilters });
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
            searchInputRef.current?.clear(); // Очистка поля поиска
            setCurrentPage(0); // Сброс номера страницы списка пагинации

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

    // Загружаем выбранные столбцы из localStorage
    useEffect(() => {
        const savedOptions = localStorage.getItem(`selectedOptions_${pageId}`);
        if (savedOptions) {
            setSelectedColumns(JSON.parse(savedOptions));
        }
    }, [pageId]);

    // Загрузка данных в таблицу при монтировании текущей страницы
    useEffect(() => {
        // Обновляем данные на странице
        fetchData();
    }, [location.key, fetchData]);

    // Инициализация фильтров
    useEffect(() => {
        const loadFilters = async () => {
            // Очищаем предыдущие фильтры
            setFilters([]);
            setFilterState({ isOpen: false, isActive: false, formData: {} });
            initFilters();

            const savedStateRaw = localStorage.getItem(`filterState_${pageId}`);
            const savedState = savedStateRaw ? JSON.parse(savedStateRaw) : null;

            // Если нет сохраненного состояния фильтра, то сбрасываем
            const defaultState = {
                isOpen: false,
                isActive: false,
                formData: {}
            };

            setFilterState(savedState || defaultState);
            setActiveFilters(savedState?.formData || defaultState.formData);

            setIsFiltersInitialized(true); // Фильтры инициализировались
        };
        loadFilters();
    }, []);

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Поле поиска
    const handleSearch = (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Формируем параметры фильтра
            const serverFilters = { ...filterState.formData };

            serverFilters.numberPhone = filterState.formData.numberPhone;
            serverFilters.name = filterState.formData.name;
            serverFilters.isAccountTermination = filterState.formData.isAccountTermination;
            serverFilters.search = searchInputRef.current.search(); // Устанавливаем значение поиска

            // Создаем копию serverFilters БЕЗ поля search для filterState
            const { search, ...formDataWithoutSearch } = serverFilters;

            // Сохраняем новые фильтры в filterState (без search)
            const newFilterState = {
                ...filterState,
                formData: formDataWithoutSearch
            };

            // Сохраняем в localStorage
            saveFilterState(newFilterState);

            // Обновляем состояние filterState (без search)
            setFilterState(prev => ({
                ...prev,
                formData: formDataWithoutSearch
            }));

            // Сохраняем значения полей фильтра
            setActiveFilters(serverFilters);
        } catch (error) {
            console.error('Refresh error:', error);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut); // Отключаем анимацию загрузки данных
        }
    };

    // Выбор строк(и) в таблице
    const handleSelectionChange = (selectedIndices) => {
        const selectedIds = selectedIndices
            .map(index => tableData[index]?.id)
            .filter(id => id !== undefined);
        setSelectedUsersIds(selectedIds);
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
                        Пользователи
                    </div>
                </div>

                <div className="grouping-groups-elements">

                    {/* Кнопка фильтра */}
                    <FilterButton
                        isActive={filterState.isActive}
                        toggleFilter={toggleFilter}
                    />

                    {/* Поиск */}
                    <SearchInput
                        ref={searchInputRef}
                        placeholder="Поиск пользователя по Email"
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
                {isLoading ? <Loader isWorking={isLoading} /> : <CustomTable // Отображение анимации загрузки при загрузке данных
                    columns={selectedColumns}
                    data={tableData}
                    onSelectionChange={handleSelectionChange}
                    onRowClick={handleRowClick}
                    tableId={pageId}
                    centeredColumns={['Заблокирован']}  // Cписок центрируемых колонок
                    showFirstColumn={false}
                />}
            </div>

            {/* Панель для управления пагинацией */}
            <div>
                {!isLoading && (
                    <PaginationBar
                        totalItems={totalNumberItems}
                        currentPage={currentPage}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

        </div>
    );

};

export default Users;