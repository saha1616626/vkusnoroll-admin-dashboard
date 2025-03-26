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

const Dishes = () => {

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
            options: ['Карта', 'Наличные']
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
        { 'Название': 'Data 1.1', 'Column 2': 'Data 1.2', 'Column 3': 'Data 1.3' },
        { 'Column 1': 'Data 2.1', 'Column 2': 'Data 2.2', 'Column 3': 'Data 2.3' },
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
                    <button className="button-control add">
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

            <div className="table-page">
                {/* Таблица */}
                <CustomTable columns={selectedColumns} data={data} />
            </div>


        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах