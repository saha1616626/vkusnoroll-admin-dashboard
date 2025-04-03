import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
import Loader from '../Elements/Loader'; // Анимация загрузки данных

import api from '../../utils/api';

const Dishes = () => {
    const pageId = 'dish-page'; // Уникальный идентификатор страницы
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных

    /* 
    ===========================
     Добавление и редактирование блюда
    ===========================
    */

    const navigate = useNavigate();

    const handleAddClick = () => {
        navigate('/menu/dishes/new'); // Переход на страницу добавления блюда
    };

    const handleEditClick = (dish) => {
        navigate(`/menu/dishes/edit/${dish.id}`); // Переход на страницу редактирования блюда
    };


    // Обработчик клика по строке в таблице
    const handleRowClick = (rowData) => {
        const originalDish = rawData.find(dish => dish.id === rowData.id); // Получаем исходные данные по id из выбранной строки
        if (originalDish) {
            handleEditClick(originalDish); // Передаем данные выбранной строки и запускаем страницу для редактирования
        }
    };

    /* 
    ===========================
     Обновление страницы
    ===========================
    */

    // Обновление страницы
    const refreshData = (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Сохраняем значения полей фильтра после нажатия "Enter"
            setActiveFilters(filterState.formData);
            saveFilterState({ ...filterState, formData: filterState.formData });
            const searchQuery = searchInputRef.current.search(); // Получаем текущее введенное значение из поля поиска
            setSearchQuery(searchQuery);
        } catch (error) {

        }
        finally {
            // Отключаем анимацию загрузки данных
            setTimeout(() => {
                setIsLoading(false); // Данные загружены из БД, анимация загрузки данных выключена
            }, timeOut);
        }
    }

    /* 
      ===========================
      Фильтр
      ===========================
    */

    const [filters, setFilters] = useState([]); // Функции фильтра
    const [filterState, setFilterState] = useState({ // Управление состоянием фильтра (неактивный фильтр)
        isOpen: false, // Меню
        isActive: false, // Кнопка 
        formData: {} // Поля фильтрации
    });
    const [activeFilters, setActiveFilters] = useState({}); // Активный фильтр (применен в работу) 

    // Получение списка категорий
    const fetchCategories = async () => {
        try {
            const response = await api.getCategories();
            const categories = response.data; // Получаем данные

            // Проверяем наличие данных
            if (!categories || !Array.isArray(categories)) {
                throw new Error('Invalid categories data');
            }
            // Извлекаем названия категорий
            const nameCategories = categories.map(category => category.name);
            return nameCategories;
        } catch (error) {
            // Обработка ошибок axios
            console.error('Error:', error.response ? error.response.data : error.message);
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
            const parsedState = JSON.parse(savedState);
            setFilterState(parsedState);
            // Восстанавливаем активные фильтры
            setActiveFilters(parsedState.formData);
        }
    }

    // Обновление данных формы фильтров
    const handleFilterFormUpdate = (name, value) => {
        setFilterState(prev => ({
            ...prev,
            formData: { ...prev.formData, [name]: value }
        }));

        // Здесь можно организовать сохранение значений полей фильтра в localStorage сразу после изменения поля
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
    const applyFilters = useCallback((data, filters) => {
        let result = data;

        // Фильтрация по категориям (только если есть выбранные категории)
        if (filters.categories && filters.categories.length > 0) {
            result = result.filter(dish =>
                filters.categories.includes(dish.category)
            );
        }

        // Фильтрация по весу (проверяем, что значение не пустое и валидное)
        if (filters.weight && filters.weight.trim() !== "" && !isNaN(filters.weight)) {
            const weight = parseFloat(filters.weight);
            result = result.filter(dish => dish.weight === weight);
        }

        // Фильтрация объему (проверяем, что значение не пустое и валидное)
        if (filters.volume && filters.volume.trim() !== "" && !isNaN(filters.volume)) {
            const volume = parseFloat(filters.volume);
            result = result.filter(dish => dish.volume === volume);
        }

        // Фильтрация по кол-ву штук в наборе (проверяем, что значение не пустое и валидное)
        if (filters.quantityInSet && filters.quantityInSet.trim() !== "" && !isNaN(filters.quantityInSet)) {
            const quantity = parseFloat(filters.quantityInSet);
            result = result.filter(dish => dish.quantity === quantity);
        }

        return result;
    }, []); // Все используемые данные в фильтрах

    // Поиск по заданным параметрам фильтра
    const handleFilterSearch = () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Сохраняем значения полей фильтра после нажатия "Поиск"
            setActiveFilters(filterState.formData);
            saveFilterState({ ...filterState, formData: filterState.formData });

            // Сброс поля поиска
            if (searchInputRef.current) {
                setSearchQuery(''); // Обнолвение значения поля поиска
                searchInputRef.current.clear(); // Очистка поля и обновление таблицы
            }
        } catch (error) {

        }
        finally {
            // Отключаем анимацию загрузки данных
            setTimeout(() => {
                setIsLoading(false); // Данные загружены из БД, анимация загрузки данных выключена
            }, timeOut);
        }

    };

    // Очистка полей фильтра
    const handleFilterReset = () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
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

            // Сброс поля поиска
            if (searchInputRef.current) {
                setSearchQuery(''); // Обнолвение значения поля поиска
                searchInputRef.current.clear(); // Очистка поля поиска
            }

            // Очистка выбранных строк

        }
        catch (error) {

        }
        finally {
            // Отключаем анимацию загрузки данных
            setTimeout(() => {
                setIsLoading(false); // Данные загружены из БД, анимация загрузки данных выключена
            }, timeOut);
        }
    };

    /* 
      ===========================
      Поиск
      ===========================
    */
    const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос
    const [rawData, setRawData] = useState([]); // Исходные данные из API
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
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            const response = await api.getDishes();
            const dishes = response.data; // Получаем данные

            // Проверяем наличие данных
            if (!dishes || !Array.isArray(dishes)) {
                throw new Error('Invalid dishes data');
            }

            setRawData(dishes); // Сохраняем сырые данные

            // Фильтруем блюда исходя из состония архива
            const filteredData = dishes.filter(dish =>
                archivedStatus ? dish.isArchived : !dish.isArchived);

            setTableData(transformDishData(filteredData));
        } catch (error) {
            // Обработка ошибок axios
            console.error('Error:', error.response ? error.response.data : error.message);
        } finally {
            // Отключаем анимацию загрузки данных
            setTimeout(() => {
                setIsLoading(false); // Данные загружены из БД, анимация загрузки данных выключена
            }, timeOut);
        }
    }, []);

    // Эффект для фильтраци
    useEffect(() => {
        const applyFiltersAndSearch = () => {
            let result = rawData
                .filter(dish => isArchiveOpen ? dish.isArchived : !dish.isArchived)
                .filter(dish =>
                    searchQuery
                        ? dish.name.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                );

            // Применяем фильтры, только если они есть
            if (Object.keys(activeFilters).length > 0) {
                result = applyFilters(result, activeFilters);
            }

            return transformDishData(result);
        };

        setTableData(applyFiltersAndSearch());
    }, [rawData, isArchiveOpen, searchQuery, activeFilters, applyFilters]);

    // Обработчик поиска
    const handleSearch = (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Сохраняем значения полей фильтра после нажатия "Enter"
            setActiveFilters(filterState.formData);
            saveFilterState({ ...filterState, formData: filterState.formData });

            setSearchQuery(term.trim());
        } catch (error) {

        }
        finally {
            // Отключаем анимацию загрузки данных
            setTimeout(() => {
                setIsLoading(false); // Данные загружены из БД, анимация загрузки данных выключена
            }, timeOut);
        }
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
        id: dish.id, // Необходим для связи с исходными данными
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
                    {isLoading ? <Loader isWorking={isLoading} /> : <CustomTable // Отображение анимации загрузки при загрузке данных из БД
                        columns={selectedColumns}
                        data={tableData}
                        onSelectionChange={handleSelectionChange}
                        onRowClick={handleRowClick}
                        tableId={pageId}
                    />}
                </div>

            </>

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах 