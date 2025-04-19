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

//  Основной компонент
const OrderStatuses = () => {

    /* 
    ===========================
     Константы и рефы
    ===========================
    */

    const navigate = useNavigate(); // Для управления маршрутом приложения
    const location = useLocation();

    const searchInputRef = React.useRef(); // Ссылка на поле поиска

    /* 
    ===========================
     Состояния
    ===========================
    */

    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [initialData, setInitialData] = useState(null); // Исходные данные о списке статусов, которые были получены при загрузке страницы (Если таковые имеются)
    const [statuses, setStatuses] = useState([]); // Список статусов (отображаемые данные)
    const [isEditingOrder, setIsEditingOrder] = useState(false); // Режим редактирования порядка статусов
    const [searchQuery, setSearchQuery] = useState(''); // Поиск статуса заказа
    const [showModal, setShowModal] = useState(false); // Отображение модального окна для редактирования и добавления
    const [editingStatus, setEditingStatus] = useState(null); // Передача стауса для редактирования
    const [statusToDelete, setStatusToDelete] = useState(null); // Передача стауса для удаления

    const [showConfirmation, setShowConfirmation] = useState(false); // Отображение модального окна для  подтверждения удаления

    // Модальное окно для отображения ошибок: удаления и редактирования
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение 
    const [errorMessages, setErrorMessages] = useState([]); // Ошибки

    // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных через стрелку в браузере
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
        try {
            const response = await api.getOrderStatuses();
            const sortedData = response.data.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
            setInitialData({ ...response, data: sortedData });
            setStatuses(sortedData); // Всегда показываем полные данные после загрузки
        } catch (error) {
            console.error('Ошибка загрузки статусов:', error);
        }
    };

    // Окончание перетаскивания элемента
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setStatuses((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
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
            const sequenceData = statuses.map(({ id, sequenceNumber }) => ({
                id: Number(id),
                sequenceNumber: Number(sequenceNumber)
            }));

            await api.updateOrderStatusesSequence(sequenceData);

            // Обновляем начальные данные после успешного сохранения
            setInitialData(prev => ({
                ...prev,
                data: [...statuses] // Сохраняем актуальный порядок
            }));

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
                setStatuses([...initialData.data].sort((a, b) => a.sequenceNumber - b.sequenceNumber)); // Восстанавливаем исходный порядок из initialData
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
    const checkDirty = useCallback((currentData) => {
        if (!initialData) return false;
        const initialSequence = initialData.data
            .map(({ id, sequenceNumber }) => ({ id, sequenceNumber })); // Нормализация данных
        return !isEqual(initialSequence, currentData); // Проверка, изменились ли данные по отношению к первоначальным. Если да, то требуется сохранение изменения
    }, [initialData]);

    // Обработчик отмены перехода через стрелку браузера
    const handleCancelNavigation = () => {
        // Возвращаем исходный URL при отмене перехода назад через popstate браузера
        window.history.pushState(null, null, window.location.pathname);
        setShowNavigationConfirmModal(false);
    };

    // Поиск
    const handleSearch = (term) => {
        setSearchQuery(term.trim());
    };

    // Обновление данных на странице (Иконка)
    const refreshData = () => {
        fetchStatuses();
        const searchQuery = searchInputRef.current.search();  // Получаем текущее введенное значение из поля поиска
        // Применяем текущий поисковый запрос после обновления
        setSearchQuery(searchQuery); // Обновление данных с учетом поиска
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
        localStorage.setItem('isDirty', isDirty.toString());
    }, [isDirty]);

    // Обновляем состояние isDirty при изменении статусов
    useEffect(() => {
        if (initialData) {
            const currentData = statuses.map(({ id, sequenceNumber }) => ({ id, sequenceNumber }));
            const dirty = checkDirty(currentData);
            setIsDirty(dirty);
        }
    }, [statuses, initialData, checkDirty]);

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
                setStatuses([...initialData.data].sort((a, b) => a.sequenceNumber - b.sequenceNumber));
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

    // Блокируем обноывление страницы, если есть несохраненные данные
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

    // Сбрасываем режим редактирования при изменении ключа location
    useEffect(() => {
        setIsEditingOrder(false);
        setIsDirty(false);
    }, [location.key]); // location.key меняется при каждом переходе (даже на тот же URL)

    // Эффект для фильтраци
    useEffect(() => {
        if (initialData?.data) {
            let filtered = [...initialData.data];

            if (!isEditingOrder && searchQuery) {
                filtered = filtered.filter(status =>
                    status.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            setStatuses(filtered.sort((a, b) => a.sequenceNumber - b.sequenceNumber));
        }
    }, [searchQuery, initialData, isEditingOrder]);

    // useEffect(() => {
    //     if (searchQuery.trim()) {
    //         const filtered = rawStatuses.filter(status =>
    //             status.name.toLowerCase().includes(searchQuery.toLowerCase())
    //         );
    //         setStatuses(filtered);
    //     } else {
    //         setStatuses(rawStatuses);
    //     }
    // }, [searchQuery, rawStatuses]);

    // // Очистка состояния о наличии несохраненных данных при размонтировании
    // useEffect(() => {
    //     return () => {
    //         localStorage.removeItem('isDirty');
    //     };
    // }, []);

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
                                onClick={() => setIsEditingOrder(true)}>
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

            {/* Заголовки списка статусов */}
            <div className={`order-statuses-header ${isEditingOrder ? 'editing' : ''}`}>
                <div><img src={sortIcon} alt="Update" className="order-statuses-heade-icon" /></div>
                <div>Название</div>
                <div>Порядок</div>
                <div>Тип статуса</div>
                <div>Виден клиенту</div>
                <div>Действия</div>
            </div>

            {/* Список статусов */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
                <SortableContext
                    items={statuses}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="order-statuses-list">
                        {statuses.map((status) => (
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

            {/* Модальное окно подтверждения ухода со страницы через стрелку */}
            <NavigationConfirmModal
                isOpen={showNavigationConfirmModal}
                onConfirm={pendingNavigation}
                onCancel={handleCancelNavigation}
            />

        </div>
    );

};

// Компонент сортируемого элемента
const SortableItem = ({ status, isEditingOrder, onDelete, onEdit }) => {

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

};

// Компонент модального окна
const OrderStatusModal = ({ status, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        isFinalResultPositive: null,
        isAvailableClient: false,
        sequenceNumber: null
    });

    // Загрузка выбранного статуса заказа из БД
    useEffect(() => {
        const loadStatusData = async () => {
            if (status?.id) {
                try {
                    const response = await api.getOrderStatusById(status.id);
                    setFormData({
                        name: response.data.name,
                        isFinalResultPositive: response.data.isFinalResultPositive,
                        isAvailableClient: response.data.isAvailableClient,
                        sequenceNumber: response.data.sequenceNumber
                    });
                } catch (error) {
                    console.error('Ошибка загрузки статуса:', error);
                }
            }
        };
        loadStatusData();
    }, [status]);

    // Сохранить новый или обновить статус заказа
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (status) { // Если передан элемент в модальное окно, значит режим редактирования
                await api.updateOrderStatus(status.id, formData);
            } else {
                await api.createOrderStatus(formData);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Ошибка сохранения:', error);
        }
    };

    return (
        <div className="order-statuses-modal-overlay">
            <div className="order-statuses-modal">
                <form onSubmit={handleSubmit}>
                    <label>
                        Название:
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </label>

                    <label>
                        Тип статуса:
                        <select
                            value={formData.isFinalResultPositive ?? ''}
                            onChange={(e) => setFormData({
                                ...formData,
                                isFinalResultPositive: e.target.value === '' ? null : e.target.value === 'true'
                            })}
                        >
                            <option value="">Обычный</option>
                            <option value="true">Успешный</option>
                            <option value="false">Неудачный</option>
                        </select>
                    </label>

                    <label>
                        Виден клиенту:
                        <input
                            type="checkbox"
                            checked={formData.isAvailableClient}
                            onChange={(e) => setFormData({ ...formData, isAvailableClient: e.target.checked })}
                        />
                    </label>

                    <div className="modal-actions">
                        <button type="submit">Сохранить</button>
                        <button type="button" onClick={onClose}>Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default OrderStatuses;