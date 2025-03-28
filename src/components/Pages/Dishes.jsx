import React, { useState, useEffect } from 'react';

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

const Dishes = () => {

    /* 
    ===========================
     Добавление и редактирование блюда
    ===========================
    */

    const [showAddEditPage, setShowAddEditPage] = useState(false); // Состояние страницы работы с блюдом
    const [pageData, setPageData] = useState({}); // Передаваемые данные в компонент или на оборот

    // Обработчик запуска страницы для работы с блюдом
    const handleAddClick = () => {
        setShowAddEditPage(true);
    }

    // Обработчик сохранения/закрытия страницы
    const handlePageClose = (saved = false) => {
        setShowAddEditPage(true);
        if (!saved) { // Если пользователь нажал сохранить, то мы сохраняем результат
            setPageData({});
            // TODO дополнительная логика сохранения
        }
    };

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

    // Управление состоянием фильтра
    const [filterState, setFilterState] = useState({
        isOpen: false, // Меню
        isActive: false, // Кнопка
        formData: {} // Поля фильтрации
    });

    // Сохранение состояний страницы в localStorage
    useEffect(() => {
        const savedStateFilter = localStorage.getItem('filterButtonStateOnDishesPage'); // Определили место в localStorage
        // Определяем структуру в localStorage для filterButtonStateOnDishesPage
        if (savedStateFilter) {
            const { open, active, data } = JSON.parse(savedStateFilter); // Меню открыто/закрыто, кнопка активная/неактивна, выбранные фильтры
            setFilterState(prev => ({
                ...prev,
                isOpen: open,
                isActive: active,
                formData: data || {}
            }));
        }
    }, []);

    // Кнопка закрыть/открыть меню фильтра
    const toggleFilter = () => {
        // Обновление состояния фильтра и сохранение значения в переменной
        setFilterState(prev => {
            const newState = {
                ...prev,
                isOpen: !prev.isOpen, // Управление меню
                isActive: !prev.isActive // Управление кнопкой
            };

            // Сохраняем состояние кнопки в localStorage
            localStorage.setItem('filterButtonStateOnDishesPage', JSON.stringify({ open: newState.isOpen, active: newState.isActive, data: newState.formData }));

            // Возвращаем новое состояние
            return newState;
        });
    };

    // Фиксация изменений при обновлении полей фильтра
    // В компоненте Dishes измените handleFilterFormUpdate:
    const handleFilterFormUpdate = (name, value) => {
        setFilterState(prev => {
            const newFormData = {
                ...prev.formData,
                [name]: value // Обновления соответствующего поля в formData новым значением value
            };

            const newState = {
                ...prev, // Оператор расширения, который копирует все свойства из предыдущего состояния prev в новый объект
                formData: newFormData
            };

            localStorage.setItem('filterButtonStateOnDishesPage',
                JSON.stringify({
                    open: newState.isOpen,
                    active: newState.isActive,
                    data: newFormData
                })
            );

            return newState;
        });
    };

    // Поиск по заданным параметрам фильтра
    const handleFilterSearch = (formData) => {
        // Логика поиска
    };

    // Очистка полей фильтра
    const handleFilterReset = () => {
        setFilterState({
            isOpen: true, // Оставляем меню открытым
            isActive: true,
            formData: {}
        });

        // Чистим localStorage для фильтров
        localStorage.setItem('filterButtonStateOnDishesPage',
            JSON.stringify({
                open: true,
                active: true,
                data: {}
            })
        );
    };

    // Состав фильтра
    const filters = [
        { type: 'text', name: 'name', label: 'Название блюда', placeholder: 'Введите название' },
        { type: 'date-range', name: 'date', label: 'Период' },
        {
            type: 'select',
            name: 'pay',
            label: 'Оплата',
            options: ['Карта', 'Наличные'],
            placeholder: 'Выберите способ'
        },
        {
            type: 'select',
            name: 'dish',
            label: 'Блюдо',
            options: ['Суп', 'Чай', 'Картофель']
        },
        { type: 'text', name: 'price', label: 'Максимальная цена', placeholder: '' },
        { type: 'text', name: 'weight', label: 'Вес', placeholder: '' },
        {
            type: 'multi-select',
            name: 'categoryes',
            label: 'Категория',
            options: ['Суши', 'Ролы', 'Пицца', 'Напитки', 'Десерты'],
            placeholder: 'Выберите категорию(и)'
        }
    ];

    /* 
      ===========================
      Поиск
      ===========================
    */

    // Панель поиска
    const handleSearch = (term) => {
        // TODO логика поиска

    };

    /* 
      ===========================
      Архив
      ===========================
    */

    // Архивный список
    const handleToggleArchive = (isArchived) => {
        // TODO логика вывода архивного списка в зависимости от статуса 
    }

    /* 
      ===========================
      Таблица
      ===========================
    */

    // Массив колонок для отображения
    const columnOptions = ['Название', 'Дата', 'Статус', 'Наименование', 'Наименование большое'];
    // Значения колонок по умолчанию
    const defaultColumns = ['Название']; // Значения по умолчанию

    const [selectedColumns, setSelectedColumns] = useState(defaultColumns);

    const data = [
        { 'Название': 'Data 1.1', 'Дата': 'Data 1.2', 'Статус': 'Data 1.3', 'Наименование': 'Data 1.4', 'Наименование большое': 'Data 1.5' },
        { 'Название': 'Data 1.1', 'Дата': 'Data 1.2', 'Статус': 'Data 1.3', 'Наименование': 'Data 1.4', 'Наименование большое': 'Data 1.5' },
        { 'Название': 'Data 1.1', 'Дата': 'Data 1.2', 'Статус': 'Data 1.3', 'Наименование': 'Data 1.4', 'Наименование большое': 'Data 1.5' },
        { 'Название': 'Data 1.1', 'Дата': 'Data 1.2', 'Статус': 'Data 1.3', 'Наименование': 'Data 1.4', 'Наименование большое': 'Data 1.5' },
        // Добавьте дополнительные строки данных по мере необходимости
    ];

    useEffect(() => {
        // Загружаем выбранные столбцы из localStorage
        const savedOptions = localStorage.getItem('selectedOptions');
        if (savedOptions) {
            setSelectedColumns(JSON.parse(savedOptions));
        }
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
                <SearchInput placeholder="Поиск блюда" onSearch={handleSearch} />

                <div className="archive-settings-group">
                    {/* Архив */}
                    <ArchiveStorageButton onToggleArchive={handleToggleArchive} title="Архив" />

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
            {!showAddEditPage && ( // Скрываем фильтр, при запуске страницы для редактирования или добавления блюда
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

{/* Таблица */}
            <div className="table-page">  
                {!showAddEditPage && ( // Скрываем таблицу, при запуске страницы для редактирования или добавления блюда
                    <CustomTable
                        columns={selectedColumns}
                        data={data}
                        onSelectionChange={(selected) => console.log(selected)}
                        tableId="Admin-Dishes"
                    />
                )}
            </div>

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах