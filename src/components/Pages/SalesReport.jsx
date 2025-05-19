// Отчет по продажам

import React, { useEffect, useState } from "react";

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
    const defaultOrderReportingColumns = ['Номер', 'Пользователь', 'Дата и время оформления', 'Сумма', 'Статус заказа', 'Статус оплаты', 'Способ оплаты'];
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
            const orderStatuses = await fetchOrderStatuses();
            // initFilters(orderStatuses);

            const savedStateRaw = localStorage.getItem(`filterState_${pageId}`);
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

            // Если нет сохраненного состояния - устанавливаем дефолтную сортировку
            const defaultState = {
                isOpen: false,
                isActive: false,
                formData: {}
            };

            setFilterState(savedState || defaultState);
            setActiveFilters(savedState?.formData || defaultState.formData);

            setIsFiltersInitialized(true); // Фильтры инициализировались
        };
        loadOrders();
    }, []);

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

    };

    // Выбор строк(и) в таблице черерз чекбокс
    const handleSelectionChange = (selectedIndices) => {
        const selectedIds = selectedIndices
            .map(index => filteredData[index]?.id)
            .filter(id => id !== undefined);
        setSelectedOrdersIds(selectedIds);
    };

    /* 
    ===========================
     Управление фильтром
    ===========================
    */

    // Сохранение состояния фильтров
    const saveFilterState = (state) => {
        localStorage.setItem(`filterState_${pageId}`, JSON.stringify({
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

    // Конфигурация фильтра
    const initFilters = (orderStatuses) => {
        setFilters([
            {
                type: 'date-range',
                name: 'simpleDate',
                label: 'Период оформления'
            },
            {
                type: 'multi-select',
                name: 'orderStatus',
                label: 'Статус заказа',
                options: orderStatuses,
                placeholder: 'Выберите статус(ы)'
            },
            { type: 'select', name: 'isPaymentStatus', label: 'Статус оплаты', options: ['Оплачен', 'Не оплачен'] },
            {
                type: 'multi-select',
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
            };

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
                    data={filteredData}
                    onSelectionChange={handleSelectionChange}
                    // onRowClick={handleRowClick}
                    tableId={`${pageId}-${reportMode}`} // Уникальный ID для таблицы
                    centeredColumns={[]}  // Cписок центрируемых колонок
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