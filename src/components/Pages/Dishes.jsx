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
import FilterMenu from '../Elements/FilterMenu'; // Кнопка меню фильтра
import DropdownButtonChange from './../Elements/DropdownButtonChange'; // Кнопка "Изменить"
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import ArchiveStorageButton from "../Elements/ArchiveStorageButton"; // Просмотр архива
import DropdownColumnSelection from "../Elements/DropdownColumnSelection"; // Выбор колонок для отображения таблицы
import CustomTable from "../Elements/CustomTable"; // Таблица
import Loader from '../Elements/Loader'; // Анимация загрузки данных
import DeletionResultModal from '../Elements/DeletionResultModal'; // Модальное окно результата удаления
import ConfirmationModal from '../Elements/ConfirmationModal'; // Модальное окно подтверждения

import api from '../../utils/api'; // API сервера

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
    const refreshData = async (term) => {
        await fetchData(); // Синхронизация данных из БД. Обновление представления
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            // Сохраняем значения полей фильтра после нажатия "Enter"
            setActiveFilters(filterState.formData);
            saveFilterState({ ...filterState, formData: filterState.formData });
            const searchQuery = searchInputRef.current.search(); // Получаем текущее введенное значение из поля поиска
            setSearchQuery(searchQuery);
        } catch (error) {
            console.error('Refresh error:', error);
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

            saveFilterState(newState); // Сохраняем состояние фильтра в localStorage
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
      Таблица, архив
      ===========================
    */
    const defaultColumns = ['Наименование', 'Описание', 'Категория', 'Цена', 'Калории', 'Жиры', 'Белки', 'Углеводы', 'Вес', 'Объём', 'Кол-во в наборе', 'В архиве']; // Колонки для отображения по умолчанию
    const columnOptions = ['Наименование', 'Описание', 'Категория', 'Цена', 'Калории', 'Жиры', 'Белки', 'Углеводы', 'Вес', 'Объём', 'Кол-во в наборе', 'В архиве'];  // Массив всех возможных колонок для отображения

    const [tableData, setTableData] = useState([]); // Данные таблицы
    const [isLoading, setIsLoading] = useState(true); // Отображение анимации загрузки при загрузке данных
    const [isArchiveOpen, setIsArchiveOpen] = useState(false); // Состояние архива (открыто/закрыто)
    const [selectedColumns, setSelectedColumns] = useState(defaultColumns); // Отображаемые столбцы таблицы

    const [selectedDishIds, setSelectedDishIds] = useState([]); // Массив выбранных строк в таблице

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

            setRawData(dishes.sort((a, b) => b.id - a.id)); // Сохраняем сырые данные + сортировка по убыванию Id

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
        'Наименование': dish.name,
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
        const savedOptions = localStorage.getItem(`selectedOptions_${pageId}`);
        if (savedOptions) {
            setSelectedColumns(JSON.parse(savedOptions));
        }
    }, [pageId]);

    // Обработчик выбора строк в таблице
    const handleSelectionChange = (selectedIndices) => {
        const selectedIds = selectedIndices
            .map(index => tableData[index]?.id)
            .filter(id => id !== undefined);
        setSelectedDishIds(selectedIds);
    };

    // Модальное окно результата удаления
    const [showDeletionModal, setShowDeletionModal] = useState(false); // Отображение модального окна
    const [deletionResult, setDeletionResult] = useState({ // Данные результата удаления
        conflicts: [],
        deleted: []
    });

    // Модальное окно подтверждения действия
    const [showConfirmation, setShowConfirmation] = useState(false); // Отображение модального окна
    const [currentAction, setCurrentAction] = useState(null); // Действие модального окна: «Удалить», «Архивировать» или «Разархивировать»

    // Обработчики действий модального окна подтверждения: «Удалить», «Архивировать» или «Разархивировать»
    const handleActionConfirmation = (actionType) => {
        if (selectedDishIds.length === 0) return; // Проверка выбранных строк
        setCurrentAction(actionType); // Устанавливаем действие
        setShowConfirmation(true); // Отображаем модальное окно
    }

    // Вызов функции. «Удалить», «Архивировать» или «Разархивировать»
    const handleConfirmAction = async () => {
        try {
            switch (currentAction) {
                case 'delete':
                    await handleDeleteSelected();
                    break;
                case 'archive':
                    await handleArchiveSelected(true);
                    break;
                case 'unarchive':
                    await handleArchiveSelected(false);
                    break;
                default:
                    break;
            }
        } finally {
            // После окончания действий и нажатия кнопки закрытия модального окна
            setShowConfirmation(false);
            setCurrentAction(null);
        }
    };

    // Заголовки для модального окна подтверждения действия
    const getActionTitle = (action) => {
        switch (action) {
            case 'delete': return "Подтвердите удаление";
            case 'archive': return "Подтвердите архивацию";
            case 'unarchive': return "Подтвердите разархивацию";
            default: return "Подтвердите действие";
        }
    };

    // Тело сообщения для модального окна подтверждения действия
    const getActionMessage = (action) => {
        switch (action) {
            case 'delete': return "Вы уверены, что хотите удалить выбранные элементы?";
            case 'archive': return "Вы уверены, что хотите архивировать выбранные элементы?";
            case 'unarchive': return "Вы уверены, что хотите извлечь выбранные элементы из архива?";
            default: return "Вы уверены, что хотите выполнить это действие?";
        }
    };

    // Удаление выбранных объектов
    const handleDeleteSelected = async () => {
        if (selectedDishIds.length === 0) return; // Проверка выбранных строк

        try {
            const response = await api.deleteDishes(selectedDishIds); // Удаляем выбранные объекты

            if (response.data.conflicts) { // Если есть конфликты со связями при удалении
                setDeletionResult({
                    conflicts: response.data.conflicts || [],
                    deleted: response.data.deleted || []
                });
                setShowDeletionModal(true); // Запуск модального окна
                await fetchData(isArchiveOpen); // Обновляем данные в таблице
                setSelectedDishIds([]); // Сбрасываем выборку строк
            } else { // Если нет конфликтов со связями при удалении
                await fetchData(isArchiveOpen); // Обновить данные
                setSelectedDishIds([]); // Сбрасываем выборку строк
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
        }
    };

    // Архивировать или разархивировать выбранные объекты строк
    const handleArchiveSelected = async (archive = true) => {
        if (selectedDishIds.length === 0) return;
        try {
            await api.archiveDishes(selectedDishIds, archive);
            await fetchData(isArchiveOpen);
            setSelectedDishIds([]);
        } catch (error) {
            console.error('Archive error:', error);
            alert(archive ? 'Ошибка архивации' : 'Ошибка разархивации');
        }
    };

    /* 
     ===========================
     Дополнительно
     ===========================
   */

    // Очистка localStorage при размонтировании
    useEffect(() => {
        return () => {

        };
    }, []);

    return (
        <main className="page">

            {/* Обновить страницу, название, добавить, фильтрация, изменить, поиcк, архив и настройка колонок */}
            <div className="control-components">

                <div className="grouping-groups-elements">
                    {/* Обновить страницу */}
                    <RefreshButton onRefresh={refreshData} title="Обновить страницу" />

                    {/* Заголовок страницы */}
                    <div className="page-name">
                        Блюда
                    </div>
                </div>

                <div className="grouping-groups-elements">
                    <div className="grouping-elements">
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
                        <DropdownButtonChange
                            IsArchived={isArchiveOpen}
                            onDelete={() => handleActionConfirmation('delete')}
                            onArchive={() => handleActionConfirmation('archive')}
                            onUnarchive={() => handleActionConfirmation('unarchive')}
                        />
                    </div>

                    {/* Поиск */}
                    <SearchInput
                        ref={searchInputRef}
                        placeholder="Поиск блюда"
                        onSearch={handleSearch}
                    />

                    <div className="grouping-elements">
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
                            pageId={pageId}
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
                    data={tableData}
                    onSelectionChange={handleSelectionChange}
                    onRowClick={handleRowClick}
                    tableId={pageId}
                    centeredColumns={['В архиве']}  // Cписок центрируемых колонок
                />}
            </div>

            {/* Модальное окно результата удаления */}
            <DeletionResultModal
                isOpen={showDeletionModal}
                title="Результат удаления блюд"
                titleConflicts="Не удалось выполнить из-за наличия связанных заказов:"
                conflicts={deletionResult.conflicts}
                deleted={deletionResult.deleted}
                onClose={() => setShowDeletionModal(false)}
            />

            {/* Модальное окно подтверждения действия */}
            <ConfirmationModal
                isOpen={showConfirmation}
                title={getActionTitle(currentAction)}
                message={getActionMessage(currentAction)}
                onConfirm={handleConfirmAction}
                onCancel={() => setShowConfirmation(false)}
            />

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах 