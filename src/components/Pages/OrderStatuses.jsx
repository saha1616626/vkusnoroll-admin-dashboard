// Список статусов заказов

import React, { useState, useEffect, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core'; // Создание перетаскиваемых элементов списка
import { CSS } from '@dnd-kit/utilities'; // Для разработки интерфейсов перетаскивания
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove
} from '@dnd-kit/sortable'; // «Cортируемое» перетаскивание элементов
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'; // Настройка оси перемещения
import { useNavigate, useLocation } from 'react-router-dom';
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство.

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/orderStatuses.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'
import sortIcon from './../../assets/icons/sort.png'
import editIcon from './../../assets/icons/edit.png'
import deleteIcon from './../../assets/icons/delete.png'
import dragIcon from './../../assets/icons/drag.png'


// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import api from '../../utils/api'; // API сервера
import ConfirmationModal from '../Elements/ConfirmationModal'; // Окно для подтверждения удаления
import ErrorModal from "../Elements/ErrorModal"; //Модальное окно для отображения ошибок
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
import Loader from '../Elements/Loader'; // Анимация загрузки данных

//  Основной компонент
const OrderStatuses = () => {

    /* 
    ===========================
     Константы и рефы
    ===========================
    */

    const navigate = useNavigate(); // Для управления маршрутом приложения
    const location = useLocation();
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных
    const searchInputRef = React.useRef(); // Ссылка на поле поиска

    /* 
    ===========================
     Состояния
    ===========================
    */

    const [isLoading, setIsLoading] = useState(true); // Анимация загрузки данных
    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [initialData, setInitialData] = useState(null); // Исходные данные о списке статусов, которые были получены при загрузке страницы (Если таковые имеются)

    const [rawStatuses, setRawStatuses] = useState([]); // Оригинальные данные с сервера
    const [filteredStatuses, setFilteredStatuses] = useState([]); // Отфильтрованные данные для отображения
    const [editableStatuses, setEditableStatuses] = useState([]); // Данные в режиме редактирования

    const [isEditingOrder, setIsEditingOrder] = useState(false); // Режим редактирования порядка статусов
    const [searchQuery, setSearchQuery] = useState(''); // Поиск статуса заказа
    const [showModal, setShowModal] = useState(false); // Отображение модального окна для редактирования и добавления
    const [editingStatus, setEditingStatus] = useState(null); // Передача стауса для редактирования
    const [statusToDelete, setStatusToDelete] = useState(null); // Передача стауса для удаления

    const [showConfirmation, setShowConfirmation] = useState(false); // Отображение модального окна для  подтверждения удаления

    // Модальное окно для отображения ошибок: удаления и редактирования
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки

    // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    /* 
    ===========================
     Управление статусами
    ===========================
    */

    // Загрузка статусов из БД
    const fetchStatuses = async () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            const response = await api.getOrderStatuses();
            const sortedData = response.data.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

            setRawStatuses(sortedData);
            setFilteredStatuses(sortedData);
            setEditableStatuses(sortedData);
            setInitialData({ ...response, data: sortedData });
        } catch (error) {
            console.error('Ошибка загрузки статусов:', error);
        } finally { // Выключаем анимацию загрузки данных
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };

    // Окончание перетаскивания элемента
    const handleDragEnd = (event) => {
        if (!isEditingOrder) return;

        const { active, over } = event;
        if (active.id !== over.id) {
            setEditableStatuses(items => {
                const newItems = arrayMove(
                    items,
                    items.findIndex(i => i.id === active.id),
                    items.findIndex(i => i.id === over.id)
                );

                return newItems.map((item, index) => ({
                    ...item,
                    sequenceNumber: index + 1,
                }));
            });
        }
    };

    // Сохранить новый порядок статусов
    const handleSaveOrder = async () => {
        try {
            // Формируем минимальный необходимый набор данных
            const sequenceData = editableStatuses.map(({ id, sequenceNumber }) => ({
                id: Number(id),
                sequenceNumber: Number(sequenceNumber)
            }));

            await api.updateOrderStatusesSequence(sequenceData);

            // Обновляем данные после успешного сохранения
            await fetchStatuses();

            setIsEditingOrder(false);
            setIsDirty(false); // Сбрасываем флаг изменений
        } catch (error) {
            console.error('Ошибка сохранения порядка:', error);
        }
    };

    // Обработка отмены изменений после выхода из режима для изменения порядка статусов
    const handleCancelOrder = () => {

        // Восстанавливаем исходный порядок и сбрасываем режим редактирования
        const handleConfirmNavigation = () => {
            if (initialData) {
                setEditableStatuses([...initialData.data].sort((a, b) => a.sequenceNumber - b.sequenceNumber)); // Восстанавливаем исходный порядок из initialData
            }
            setIsEditingOrder(false);
            setIsDirty(false); // Сбрасываем флаг изменений
        };

        if (isDirty)  // Если есть несохраненные изменения
        {
            // Показываем модальное окно вместо confirm
            setPendingNavigation(() => () => {
                handleConfirmNavigation(); // Восстанавливаем исходный порядок и сбрасываем режим редактирования
                setShowNavigationConfirmModal(false);
            });
            setShowNavigationConfirmModal(true);
            return;
        }

        handleConfirmNavigation();
    };

    // Редактировать статус
    const handleEditStatus = (status) => {
        setEditingStatus(status);
        setShowModal(true);
    };

    // Подтверждение удаления статуса
    const handleConfirmDelete = async (id) => {
        setStatusToDelete(id); // Передача id статуса
        setShowConfirmation(true); // Отображаем модальное окно
    };

    // Удаление статуса
    const handleDeleteClick = async () => {
        try {
            const response = await api.deleteOrderStatus(statusToDelete);
            if (response.conflicts) { // Если есть конфликт удаления
                setErrorMessages([response.conflicts]);
                setShowErrorModal(true); // Запуск модального окна
            } else {
                await fetchStatuses(); // Обновление данных
            }
        } catch (error) {
            console.error('Ошибка удаления:', error);
            await fetchStatuses(); // Обновление данных в случае сбоя
        } finally {
            setShowConfirmation(false);
            setStatusToDelete(null);
        }
    }

    // Проверка изменений, требующих сохранения
    const checkDirty = useCallback(() => {
        if (!initialData) return false;

        // Сравниваем только порядок ID
        const initialIds = initialData.data.map(s => s.id);
        const currentIds = editableStatuses.map(s => s.id);

        return !isEqual(initialIds, currentIds);
    }, [initialData, editableStatuses]);

    // Обработчик отмены перехода на другую страницу через модальное окно
    const handleCancelNavigation = () => {
        // Возвращаем исходный URL при отмене перехода назад через popstate браузера
        window.history.pushState(null, null, window.location.pathname);
        setShowNavigationConfirmModal(false);
    };

    // Поиск
    const handleSearch = (term) => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            setSearchQuery(term.trim());
        } finally { // Выключаем анимацию загрузки данных
            setTimeout(() => setIsLoading(false), timeOut);
        }
    };

    // Обновление данные на странице (Иконка)
    const refreshData = async () => {
        fetchStatuses().then(() => {
            if (searchInputRef.current) {
                const searchTerm = searchInputRef.current.search();
                setSearchQuery(searchTerm); // Обновление данных с учетом ключевого значения
            }
        });
    };

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Загрузка статусов при монтировании компонента
    useEffect(() => {
        fetchStatuses();
    }, []);

    // Сохраняем состояние о наличии несохраненных данных на странице
    useEffect(() => {
        sessionStorage.setItem('isDirty', isDirty.toString());
    }, [isDirty]);

    // Обновляем состояние isDirty при изменении статусов
    useEffect(() => {
        if (initialData) {
            const dirty = checkDirty();
            setIsDirty(dirty);
        }
    }, [initialData, checkDirty]);

    // Обработка нажатия кнопки "Назад" в браузере
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault(); // Блокируем переход, если есть несохраненные изменения
                setPendingNavigation(() => () => {
                    handleConfirmNavigation(); // Вызываем функцию подтверждения перехода
                });
                setShowNavigationConfirmModal(true); // Показываем модальное окно подтверждения
            } else if (isEditingOrder) {
                handleConfirmNavigation(); // Никаких изменений, но в режиме редактирования
            }
        };

        const handleConfirmNavigation = () => {
            if (isEditingOrder && initialData) {
                // Восстанавливаем исходный порядок и сбрасываем режим редактирования
                setEditableStatuses([...initialData.data].sort((a, b) => a.sequenceNumber - b.sequenceNumber));
            }
            setIsEditingOrder(false);
            setIsDirty(false);
            setShowNavigationConfirmModal(false);
        };

        // Добавляем новую запись в историю для корректного отслеживания переходов
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [isDirty, navigate, isEditingOrder, initialData]);

    // Блокируем обновление страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isDirty) {
                const confirmationMessage = 'Есть несохранённые изменения. Уйти?';
                event.returnValue = confirmationMessage; // Для старых браузеров
                return confirmationMessage; // Для современных браузеров
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    // Блокируем закрытие страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (e) => { // Пользователь пытается покинуть страницу
            if (isDirty) { // Есть несохраненные изменения
                e.preventDefault(); // Предотвращает уход с текущей страницы
                e.returnValue = ''; // Всплывающее окно, которое предупреждает пользователя
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload); // Обработчик handleBeforeUnload добавляется к объекту window всякий раз, когда пользователь пытается покинуть страницу
        return () => window.removeEventListener('beforeunload', handleBeforeUnload); // Функция очистки, которая удаляет обработчик события, когда компонент размонтируется или когда isDirty изменяется
    }, [isDirty]); // Обработчик события будет добавляться каждый раз, когда isDirty изменяется

    // Сбрасываем страницы при изменении ключа location (Переход на текущую страниу)
    useEffect(() => {
        setIsEditingOrder(false);
        setIsDirty(false);
        // Сброс поиска
        setSearchQuery(null);
        searchInputRef.current?.clear();
        // Обновляем данные на странице
        fetchStatuses();
    }, [location.key]); // location.key меняется при каждом переходе (даже на тот же URL)

    // Эффект для фильтраци
    useEffect(() => {
        if (isEditingOrder) {
            setFilteredStatuses(editableStatuses);
        } else {
            const filtered = searchQuery
                ? rawStatuses.filter(s =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                : rawStatuses;

            setFilteredStatuses(filtered);
        }
    }, [searchQuery, rawStatuses, isEditingOrder, editableStatuses]);

    // Очистка состояния о наличии несохраненных данных при размонтировании
    useEffect(() => {
        return () => {
            sessionStorage.removeItem('isDirty');
        };
    }, []);

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="page" style={{ marginTop: '35px', marginLeft: '1.5rem', marginRight: '1.5rem' }}>

            <div className="control-components order-statuses-controls">

                <div className="grouping-groups-elements">
                    {/* Обновить страницу */}
                    {!isEditingOrder && (<RefreshButton title="Обновить страницу" onRefresh={refreshData} />)}

                    {/* Заголовок страницы */}
                    <div className="page-name">
                        Статусы заказов
                    </div>
                </div>

                {!isEditingOrder ? (
                    <div className="grouping-groups-elements">
                        <div className="grouping-elements">
                            {/* Кнопка добавить */}
                            <button className="button-control add"
                                onClick={() => setShowModal(true)}>
                                <img src={addIcon} alt="Update" className="icon-button" />
                                Статус
                            </button>

                            {/* Кнопка изменить порядок */}
                            <button className="button-control add"
                                onClick={() => { setIsEditingOrder(true); }}>
                                <img src={sortIcon} alt="Update" className="icon-button" />
                                Изменить порядок
                            </button>

                        </div>

                        {/* Поиск */}
                        <SearchInput
                            ref={searchInputRef}
                            placeholder="Поиск статуса"
                            onSearch={handleSearch}
                        />
                    </div>
                ) : (
                    // Режим изменения порядка
                    <div className="grouping-elements">
                        <button
                            className="button-control order-statuses-cancel-btn"
                            onClick={() => handleCancelOrder()}
                        >
                            Закрыть
                        </button>
                        <button className="button-control order-statuses-save-btn" onClick={handleSaveOrder}>
                            Сохранить
                        </button>
                    </div>
                )}

            </div>

            {/* Loader - Отображение анимации загрузки данных */}
            {isLoading ? <Loader isWorking={isLoading} /> : <>
                {/* Заголовки списка статусов */}
                <div className={`order-statuses-header ${isEditingOrder ? 'editing' : ''}`}>
                    <div><img src={sortIcon} alt="Update" className="order-statuses-heade-icon" /></div>
                    <div>Название</div>
                    <div>Порядок</div>
                    <div>Тип статуса</div>
                    <div>Доступен клиенту</div>
                    <div>Действия</div>
                </div>

                {/* Список статусов */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                    <SortableContext
                        items={editableStatuses}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="order-statuses-list">
                            {filteredStatuses.map((status) => (
                                <SortableItem
                                    key={status.id}
                                    status={status}
                                    isEditingOrder={isEditingOrder}
                                    onDelete={handleConfirmDelete}
                                    onEdit={handleEditStatus}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </>}

            {/* Модальное окно добавления и редактирования */}
            {showModal && (
                <OrderStatusModal
                    status={editingStatus}
                    onClose={() => {
                        setShowModal(false);
                        setEditingStatus(null);
                    }}
                    onSave={fetchStatuses}
                />
            )}

            {/* Модальное окно для отображения ошибок: удаления и редактирования */}
            <ErrorModal
                isOpen={showErrorModal}
                title="Ошибка"
                errors={errorMessages}
                onClose={() => { setShowErrorModal(false); setErrorMessages(null) }}
            />

            {/* Подтверждение удаления */}
            <ConfirmationModal
                isOpen={showConfirmation}
                title="Подтвердите удаление"
                message="Вы уверены, что хотите удалить выбранный статус?"
                onConfirm={handleDeleteClick}
                onCancel={() => { setShowConfirmation(false); setStatusToDelete(null); }}
            />

            {/* Модальное окно подтверждения ухода со страницы */}
            <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={pendingNavigation}
                onCancel={handleCancelNavigation}
            />

        </div>
    );

};

// Компонент сортируемого элемента
const SortableItem = React.memo(({ status, isEditingOrder, onDelete, onEdit }) => { // React.memo позволяет предотвратить ненужный повторный рендеринг компонентов

    /* 
    ===========================
     Константы и рефы
    ===========================
    */

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: status.id,
        disabled: !isEditingOrder // Блокировка перетаскивания
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none'
    };

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    return (
        <div ref={setNodeRef} style={style}>
            <div className={`order-statuses-item 
                ${isDragging ? 'dragging' : ''} 
                ${isEditingOrder ? 'editing' : ''}`}>
                {/* Иконка для перетаскивания */}
                {isEditingOrder && (
                    <div className="drag-handle" {...attributes} {...listeners}> {/* Перетаскивание доступно только за иконку */}
                        <img src={dragIcon} alt="drag" />
                    </div>
                )}
                <div className="order-statuses-col name">{status.name}</div>
                <div className="order-statuses-col type">
                    {status.isFinalResultPositive === null
                        ? 'Обычный'
                        : status.isFinalResultPositive
                            ? 'Успешный'
                            : 'Неудачный'}
                </div>
                <div className="order-statuses-col visibility">
                    {status.isAvailableClient ? 'Да' : 'Нет'}
                </div>
                <div className="order-statuses-actions order-statuses-col visibility">
                    <button onClick={() => onEdit(status)}>
                        <img src={editIcon} alt="Edit" />
                    </button>
                    <button onClick={() => onDelete(status.id)}>
                        <img src={deleteIcon} alt="Delete" />
                    </button>
                </div>
            </div>
        </div>
    );

});

// Компонент модального окна
const OrderStatusModal = ({ status, onClose, onSave }) => {

    /* 
    ===========================
     Состояния
    ===========================
    */

    const [formData, setFormData] = useState({ // Данные формы
        name: '',
        isFinalResultPositive: null,
        isAvailableClient: false,
        sequenceNumber: null
    });

    const [showFormDisplay, setShowFormDisplay] = useState(true); // Отображение модальноего окна

    const [initialFormData, setInitialFormData] = useState({}); // Начальные данные формы
    const [isDirty, setIsDirty] = useState(false); // Наличие несохраненных данных

    // Модальное окно для отображения ошибок: удаления и редактирования
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки

    // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
    const [showNavigationConfirmModal, setShowNavigationConfirmModal] = useState(false); // Отображение модального окна ухода со страницы
    const [pendingNavigation, setPendingNavigation] = useState(null); // Подтверждение навигации

    const [isClosingAnimation, setIsClosingAnimation] = useState(false); // Анимация закрытия модального окна

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Загрузка выбранного статуса заказа из БД
    useEffect(() => {
        const loadStatusData = async () => {
            if (status?.id) {
                try {
                    const response = await api.getOrderStatusById(status.id);
                    const data = {
                        name: response.data.name,
                        isFinalResultPositive: response.data.isFinalResultPositive,
                        isAvailableClient: response.data.isAvailableClient,
                        sequenceNumber: response.data.sequenceNumber
                    };
                    setFormData(data);
                    setInitialFormData(data);
                } catch (error) {
                    console.error('Ошибка загрузки статуса:', error);
                }
            } else { // При добавлении
                const emptyForm = {
                    name: '',
                    isFinalResultPositive: null,
                    isAvailableClient: false,
                    sequenceNumber: null
                };
                setFormData(emptyForm);
                setInitialFormData(emptyForm);
            }
        };
        loadStatusData();
    }, [status]); // При запуске модального окна запускается данный эффект

    // Проверка изменений в полях
    useEffect(() => {
        const dirty = !isEqual(formData, initialFormData);
        setIsDirty(dirty);
    }, [formData, initialFormData]); // Вызов при наличии изменений в полях или начальных данных

    // Управление отображением модального окна формы, когда пользователь пытается совершить навигацию без сохранения изменений
    useEffect(() => {
        if (showNavigationConfirmModal) {
            setShowFormDisplay(false); // При открытом модальном окне форма добавления/редактирования скрыта
        }
        else {
            setShowFormDisplay(true);
        }
    }, [showNavigationConfirmModal]);

    // Управление отображением модального окна формы, когда пользователь пытается сохранить 2 статуса с положительным финалом
    useEffect(() => {
        if (showErrorModal) {
            setShowFormDisplay(false); // При открытом модальном окне форма добавления/редактирования скрыта
        }
        else {
            setShowFormDisplay(true);
        }
    }, [showErrorModal]);

    // Блокировка закрытия страницы
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    // Обработка нажатия кнопки "Назад" в браузере
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault(); // Блокируем переход, если есть несохраненные изменения
                setPendingNavigation(() => () => {
                    handleConfirmNavigation(); // Вызываем функцию подтверждения перехода
                });
                setShowNavigationConfirmModal(true); // Показываем модальное окно подтверждения
            }
            else {
                handleConfirmNavigation();
            }
        };

        const handleConfirmNavigation = () => {
            onClose(); // Вызываем функцию подтверждения перехода
            setIsDirty(false); // Сбрасываем флаг после успешного сохранения
        };

        // Добавляем новую запись в историю для корректного отслеживания переходов
        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener("popstate", handleBackButton);

        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [isDirty, onClose]);

    // Блокируем обновление страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isDirty) {
                const confirmationMessage = 'Есть несохранённые изменения. Уйти?';
                event.returnValue = confirmationMessage; // Для старых браузеров
                return confirmationMessage; // Для современных браузеров
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Сохранить новый или обновить статус заказа
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (status) { // Если передан элемент в модальное окно, значит режим редактирования
                const response = await api.updateOrderStatus(status.id, formData);

                // Если есть конфликт - показываем ошибку
                if (response.error) {
                    setErrorMessages(response.conflicts || [response.error]);
                    setShowErrorModal(true);
                    return; // Не закрываем модалку
                }
            } else {
                const response = await api.createOrderStatus(formData);

                // Если есть конфликт - показываем ошибку
                if (response.error) {
                    setErrorMessages(response.conflicts || [response.error]);
                    setShowErrorModal(true);
                    return; // Не закрываем модалку
                }
            }
            onSave();
            onClose();
            setIsDirty(false); // Сбрасываем флаг после успешного сохранения
        } catch (error) {
            if (error.response?.data?.error) {
                setErrorMessages(error.response.data.conflicts || [error.response.data.error]);
                setShowErrorModal(true);
            } else {
                console.error('Ошибка сохранения:', error);
            }
        }
    };

    // Обработчик отмены перехода на другую страницу через модальное окно
    const handleCancelNavigation = () => {
        // Возвращаем исходный URL при отмене перехода назад через popstate браузера
        window.history.pushState(null, null, window.location.pathname);
        setShowNavigationConfirmModal(false);
    };
    
    // Обработчик закрытия через кнопку "Закрыть"
    const handleClose = () => {
        if (isDirty) {
            // Показываем модальное окно вместо confirm
            setPendingNavigation(() => () => {
                setShowNavigationConfirmModal(false);
                onClose();
            });
            setShowNavigationConfirmModal(true);
        } else {

            setIsClosingAnimation(true);
            setTimeout(() => {
                onClose(); // Закрытие модального окна
                setIsClosingAnimation(false);
            }, 300); // Длительность анимации

        }
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <>
            {/* Отображение формы */}
            {showFormDisplay && <><div className={`order-statuses-modal-overlay ${isClosingAnimation ? 'closing' : ''}`}>
                <div className="order-statuses-modal">
                    <form onSubmit={handleSubmit}>

                        <div className="order-statuses-model-title">
                            {status?.id ? 'Редактирование статуса заказа' : 'Добавить статус заказа'}
                        </div>

                        <div className="order-statuses-input-group">
                            <label>Название</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <div className="order-statuses-input-group" style={{ flex: '0 0 50%', paddingRight: '0px' }}>
                                <label>Тип статуса</label>
                                <select className="rder-statuses-modal"
                                    value={formData.isFinalResultPositive ?? ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        isFinalResultPositive: e.target.value === '' ? null : e.target.value === 'true'
                                    })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">Обычный</option>
                                    <option value="true">Успешный</option>
                                    <option value="false">Неудачный</option>
                                </select>
                            </div>

                            <div className="order-statuses-input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: '0 0 50%', paddingTop: '20px', paddingLeft: '0px' }}>
                                <label style={{ marginRight: '8px' }}>Доступен клиенту</label>
                                <input className="rder-statuses-modal"
                                    type="checkbox"
                                    checked={formData.isAvailableClient}
                                    onChange={(e) => setFormData({ ...formData, isAvailableClient: e.target.checked })}
                                />
                            </div>
                        </div>

                        <div className="order-statuses-modal-actions">
                            <button className="button-control close" type="button" onClick={handleClose}>Закрыть</button>
                            <button className="button-control save" type="submit">Сохранить</button>
                        </div>
                    </form>
                </div>

            </div> </>}

            {/* Модальное окно для отображения ошибок: удаления и редактирования */}
            <ErrorModal
                isOpen={showErrorModal}
                title="Ошибка"
                errors={errorMessages}
                onClose={() => { setShowErrorModal(false); setErrorMessages(null) }}
            />

            {/* Модальное окно подтверждения ухода со страницы */}
            <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={pendingNavigation}
                onCancel={handleCancelNavigation}
            />
        </>
    );
};


export default OrderStatuses;