// Отчет по продажам

import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from 'react-router-dom';

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import Loader from "../Elements/Loader";  // Анимация загрузки данных
import FilterButton from "../Elements/FilterButton"; // Кнопка фильтра
import FilterMenu from '../Elements/FilterMenu'; // Кнопка меню фильтра
import api from '../../utils/api'; // API сервера
import CustomTable from "../Elements/CustomTable"; // Таблица
import DropdownColumnSelection from "../Elements/DropdownColumnSelection"; // Выбор колонок для отображения таблицы
import DropDownButtonPrintingReport from "../Elements/DropDownButtonPrintingReport"; // Кнопка с выпадающим меню функций печати отчета
import PaginationBar from "./../Elements/PaginationBar"; // Панель разбиения контента на страницы

// Импорт иконок

// Импорт стилей
import "./../../styles/salesReport.css";

const SalesReport = () => {

    /* 
    ===============================
     Состояния, константы и ссылки
    ===============================
    */

    const pageId = 'sales-report'; // Уникальный идентификатор страницы
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true); // Анимация загрузки данных

    // Кнопка для переключения режима отображения (по товарам или по заказам)
    const [reportMode, setReportMode] = useState(() => {
        const savedMode = localStorage.getItem(`${pageId}-report-mode`);
        return savedMode || 'orders'; // Режим "По заказам" по умолчанию
    });

    // Фильтр
    const [isFiltersInitialized, setIsFiltersInitialized] = useState(false); // Отслеживание инициализации фильтров
    const [filters, setFilters] = useState([]); // Массив функций фильтра
    const [filterState, setFilterState] = useState({ // Управление состоянием фильтра (закрытый фильтр по умолчанию)
        isOpen: false, // Меню закрыто
        isActive: false, // Кнопка не нажата
        formData: {} // Поля фильтрации пустые
    });
    const [activeFilters, setActiveFilters] = useState({}); // Состояние хранения данных полей фильтра

    // Таблица

    // Столбцы отчётности по товарам
    const defaultProductReportingColumns = ['Наименование', 'Категория', 'Количество', 'Цена', 'Сумма'];
    const allProductReportingColumns = [...defaultProductReportingColumns];
    // Столбцы отчётности по заказам
    const defaultOrderReportingColumns = ['Номер', 'Дата и время оформления', 'Дата и время доставки', 'Товары', 'Доставка', 'Сумма', 'Статус заказа', 'Статус оплаты', 'Способ оплаты'];
    const allOrderReportingColumns = [...defaultOrderReportingColumns, 'Адрес доставки', 'Комментарий клиента', 'Комментарий менеджера', 'Имя клиента', 'Телефон клиента'];

    // Отображаемые столбцы таблицы
    const [selectedColumns, setSelectedColumns] = useState(() => {
        const savedColumns = localStorage.getItem(`${pageId}-${reportMode}-columns`);
        return savedColumns ? JSON.parse(savedColumns) : reportMode === 'orders'
            ? defaultOrderReportingColumns
            : defaultProductReportingColumns;
    });
    const [rawData, setRawData] = useState([]); // Оригинальные данные с сервера
    const [filteredData, setFilteredData] = useState([]); // Отфильтрованные данные для отображения
    const [selectedOrdersIds, setSelectedOrdersIds] = useState([]);  // Массив выбранных строк в таблице
    
    // Управление пагинацией
    const [currentPage, setCurrentPage] = useState(0); // Текущая страница
    const [totalNumberItems, setTotalNumberItems] = useState(0); // Общее количество записей
    const itemsPerPage = 15; // Кол-во элементов в списке на отображение

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Эффект для обработки изменений режима отчётности
    useEffect(() => {
        const loadColumns = () => {
            setIsLoading(true); // Включаем анимацию загрузки данных
            try {
                // Загружаем сохраненные колонки при смене режима
                const savedColumns = localStorage.getItem(`${pageId}-${reportMode}-columns`);
                if (savedColumns) {
                    setSelectedColumns(JSON.parse(savedColumns));
                } else {
                    setSelectedColumns(reportMode === 'orders'
                        ? defaultOrderReportingColumns
                        : defaultProductReportingColumns);
                }

                // Сбрасываем пагинацию при смене режима
                setCurrentPage(0);
            } finally {
                setTimeout(() => setIsLoading(false), timeOut);
            }
        };
        loadColumns();
    }, [reportMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Инициализация фильтров
    useEffect(() => {
        const loadOrders = async () => {
            // Очищаем предыдущие фильтры
            setFilters([]);
            setFilterState({ isOpen: false, isActive: false, formData: {} });

            if (reportMode === 'orders') {
                const orderStatuses = await fetchOrderStatuses();
                initOrderFilters(orderStatuses);
            } else if (reportMode === 'products') {
                const categories = await fetchCategories();
                initDishFilters(categories);
            }

            // Загрузка сохраненного состояния фильтра для текущего режима
            const savedStateRaw = localStorage.getItem(`filterState_${pageId}_${reportMode}`);
            const savedState = savedStateRaw ? JSON.parse(savedStateRaw) : null;

            if (savedState?.formData?.sort) {
                try {
                    // Проверяем, нужно ли парсить sort (если это строка)
                    savedState.formData.sort = typeof savedState.formData.sort === 'string'
                        ? JSON.parse(savedState.formData.sort)
                        : savedState.formData.sort;
                } catch (e) {
                    console.error('Error parsing sort filter:', e);
                    savedState.formData.sort = null;
                }
            }

            // Установка дефолтной сортировки для режима
            const defaultSort = reportMode === 'orders'
                ? { type: 'orderDate', order: 'desc' }
                : { type: 'amount', order: 'asc' };

            // Если нет сохраненного состояния - устанавливаем дефолтную сортировку
            const defaultState = {
                isOpen: false,
                isActive: false,
                formData: {
                    sort: { sort: defaultSort }
                }
            };

            setFilterState(savedState || defaultState);
            setActiveFilters(savedState?.formData || defaultState.formData);
            setIsFiltersInitialized(true); // Фильтры инициализировались
        };
        loadOrders();
    }, [reportMode]); // eslint-disable-line react-hooks/exhaustive-deps

    /* 
    ===========================
     Управление данными
    ===========================
    */

    // Функция загрузки данных из БД
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

                if (reportMode === 'orders') {
                    const response = await api.getOrdersReport(params);
                    if (response.data) {
                        setRawData(response.data); // Оригинальные данные с сервера
                        const total = Number(response.data.pagination.total) || 0; // Гарантированное число заказов
                        setTotalNumberItems(total); // Общее количество заказов
                        setFilteredData(transformOrderData(response.data.data));
                    }
                }

                if (reportMode === 'products') {
                    const response = await api.getDishSalesReport(params);
                    if (response.data) {
                        setRawData(response.data); // Оригинальные данные с сервера
                        const total = Number(response.data.total) || 0; // Гарантированное число товаров
                        setTotalNumberItems(total); // Общее количество заказов
                        setFilteredData(transformDishData(response.data.data));
                    }
                }

            } catch (error) {
                console.error('Ошибка загрузки заказов:', error);
                setTotalNumberItems(0); // Сбрасываем total при ошибке
            } finally { // Выключаем анимацию загрузки данных
                setTimeout(() => setIsLoading(false), timeOut);
            }
        }
    }, [currentPage, activeFilters, isFiltersInitialized, reportMode]); // Вызываем обновление списка при переключении страниц списка

    // Загрузка данных в таблицу при монтировании текущей страницы
    useEffect(() => {
        // Обновляем данные на странице
        fetchData();
    }, [location.key, fetchData]);

    // Трансформация данных о заказах для представления в таблице
    const transformOrderData = (data) => data.map(order => {

        // Форматирование даты и времени оформления (обрезаем миллисекунды)
        const formatDateTime = (datetime) => {
            if (!datetime) return '—';

            const date = new Date(datetime);

            const datePart = date.toLocaleDateString('ru-RU', {
                timeZone: 'Europe/Moscow',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });

            const timePart = date.toLocaleTimeString('ru-RU', {
                timeZone: 'Europe/Moscow',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `${datePart} ${timePart}`;
        };

        // Форматирование диапазона доставки
        const formatDeliveryRange = (start, end) => {
            if (!start || !end) return '—';

            const startDateObj = new Date(start);
            const endDateObj = new Date(end);

            // Форматируем дату
            const formatDate = (date) =>
                date.toLocaleDateString('ru-RU', {
                    timeZone: 'Europe/Moscow',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                });

            // Форматируем время
            const formatTime = (date) =>
                date.toLocaleTimeString('ru-RU', {
                    timeZone: 'Europe/Moscow',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

            const startDateStr = formatDate(startDateObj);
            const startTimeStr = formatTime(startDateObj);
            const endDateStr = formatDate(endDateObj);
            const endTimeStr = formatTime(endDateObj);

            if (startDateStr === endDateStr) {
                return `${startDateStr} ${startTimeStr} - ${endTimeStr}`;
            } else {
                return `${startDateStr} ${startTimeStr} - ${endDateStr} ${endTimeStr}`;
            }
        };

        // Формирование адреса доставки
        const formatAddress = (addr) => {
            if (!addr) return '—';
            const parts = [
                addr.city,
                addr.street,
                `д. ${addr.house}`,
                addr.apartment ? `кв. ${addr.apartment}` : null
            ].filter(Boolean);
            return parts.join(', ');
        };

        return {
            id: order.id,
            'Номер': order.orderNumber || '—',
            'Дата и время оформления': formatDateTime(order.orderPlacementTime),
            'Товары': `${(Number(order.goodsCost)).toFixed(2)} ₽`,
            'Доставка': `${(Number(order.shippingCost)).toFixed(2)} ₽`,
            'Сумма': `${(Number(order.goodsCost) + Number(order.shippingCost)).toFixed(2)} ₽`,
            'Дата и время доставки': formatDeliveryRange(
                order.startDesiredDeliveryTime,
                order.endDesiredDeliveryTime
            ),
            'Статус заказа': order.status?.name || 'Новый',
            'Статус оплаты': order.isPaymentStatus ? 'Оплачен' : 'Не оплачен',
            'Способ оплаты': order.paymentMethod || '—',
            'Адрес доставки': formatAddress(order.deliveryAddress),
            'Комментарий клиента': order.commentFromClient || '—',
            'Комментарий менеджера': order.commentFromManager || '—',
            'Имя клиента': order.nameClient || '—',
            'Телефон клиента': order.numberPhoneClient || '—'
        };
    });

    // Трансформация данных о блюдах для представления в таблице
    const transformDishData = (data) => data.map(dish => {
        return {
            dishId: dish.dishId,
            'Наименование': dish.dishName,
            categoryId: dish.categoryId,
            'Категория': dish.categoryName,
            'Количество': dish.totalQuantity,
            'Цена': `${(Number(dish.averagePrice))} ₽`,
            'Сумма': `${(Number(dish.totalAmount))} ₽`
        };
    });

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Переключение режима (по товарам или по заказам)
    const handleModeChange = (mode) => {
        setReportMode(mode);
        localStorage.setItem(`${pageId}-report-mode`, mode);
    }

    // Обработчик выбора колонок
    const handleColumnChange = (newColumns) => {
        setSelectedColumns(newColumns);
        localStorage.setItem(`${pageId}-${reportMode}-columns`, JSON.stringify(newColumns));
    };

    // Обновление данных на странице (иконка). Без сброса списка пагинации
    const refreshData = async () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Формируем параметры в зависимости от режима
            const serverFilters = { ...filterState.formData };

            // Нормализация параметров для разных режимов
            if (reportMode === 'orders') {
                serverFilters.orderStatus = filterState.formData.orderStatus;
                serverFilters.isPaymentStatus = filterState.formData.isPaymentStatus;
                serverFilters.paymentMethod = filterState.formData.paymentMethod;
            } else if (reportMode === 'products') {
                serverFilters.categories = filterState.formData.categories;
                serverFilters.isPaymentStatus = filterState.formData.isPaymentStatus;
                serverFilters.isCompletionStatus = filterState.formData.isCompletionStatus;
            }

            // Общие параметры
            serverFilters.date = filterState.formData.date;
            serverFilters.sort = filterState.formData.sort;

            // Сохраняем значения полей фильтра
            setActiveFilters(serverFilters);
            saveFilterState({ ...filterState, formData: serverFilters });
        } catch (error) {
            console.error('Filter search error:', error);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };

    // Выбор строк(и) в таблице черерз чекбокс
    const handleSelectionChange = (selectedIndices) => {
        const selectedIds = selectedIndices
            .map(index => filteredData[index]?.id)
            .filter(id => id !== undefined);
        setSelectedOrdersIds(selectedIds);
    };

    // Обработчик клика по строке в таблице
    const handleRowClick = (rowData) => {
        const originalData = rawData.data.find(order => order.id === rowData.id); // Получаем исходные данные по id из выбранной строки
        if (originalData && reportMode === 'orders') handleViewOrderClick(originalData); // Передаем данные выбранной строки и запускаем модальное окно
    };

    const handleViewOrderClick = (order) => { }; // Запуск модального окна для просмотра информации о заказе

    /* 
    ===========================
     Управление фильтром
    ===========================
    */

    // Сохранение состояния фильтров
    const saveFilterState = (state) => {
        localStorage.setItem(`filterState_${pageId}_${reportMode}`, JSON.stringify({
            ...state,
            formData: {
                ...state.formData,
            }
        }));
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

    // Получение списка статусов заказа
    const fetchOrderStatuses = async () => {
        try {
            const response = await api.getOrderStatuses();

            // Проверяем наличие данных
            if (!response.data || !Array.isArray(response.data)) { throw new Error('Invalid order statuses data'); }

            // Добавляем системный статус
            const systemStatuses = [
                { id: 'null', name: 'Новый', sequenceNumber: -1 }
            ];

            const allStatuses = [...systemStatuses, ...response.data]
                .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

            return allStatuses.map(status => ({
                id: status.id,
                name: status.name
            }));
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            return [];
        }
    };

    // Получение списка категорий товаров
    const fetchCategories = async () => {
        try {
            const response = await api.getCategories();

            // Проверяем наличие данных
            if (!response.data || !Array.isArray(response.data)) { throw new Error('Invalid categories data'); }

            return response.data.map(category => ({
                id: category.id,
                name: category.name
            }));
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            return [];
        }
    };

    // Фильтры должны меняться в зависимости от режима

    // Конфигурация фильтра для заказов
    const initOrderFilters = (orderStatuses) => {
        setFilters([
            {
                type: 'date-range',
                name: 'simpleDate',
                label: 'Период оформления'
            },
            {
                type: 'multi-select-extended',
                name: 'orderStatus',
                label: 'Статус заказа',
                options: orderStatuses,
                placeholder: 'Выберите статус(ы)'
            },
            { type: 'select', name: 'isPaymentStatus', label: 'Статус оплаты', options: ['Оплачен', 'Не оплачен'] },
            {
                type: 'multi-select-extended',
                name: 'paymentMethod',
                label: 'Способ оплаты',
                options: [
                    { id: 'online', name: 'Онлайн' },
                    { id: 'cash', name: 'Наличные' },
                    { id: 'card', name: 'Картой при получении' }
                ],
                placeholder: 'Выберите способ(ы)'
            },
            {
                type: 'sort',
                name: 'sort',
                label: 'Сортировка',
                options: [
                    {
                        type: 'orderDate',
                        label: 'По дате заказа',
                        subOptions: [
                            { value: 'desc', label: 'Новые' },
                            { value: 'asc', label: 'Старые' }
                        ]
                    },
                    {
                        type: 'deliveryDate',
                        label: 'По дате доставки',
                        subOptions: [
                            { value: 'asc', label: 'Ближе' },
                            { value: 'desc', label: 'Дальше' }
                        ]
                    }
                ]
            }
        ]);
    };

    // Конфигурация фильтра для блюд
    const initDishFilters = (categories) => {
        setFilters([
            {
                type: 'date-range',
                name: 'simpleDate',
                label: 'Период'
            },
            {
                type: 'multi-select-extended',
                name: 'categories',
                label: 'Категория',
                options: categories,
                placeholder: 'Выберите категорию(и)'
            },
            { type: 'select', name: 'isPaymentStatus', label: 'Статус оплаты', options: ['Оплачен', 'Не оплачен'] },
            { type: 'select', name: 'isCompletionStatus', label: 'Статус выполенния', options: ['В работе', 'Завершен'] },
            {
                type: 'sort',
                name: 'sort',
                label: 'Сортировка',
                options: [
                    {
                        type: 'amount',
                        label: 'По сумме',
                        subOptions: [
                            { value: 'desc', label: 'Больше' },
                            { value: 'asc', label: 'Меньше' }
                        ]
                    },
                    {
                        type: 'quantity',
                        label: 'По количеству',
                        subOptions: [
                            { value: 'desc', label: 'Больше' },
                            { value: 'asc', label: 'Меньше' }
                        ]
                    }
                ]
            }
        ]);
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
            // Формируем параметры в зависимости от режима
            const serverFilters = { ...filterState.formData };

            // Нормализация параметров для разных режимов
            if (reportMode === 'orders') {
                serverFilters.orderStatus = filterState.formData.orderStatus;
                serverFilters.isPaymentStatus = filterState.formData.isPaymentStatus;
                serverFilters.paymentMethod = filterState.formData.paymentMethod;
            } else if (reportMode === 'products') {
                serverFilters.categories = filterState.formData.categories;
                serverFilters.isPaymentStatus = filterState.formData.isPaymentStatus;
                serverFilters.isCompletionStatus = filterState.formData.isCompletionStatus;
            }

            // Общие параметры
            serverFilters.date = filterState.formData.date;
            serverFilters.sort = filterState.formData.sort;

            setCurrentPage(0); // Сброс номера страницы списка пагинации

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
            setCurrentPage(0); // Сброс номера страницы списка пагинации

            // Устанавливаем дефолты в зависимости от режима
            const defaultSort = reportMode === 'orders'
                ? { type: 'orderDate', order: 'desc' }
                : { type: 'amount', order: 'asc' };

            const newFilterState = {
                isOpen: true,
                isActive: true,
                formData: { sort: defaultSort }
            };

            setFilterState(newFilterState);
            setActiveFilters({ sort: defaultSort });
            saveFilterState(newFilterState);
        } catch (error) {
            console.error('Filter reset error:', error);
        } finally {
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="page">
            <div className="control-components">
                <div className="grouping-groups-elements">
                    {/* Обновить страницу */}
                    <RefreshButton onRefresh={refreshData} title="Обновить страницу" />

                    {/* Заголовок страницы */}
                    <div className="page-name">
                        Отчет по продажам
                    </div>
                </div>

                {/* Кнопка переключения режима типа отчетности */}
                <div className="sales-report-mode-switch">
                    <button
                        className={`sales-report-mode-button ${reportMode === 'orders' ? 'active' : ''}`}
                        onClick={() => handleModeChange('orders')}
                    >
                        По заказам
                    </button>
                    <button
                        className={`sales-report-mode-button ${reportMode === 'products' ? 'active' : ''}`}
                        onClick={() => handleModeChange('products')}
                    >
                        По товарам
                    </button>
                </div>

                <div className="grouping-groups-elements">
                    <div className="grouping-elements">
                        {/* Кнопка с выпадающим меню функций печати отчета */}
                        <DropDownButtonPrintingReport
                            reportMode={reportMode}
                            activeFilters={activeFilters}
                            selectedColumns={selectedColumns}
                        />

                        {/* Кнопка фильтра */}
                        <FilterButton
                            isActive={filterState.isActive}
                            toggleFilter={toggleFilter}
                        />

                        {/* Настройка колонок */}
                        <DropdownColumnSelection
                            key={`columns-${reportMode}`} // Форсированный ререндер при смене режима
                            options={reportMode === 'orders' ? allOrderReportingColumns : allProductReportingColumns}
                            title="Колонки"
                            defaultSelected={reportMode === 'orders' ? defaultOrderReportingColumns : defaultProductReportingColumns}
                            setSelectedColumns={handleColumnChange} // Передаем функцию для обновления выбранных колонок
                            pageId={`${pageId}-${reportMode}`} // Уникальный ID для каждого режима
                        />
                    </div>
                </div>
            </div>

            {/* Меню фильтра */}
            <div className="page-filter">
                {!isLoading && (
                    <FilterMenu
                        isOpen={filterState.isOpen}
                        filters={filters}
                        formData={filterState.formData}
                        onFormUpdate={handleFilterFormUpdate}
                        onSearch={handleFilterSearch}
                        onReset={handleFilterReset}
                    />
                )}
            </div>

            {/* Панель с итоговой статистикой */}
            {!isLoading && (
                <div className="sales-report-stats">
                    {reportMode === 'products' && (
                        <>
                            <div className="sales-report-stats-item">
                                <span className="label">Всего продано:</span>
                                <span className="value">{rawData.totalSold || 0} шт.</span>
                            </div>
                            <div className="sales-report-stats-item highlight">
                                <span className="label">Общая выручка:</span>
                                <span className="value">{(rawData.totalRevenue || 0).toLocaleString('ru-RU')} ₽</span>
                            </div>
                        </>
                    )}

                    {reportMode === 'orders' && rawData.statistics && (
                        <>
                            <div className="sales-report-stats-item">
                                <span className="label">Заказов:</span>
                                <span className="value">{rawData.pagination?.total || 0}</span>
                            </div>
                            <div className="sales-report-stats-item">
                                <span className="label">Товары:</span>
                                <span className="value">{rawData.statistics.totalGoodsCost} ₽</span>
                            </div>
                            <div className="sales-report-stats-item">
                                <span className="label">Доставка:</span>
                                <span className="value">{rawData.statistics.totalShippingCost} ₽</span>
                            </div>
                            <div className="sales-report-stats-item highlight">
                                <span className="label">Итого:</span>
                                <span className="value">{rawData.statistics.totalRevenue} ₽</span>
                            </div>
                            <div className="sales-report-stats-item">
                                <span className="label">Средний чек:</span>
                                <span className="value">{rawData.statistics.averageOrderValue} ₽</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Таблица */}
            <div className="table-page">
                {isLoading ? <Loader isWorking={isLoading} /> : <CustomTable // Отображение анимации загрузки при загрузке данных
                    columns={selectedColumns}
                    data={filteredData}
                    onSelectionChange={handleSelectionChange}
                    onRowClick={handleRowClick}
                    tableId={`${pageId}-${reportMode}`} // Уникальный ID для таблицы
                    centeredColumns={[]}  // Cписок центрируемых колонок
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

export default SalesReport;