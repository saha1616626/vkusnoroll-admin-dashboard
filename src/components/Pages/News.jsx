import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/news.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import FilterButton from "../Elements/FilterButton"; // Кнопка фильтра
import FilterMenu from '../Elements/FilterMenu'; // Кнопка меню
import DropdownButtonChange from './../Elements/DropdownButtonChange'; // Кнопка "Изменить"
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import ArchiveStorageButton from "../Elements/ArchiveStorageButton"; // Просмотр архива
import Loader from '../Elements/Loader'; // Анимация загрузки данных
import DeletionResultModal from '../Elements/DeletionResultModal'; // Модальное окно результата удаления
import ConfirmationModal from '../Elements/ConfirmationModal'; // Модальное окно подтверждения
import NewsCard from '../Elements/NewsCard'; // Список карточек новостей

// Импорт API
import api from '../../utils/api';

const News = () => {
    const pageId = 'news-page'; // Уникальный идентификатор страницы
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных

    /* 
    ===========================
     Добавление и редактирование новости
    ===========================
    */

    const navigate = useNavigate();

    const handleAddClick = () => {
        navigate('/news/new'); // Переход на страницу добавления
    };

    const handleEditClick = (news) => {
        navigate(`/news/edit/${news.id}`); // Переход на страницу редактирования
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

    // Инициализация фильтров
    useEffect(() => {
        const loadCategories = async () => {
            try {
                initFilters();
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
            { type: 'date-range', name: 'date', label: 'Период публикации' },
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

        // Фильтрация по периоду дат и времени публикации
        // if (filters.categories && filters.categories.length > 0) {
        //     result = result.filter(dish =>
        //         filters.categories.includes(dish.category)
        //     );
        // }

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
      Список, архив, поиск
      ===========================
    */

    const [isLoading, setIsLoading] = useState(true); // Отображение анимации загрузки при загрузке данных
    const [isArchiveOpen, setIsArchiveOpen] = useState(false); // Состояние архива (открыто/закрыто)
    const [selectedNewsIds, setSelectedNewsIds] = useState([]); // Массив выбранных новостей

    // Поиск
    const [searchQuery, setSearchQuery] = useState(''); // Поисковый запрос
    const [rawData, setRawData] = useState([]); // Исходные данные из API
    const searchInputRef = React.useRef(); // Очистка поля поиска

    // Универсальная функция загрузки данных из БД
    const fetchData = useCallback(async (archivedStatus) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            const response = await api.getNewsPosts();
            const news = response.data; // Получаем данные

            // Проверяем наличие данных
            if (!news || !Array.isArray(news)) {
                throw new Error('Invalid news data');
            }

            setRawData(transformNewsData(news.sort((a, b) => b.id - a.id))); // Сохраняем сырые данные + сортировка по убыванию Id

            // Фильтруем исходя из состония архива
            // const filteredData = news.filter(dish =>
            //     archivedStatus ? dish.isArchived : !dish.isArchived);

            // setTableData(transformNewsData(filteredData));
            // setRawData(transformNewsData(filteredData));
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
                .filter(news => isArchiveOpen ? news.isArchived : !news.isArchived)
                .filter(news =>
                    searchQuery
                        ? news.title.toLowerCase().includes(searchQuery.toLowerCase())
                        : true
                );

            // Применяем фильтры, только если они есть
            if (Object.keys(activeFilters).length > 0) {
                result = applyFilters(result, activeFilters);
            }

            return transformNewsData(result);
        };

        // setTableData(applyFiltersAndSearch());
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

    // Трансформация данных для представления в списке
    const transformNewsData = (data) => data.map(news => ({
        id: news.id, // Необходим для связи с исходными данными
        dateTimePublication: news.dateTimePublication || null,
        image: news.image || null,
        title: news.title || '',
        message: news.message || '',
        isArchived: news.isArchived
    }));

    // Обработчик выбора постов в списке
    const handleSelectionChange = (selectedIndices) => {
        // const selectedIds = selectedIndices
        //     .map(index => tableData[index]?.id)
        //     .filter(id => id !== undefined);
        // setSelectedNewsIds(selectedIds);
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
        if (selectedNewsIds.length === 0) return; // Проверка выбранных строк
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
        if (selectedNewsIds.length === 0) return; // Проверка выбранных объектов

        try {
            const response = await api.deleteNewsPosts(selectedNewsIds); // Удаляем выбранные объекты

            if (response.data.conflicts) { // Если есть конфликты со связями при удалении
                setDeletionResult({
                    conflicts: response.data.conflicts || [],
                    deleted: response.data.deleted || []
                });
                setShowDeletionModal(true); // Запуск модального окна
                await fetchData(isArchiveOpen); // Обновляем данные в таблице
                setSelectedNewsIds([]); // Сбрасываем выборку строк
            } else { // Если нет конфликтов со связями при удалении
                await fetchData(isArchiveOpen); // Обновить данные
                setSelectedNewsIds([]); // Сбрасываем выборку строк
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
        }
    };

    // Архивировать или разархивировать выбранные объекты строк
    const handleArchiveSelected = async (archive = true) => {
        if (selectedNewsIds.length === 0) return;
        try {
            await api.archiveNewsPosts(selectedNewsIds, archive);
            await fetchData(isArchiveOpen);
            setSelectedNewsIds([]);
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

            {/* Обновить страницу, название, добавить, фильтрация, изменить, поиcк, архив*/}
            <div className="control-components">

                {/* Обновить страницу */}
                <RefreshButton onRefresh={refreshData} title="Обновить страницу" />

                {/* Заголовок страницы */}
                <div className="page-name">
                    Новости сервиса
                </div>

                <div className="add-filter-change-group">
                    {/* Кнопка добавить */}
                    <button className="button-control add" onClick={handleAddClick}>
                        <img src={addIcon} alt="Update" className="icon-button" />
                        Новость
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
                    placeholder="Поиск новости"
                    onSearch={handleSearch}
                />

                {/* Архив */}
                <ArchiveStorageButton
                    onToggleArchive={handleArchiveToggle}
                    pageId={pageId}
                />

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

            {/* Карточик постов */}
            <div className="news-grid-News">
                {rawData
                    .filter(news => isArchiveOpen ? news.isArchived : !news.isArchived)
                    .map(news => (
                        <NewsCard
                            key={news.id}
                            news={news}
                            onEdit={handleEditClick}
                        />
                    ))}
            </div>

            {/* Модальное окно результата удаления */}
            <DeletionResultModal
                isOpen={showDeletionModal}
                title="Результат удаления новостных постов"
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

export default News;