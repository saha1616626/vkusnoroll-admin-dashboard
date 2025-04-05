import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/categories.css";

// Импорт иконок
import addIcon from './../../assets/icons/add.png'

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import DropdownButtonChange from './../Elements/DropdownButtonChange'; // Кнопка "Изменить"
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import ArchiveStorageButton from "../Elements/ArchiveStorageButton"; // Просмотр архива
import CustomTable from "../Elements/CustomTable"; // Таблица
import Loader from '../Elements/Loader'; // Анимация загрузки данных

import api from '../../utils/api';

const Categories = () => {
    const pageId = 'category-page'; // Уникальный идентификатор страницы
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных

    /* 
        ===========================
            Добавление и редактирование категории
        ===========================
        */

    const navigate = useNavigate();

    const handleAddClick = () => {
        navigate('/menu/categories/new'); // Переход на страницу добавления
    };

    const handleEditClick = (category) => {
        navigate(`/menu/categories/edit/${category.id}`); // Переход на страницу редактирования
    };

    // Обработчик клика по строке в таблице
    const handleRowClick = (rowData) => {
        const originalCategory = rawData.find(category => category.id === rowData.id); // Получаем исходные данные по id из выбранной строки
        if (originalCategory) {
            handleEditClick(originalCategory); // Передаем данные выбранной строки и запускаем страницу для редактирования
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
            // Применяем поисковый запрос
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
    Таблица, архив, поиск
    ===========================
*/
    const defaultColumns = ['Наименование', 'Описание']; // Отображаемые столбцы таблицы по умолчанию

    const [rawData, setRawData] = useState([]); // Исходные данные из API   
    const [tableData, setTableData] = useState([]); // Данные таблицы
    const [isLoading, setIsLoading] = useState(true); // Отображение анимации загрузки при загрузке данных
    const [isArchiveOpen, setIsArchiveOpen] = useState(false); // Состояние архива (открыто/закрыто)

    const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос
    const searchInputRef = React.useRef(); // Очистка поля поиска

    const [selectedСategoryIds, setSelectedСategoryIds] = useState([]); // Массив выбранных строк (id) в таблице

    // Универсальная функция загрузки данных из БД
    const fetchData = useCallback(async (archivedStatus) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            const response = await api.getCategories();
            const categories = response.data; // Получаем данные

            // Проверяем наличие данных
            if (!categories || !Array.isArray(categories)) {
                throw new Error('Invalid categories data');
            }

            setRawData(categories.sort((a, b) => b.id - a.id)); // Сохраняем сырые данные + сортировка по убыванию Id

            // Фильтруем категории исходя из состония архива
            const filteredData = categories.filter(category =>
                archivedStatus ? category.isArchived : !category.isArchived);

            setTableData(transformCategoryData(filteredData));
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

    // Трансформация данных для представления в таблице
    const transformCategoryData = (data) => data.map(category => ({
        id: category.id, // Необходим для связи с исходными данными
        'Наименование': category.name,
        'Описание': category.description,
        'В архиве': category.isArchived ? '✓' : '✗'
    }));

    // Обработчик выбора строк в таблице
    const handleSelectionChange = (selectedIndices) => {
        const selectedIds = selectedIndices
            .map(index => tableData[index]?.id)
            .filter(id => id !== undefined);
        setSelectedСategoryIds(selectedIds);
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

    // Удаление выбранных объектов строк
    const handleDeleteSelected = async () => {
        if (selectedСategoryIds.length === 0) return; // Проверка выбранных строк
        try {
            await api.deleteCategories(selectedСategoryIds); // Удаляем выбранные объекты
            await fetchData(isArchiveOpen); // Обновляем список таблицы
            setSelectedСategoryIds([]); // Сбрасываем выборку строк
        } catch (error) {
            console.error('Delete error:', error);
            alert('Ошибка удаления');
        }
    };

    // Архивировать или разархивировать выбранные объекты строк
    const handleArchiveSelected = async (archive = true) => {
        if (selectedСategoryIds.length === 0) return;
        try {
            await api.archiveCategories(selectedСategoryIds, archive);
            await fetchData(isArchiveOpen);
            setSelectedСategoryIds([]);
        } catch (error) {
            console.error('Archive error:', error);
            alert(archive ? 'Ошибка архивации' : 'Ошибка разархивации');
        }
    };

    // Эффект для поиска
    useEffect(() => {
        const applySearch = () => {
            let result = rawData
                .filter(dish => isArchiveOpen ? dish.isArchived : !dish.isArchived)
                .filter(dish =>
                    searchQuery
                        ? dish.name.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                );

            return transformCategoryData(result);
        };

        setTableData(applySearch());
    }, [rawData, isArchiveOpen, searchQuery]);

    // Обработчик поиска
    const handleSearch = (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Устанавливаем значение, введенное в поле поиска
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

    return (
        <main className="page">
            {/* Управляющие элементы над таблицей */}
            <div className="control-components">

                <div className="refresh-title-group">
                    {/* Обновить страницу */}
                    <RefreshButton onRefresh={refreshData} title="Обновить страницу" />

                    {/* Заголовок страницы */}
                    <div className="page-name">
                        Категории
                    </div>
                </div>

                <div className="add-change-search-archive-group">

                    <div className="add-change-group">
                        {/* Кнопка добавить */}
                        <button className="button-control add" onClick={handleAddClick}>
                            <img src={addIcon} alt="Update" className="icon-button" />
                            Категория
                        </button>

                        {/* Кнопка изменить с выпадающим списком */}
                        <DropdownButtonChange
                            IsArchived={isArchiveOpen}
                            onDelete={handleDeleteSelected}
                            onArchive={() => handleArchiveSelected(true)}
                            onUnarchive={() => handleArchiveSelected(false)}
                        />
                    </div>

                    {/* Поиск */}
                    <SearchInput
                        ref={searchInputRef}
                        placeholder="Поиск категории"
                        onSearch={handleSearch}
                    />

                    {/* Архив */}
                    <ArchiveStorageButton
                        onToggleArchive={handleArchiveToggle}
                        pageId={pageId}
                    />
                </div>

            </div>

            {/* Таблица */}
            <div className="table-page">
                {isLoading ? <Loader isWorking={isLoading} /> : <CustomTable // Отображение анимации загрузки при загрузке данных из БД
                    columns={defaultColumns}
                    data={tableData}
                    onSelectionChange={handleSelectionChange}
                    onRowClick={handleRowClick}
                    tableId={pageId}
                />}
            </div>

        </main>
    );
};

export default Categories;