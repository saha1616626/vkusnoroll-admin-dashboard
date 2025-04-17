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
import DeletionResultModal from '../Elements/DeletionResultModal'; // Модальное окно результата удаления
import ConfirmationModal from '../Elements/ConfirmationModal'; // Модальное окно подтверждения

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

    // Модальное окно результата удаления
    const [showDeletionModal, setShowDeletionModal] = useState(false); // Отображение модального окна
    const [deletionResult, setDeletionResult] = useState({ // Данные результата удаления
        conflicts: [],
        deleted: []
    });

    // Модальное окно подтверждения действия
    const [showConfirmation, setShowConfirmation] = useState(false); // Отображение модального окна
    const [currentAction, setCurrentAction] = useState(null); // Действие модального окна: «Удалить», «Архивировать» или «Разархивировать»

    // Обработчики действий модального окна подтверждения действия
    const handleActionConfirmation = (actionType) => {
        if (selectedСategoryIds.length === 0) return; // Проверка выбранных строк
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

    // Удаление выбранных объектов строк
    const handleDeleteSelected = async () => {
        if (selectedСategoryIds.length === 0) return; // Проверка выбранных строк

        try {
            const response = await api.deleteCategories(selectedСategoryIds);

            if (response.data.conflicts) { // Если есть конфликты со связями при удалении
                setDeletionResult({
                    conflicts: response.data.conflicts || [],
                    deleted: response.data.deleted || []
                });
                setShowDeletionModal(true);
                await fetchData(isArchiveOpen); // Обновить данные
                setSelectedСategoryIds([]); // Сбрасываем выборку строк
            }
            else { // Если нет конфликтов со связями при удалении
                await fetchData(isArchiveOpen); // Обновить данные
                setSelectedСategoryIds([]); // Сбрасываем выборку строк
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
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

                <div className="elements-group">

                    <div className="add-change-group">
                        {/* Кнопка добавить */}
                        <button className="button-control add" onClick={handleAddClick}>
                            <img src={addIcon} alt="Update" className="icon-button" />
                            Категория
                        </button>

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

            {/* Модальное окно результата удаления */}
            <DeletionResultModal
                isOpen={showDeletionModal}
                title="Результат удаления категорий"
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

export default Categories;