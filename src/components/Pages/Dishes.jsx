import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom'; // useLocation — хук React Router, который отслеживает изменения URL. Работает только внутри компонентов, обёрнутых в <Router>
// import { useDebounce } from '../Hooks/useDebounce';

// Импорт стилей
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/dishes.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import FilterButton from "../Elements/FilterButton"; // Кнопка фильтра
import FilterMenu from '../Elements/FilterMenu'; // Кнопка меню
import DropdownButtonChange from './../Elements/DropdownButtonChange'; // Кнопка "Изменить"
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import ArchiveStorageButton from "../Elements/ArchiveStorageButton"; // Просмотр архива
import DropdownColumnSelection from "../Elements/DropdownColumnSelection"; // Выбор колонок для отображения таблицы
import CustomTable from "../Elements/CustomTable"; // Таблица
import AddEditDishPage from './AddEditDishPage'; // Управление блюдом. Добавление или редактирование
import Loader from '../Elements/Loader'; // Анимация загрузки данных

const Dishes = () => {
    const pageId = 'dish-page'; // Уникальный идентификатор страницы

    /* 
    ===========================
     Добавление и редактирование блюда
    ===========================
    */

    const [showAddEditPage, setShowAddEditPage] = useState(false); // Состояние страницы работы с блюдом
    const [pageData, setPageData] = useState({}); // Передаваемые данные в компонент или на оборот

    const location = useLocation(); // Отслеживание текущего маршрута
    const [initialLoad, setInitialLoad] = useState(true); // Состояние загрузки страницы

    // Восстановление состояния страницы AddEditDishPage из localStorage при загрузке
    useEffect(() => {
        // Восстановление состояния при загрузке
        const savedState = localStorage.getItem('addEditDishPageState');
        if (savedState) {
            const { isOpen, pathname, title } = JSON.parse(savedState);
            if (pathname === location.pathname) { // Если при загрузки странцы маршрут не изменился
                setShowAddEditPage(isOpen); // Изменяем состояние страницы AddEditDishPage
                setPageData(prev => ({ ...prev, title })); // Передаем данные в AddEditDishPage в зависимости от состояния
            }
        }
        setInitialLoad(false);
    }, [location.pathname]);

    // Обработчик изменения маршрута
    useEffect(() => {
        if (!initialLoad) {
            const savedState = localStorage.getItem('addEditDishPageState');
            if (savedState) {
                const { pathname } = JSON.parse(savedState);
                if (pathname !== location.pathname) {
                    // Закрываем страницу при изменении маршрута
                    setShowAddEditPage(false);
                    localStorage.removeItem('addEditDishPageState');
                }
            }
        }

    }, [location.pathname, initialLoad])

    // Обработчик запуска страницы для добавления блюда
    const handleAddClick = () => {
        setShowAddEditPage(true);
        // Сохранение состояния страницы при запуске
        localStorage.setItem('addEditDishPageState', JSON.stringify({
            isOpen: true,
            pathname: location.pathname,
            title: 'Добавить блюдо'
        }));
    };

    // Обработчик запуска страницы для редактирования блюда
    // const handleEditClick = (dish) => {
    //     setShowAddEditPage(true);
    //     // Сохранение состояния страницы при запуске
    //     localStorage.setItem('addEditDishPageState', JSON.stringify({
    //         isOpen: true,
    //         pathname: location.pathname,
    //         title: 'Блюдо'
    //     }));
    //     setPageData({ ...dish, title: 'Блюдо' });
    // }

    // Обработчик закрытия страницы
    const handlePageClose = () => {
        setShowAddEditPage(false);
        // Очистка состояния перед закрытием
        localStorage.removeItem('addEditDishPageState');
        // TODO дополнительная логика сохранения. Сохранение перед закрытием
    };

    // Обновление localStorage при обновлении данных
    useEffect(() => {
        if (showAddEditPage) { // Страница открыта
            localStorage.setItem('addEditDishPageState', JSON.stringify({
                isOpen: true,
                title: pageData.title
            }));
        }
    }, [showAddEditPage, pageData.title]);

    /* 
    ===========================
     Обновление страницы
    ===========================
    */

    // Обновление страницы
    const refreshData = () => {
        // TODO логика обновления страницы

    }

    /* 
      ===========================
      Фильтр
      ===========================
    */
    const [filters, setFilters] = useState([]); // Функции фильтра
    // Управление состоянием фильтра
    const [filterState, setFilterState] = useState({
        isOpen: false, // Меню
        isActive: false, // Кнопка
        formData: {} // Поля фильтрации
    });

    // Получение списка категорий
    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/categories');
            if (!response.ok) throw new Error('Category loading error');
            // Получаем все данные
            const apiData = await response.json();
            // Извлекаем определенный объект
            const nameCategories = apiData.map(category => category.name);
            return nameCategories;
        } catch (error) {
            console.error('Error:', error);
            return [];
        }
    };

    // Загрузка категорий и инициализация фильтров
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const categories = await fetchCategories();
                initFilters(categories);
                loadSavedFilterState();
            } catch (error) {
                console.error('Category loading error:', error);
            }
        }

        loadCategories();
    }, []);

    // Инициализация фильтров с динамическими категориями
    const initFilters = (categories) => {
        setFilters([
            {
                type: 'multi-select',
                name: 'categories',
                label: 'Категория',
                options: categories,
                placeholder: 'Выберите категорию(и)'
            },
            { type: 'number', name: 'weight', label: 'Вес (г)', placeholder: '' },
            { type: 'number', name: 'volume', label: 'Объём (л)', placeholder: '' },
            { type: 'number', name: 'quantityInSet', label: 'Кол-во в наборе (шт)', placeholder: '' }
        ]);
    }

    // Загрузка сохраненного состояния фильтров
    const loadSavedFilterState = () => {
        const savedState = localStorage.getItem(`filterState_${pageId}`);
        if (savedState) {
            setFilterState(JSON.parse(savedState));
        }
    }

    // Обновление данных формы фильтров
    const handleFilterFormUpdate = (name, value) => {
        const newFormData = { ...filterState.formData, [name]: value };
        setFilterState(prev => ({
            ...prev,
            formData: newFormData
        }));
        // Сохранение значений полей фильтра в localStorage сразу после изменения поля
        // saveFilterState({ ...filterState, formData: newFormData });
    };

    // Сохранение состояния фильтров
    const saveFilterState = (state) => {
        localStorage.setItem(`filterState_${pageId}`, JSON.stringify(state));
    };

    // Кнопка закрыть/открыть меню фильтра
    const toggleFilter = () => {
        // Обновление состояния фильтра
        setFilterState(prev => {
            const newState = {
                ...prev,
                isOpen: !prev.isOpen, // Управление меню
                isActive: !prev.isActive // Управление кнопкой
            };

            // Сохраняем состояние кнопки в localStorage
            localStorage.setItem(`filterState_${pageId}`, JSON.stringify(newState));
            return newState;
        });
    }

    // Фильтрация данных
    const applyFilters = (data) => {
        let result = data;

        // Фильтрация по параметрам меню (Категория)
        if (filterState.formData.categories) {
            result = result.filter(dish =>
                filterState.formData.categories.includes(dish.category)
            );
        }

        // Фильтрация по параметрам меню (Вес)
        if (filterState.formData.weight) {
            const weight = parseFloat(filterState.formData.weight);
            result = result.filter(dish => dish.weight === weight);
        }

        // Фильтрация по параметрам меню (Объем)
        if (filterState.formData.volume) {
            const volume = parseFloat(filterState.formData.volume);
            result = result.filter(dish => dish.volume === volume);
        }

        // Фильтрация по параметрам меню (Кол-во штук в наборе)
        if (filterState.formData.quantityInSet) {
            const quantity = parseFloat(filterState.formData.quantityInSet);
            result = result.filter(dish => dish.quantity === quantity);
        }

        return result;
    };

    // Поиск по заданным параметрам фильтра
    const handleFilterSearch = (formData) => {

        // Сохраняем значения полей фильтра после нажатия "Поиск"
        saveFilterState({ ...filterState, formData: filterState.formData });

        // Сброс поля поиска
        if (searchInputRef.current) {
            setSearchQuery(''); // Обнолвение значения поля поиска
            searchInputRef.current.clearAndUpdate(); // Очистка поля и обнолвение таблицы
        }

        let result = rawData;

        // Фильтрация по архиву
        result = result.filter(dish =>
            isArchiveOpen ? dish.isArchived : !dish.isArchived
        );
        
        setTableData(transformDishData(applyFilters(result)));
    };

    // Очистка полей фильтра
    const handleFilterReset = () => {
        const newState = {
            isOpen: true, // Оставляем меню открытым
            isActive: true,
            formData: {}
        };
        setFilterState(newState);
        localStorage.setItem(`filterState_${pageId}`, JSON.stringify(newState)); // Сохраняем состояние

        // Сброс поля поиска
        if (searchInputRef.current) {
            searchInputRef.current.clearAndUpdate(); // Очистка поля и обнолвение таблицы
        }
    };

    /* 
      ===========================
      Поиск
      ===========================
    */
    const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос
    const [rawData, setRawData] = useState([]); // Исходные данные из API
    const [processedData, setProcessedData] = useState([]); // Отфильтрованные данные
    const searchInputRef = React.useRef(); // Очистка поля поиска

    /* 
      ===========================
      Таблица,архив
      ===========================
    */
    const defaultColumns = ['Название', 'Описание', 'Категория', 'Цена', 'Калории', 'Жиры', 'Белки', 'Углеводы', 'Вес', 'Объём', 'Кол-во в наборе', 'В архиве']; // Колонки для отображения по умолчанию
    const columnOptions = ['Название', 'Описание', 'Категория', 'Цена', 'Калории', 'Жиры', 'Белки', 'Углеводы', 'Вес', 'Объём', 'Кол-во в наборе', 'В архиве'];  // Массив всех возможных колонок для отображения

    const [tableData, setTableData] = useState([]); // Данные таблицы
    const [isLoading, setIsLoading] = useState(true); // Отображение анимации загрузки при загрузке данных
    const [isArchiveOpen, setIsArchiveOpen] = useState(false); // Состояние архива (открыто/закрыто)
    const [selectedColumns, setSelectedColumns] = useState(defaultColumns); // Отображаемые столбцы таблицы

    // Универсальная функция загрузки данных из БД
    const fetchData = useCallback(async (archivedStatus) => {
        setIsLoading(true); // Данные загружаются из БД, анимация загрузки данных включена
        try {
            const response = await fetch('http://localhost:5000/api/dishes');
            if (!response.ok) throw new Error('Network error');

            const apiData = await response.json(); // Получаем массив строк
            setRawData(apiData); // Сохраняем сырые данные

            // Фильтруем блюда исходя из состония архива
            const filteredData = apiData.filter(dish =>
                archivedStatus ? dish.isArchived : !dish.isArchived);

            setProcessedData(transformDishData(filteredData)); // Передаем данные в таблицу
        } catch (error) {
            console.error('Error fetching dishes:', error);
        } finally {
            setIsLoading(false); // Данные загружены из БД, анимация загрузки данных выключена
        }
    }, []);

    // Эффект для фильтраци
    useEffect(() => {
        const applyFiltersAndSearch = () => {
            let result = rawData;

            // Фильтрация по архиву
            result = result.filter(dish =>
                isArchiveOpen ? dish.isArchived : !dish.isArchived
            );

            // Поиск по названию
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                result = result.filter(dish =>
                    dish.name.toLowerCase().includes(query)
                );
            }

            return transformDishData(applyFilters(result));
        };

        setTableData(applyFiltersAndSearch());
    }, [rawData, isArchiveOpen, searchQuery]);

    // Обработчик поиска
    const handleSearch = (term) => {
        setSearchQuery(term.trim());
    };

    // Обработчик изменения состояния архива
    const handleArchiveToggle = useCallback((newState) => {
        setIsArchiveOpen(newState); // Изменяем состояние архива
        fetchData(newState); // Изменяем отобржаемые данные
    }, [fetchData]);

    // Загрузка данных при монтировании и изменении состояния архива
    useEffect(() => {
        fetchData(isArchiveOpen);
    }, [fetchData, isArchiveOpen]);

    // Трансформация данных для представления в таблице
    const transformDishData = (data) => data.map(dish => ({
        'Название': dish.name,
        'Описание': dish.description,
        'Категория': dish.category,
        'Цена': `${dish.price} ₽`,
        'Калории': dish.calories || '—',
        'Жиры': dish.fats || '—',
        'Белки': dish.squirrels || '—',
        'Углеводы': dish.carbohydrates || '—',
        'Вес': dish.weight ? `${dish.weight} г` : '—',
        'Объём': dish.volume ? `${dish.volume} л` : '—',
        'Кол-во в наборе': dish.quantity ? `${dish.quantity} шт` : '—',
        'В архиве': dish.isArchived ? '✓' : '✗'
    }));

    // Загружаем выбранные столбцы из localStorage
    useEffect(() => {
        const savedOptions = localStorage.getItem('selectedOptions');
        if (savedOptions) {
            setSelectedColumns(JSON.parse(savedOptions));
        }
    }, []);

    // Выбранные строки в таблице
    const handleSelectionChange = (selected) => {
        // Логика обработки выбранных элементов
        console.log('Selected items:', selected);
    };

    /* 
     ===========================
     Дополнительно
     ===========================
   */

    // Очистка localStorage при размонтировании
    useEffect(() => {
        return () => {
            localStorage.removeItem('addEditDishPageState');
        };
    }, []);

    return (
        <main className="page">

            {/* Страница для добавления или редактирования блюда */}
            {showAddEditPage && (
                <AddEditDishPage
                    onClose={handlePageClose}
                    pageData={pageData}
                    setPageData={setPageData}
                />
            )}

            {!showAddEditPage && ( // Скрываем при наложении страницы для редактирования или добавления блюда
                <>

                    {/* Обновить страницу, название, добавить, фильтрация, изменить, поиcк, архив и настройка колонок */}
                    <div className="control-components">

                        {/* Обновить страницу */}
                        <RefreshButton onRefresh={refreshData} title="Обновить страницу" />

                        {/* Заголовок страницы */}
                        <div className="page-name">
                            Блюда
                        </div>

                        <div className="add-filter-change-group">
                            {/* Кнопка добавить */}
                            <button className="button-control add" onClick={handleAddClick}>
                                <img src={addIcon} alt="Update" className="icon-button" />
                                Блюдо
                            </button>

                            {/* Кнопка фильтра */}
                            <FilterButton
                                isActive={filterState.isActive}
                                toggleFilter={toggleFilter}
                            />

                            {/* Кнопка изменить с выпадающим списком */}
                            <DropdownButtonChange />
                        </div>

                        {/* Поиск */}
                        <SearchInput
                            ref={searchInputRef}
                            placeholder="Поиск блюда"
                            onSearch={handleSearch}
                        />

                        <div className="archive-settings-group">
                            {/* Архив */}
                            <ArchiveStorageButton
                                onToggleArchive={handleArchiveToggle}
                                pageId={pageId}
                            />

                            {/* Настройка колонок */}
                            <DropdownColumnSelection
                                options={columnOptions}
                                title="Колонки"
                                defaultSelected={defaultColumns}
                                setSelectedColumns={setSelectedColumns} // Передаем функцию для обновления выбранных колонок
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
                        {isLoading ? <Loader /> : <CustomTable // Отображение анимации загрузки при загрузке данных из БД
                            columns={selectedColumns}
                            data={tableData}
                            onSelectionChange={handleSelectionChange}
                            tableId={pageId}
                        />}
                    </div>

                </>
            )}

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах