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
import { useNavigate } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/orderStatuses.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'
import sortIcon from './../../assets/icons/sort.png'
import editIcon from './../../assets/icons/edit.png'
import deleteIcon from './../../assets/icons/delete.png'


// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import api from '../../utils/api'; // API сервера

//  Основной компонент
const OrderStatuses = () => {

    /* 
    ===========================
     Состояния
    ===========================
    */

    const [statuses, setStatuses] = useState([]);
    const [isEditingOrder, setIsEditingOrder] = useState(false); // Режим редактирования порядка статусов
    const [searchQuery, setSearchQuery] = useState(''); // Поиск статуса заказа
    const [showModal, setShowModal] = useState(false); // Отображение модального окна для редактирования и добавления
    const [editingStatus, setEditingStatus] = useState(null);

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
            setStatuses(response.data.sort((a, b) => a.sequenceNumber - b.sequenceNumber)); // Сортировка по возрастанию номера положения в списке
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
            await api.updateOrderStatusesSequence(statuses);
            setIsEditingOrder(false);
        } catch (error) {
            console.error('Ошибка сохранения порядка:', error);
        }
    };

    // Удалить статус
    const handleDelete = async (id) => {
        try {
            await api.deleteOrderStatus(id);
            fetchStatuses();
        } catch (error) {
            console.error('Ошибка удаления:', error);
        }
    };

    // Фильтрация статусов через поиск
    const filteredStatuses = statuses.filter(status =>
        status.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Загрузка статусов при монтировании компонента
    useEffect(() => {
        fetchStatuses();
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
                    <RefreshButton title="Обновить страницу" />

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
                            placeholder="Поиск статуса"
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                ) : (
                    // Режим изменения порядка
                    <div className="grouping-elements">
                        <button
                            className="order-statuses-cancel-btn"
                            onClick={() => setIsEditingOrder(false)}
                        >
                            Отменить
                        </button>
                        <button className="order-statuses-save-btn" onClick={handleSaveOrder}>
                            Сохранить
                        </button>
                    </div>
                )}

            </div>

            {/* Заголовки списка статусов */}
            <div className="order-statuses-header">
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
                onDragEnd={handleDragEnd}>
                <SortableContext
                    items={filteredStatuses}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="order-statuses-list">
                        {filteredStatuses.map((status) => (
                            <SortableItem
                                key={status.id}
                                status={status}
                                isEditingOrder={isEditingOrder}
                                handleDelete={handleDelete}
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

        </div>
    );

};

// Компонент сортируемого элемента
const SortableItem = ({ status, isEditingOrder, handleDelete }) => {



    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: status.id,
    });

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: isEditingOrder ? 'grab' : 'default'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div className={`order-statuses-item ${isDragging ? 'dragging' : ''}`}>
                <div>{status.name}</div>
                <div>{status.sequenceNumber}</div>
                <div>
                    {status.isFinalResultPositive === null
                        ? 'Обычный'
                        : status.isFinalResultPositive
                            ? 'Успешный'
                            : 'Неудачный'}
                </div>
                <div>{status.isAvailableClient ? 'Да' : 'Нет'}</div>
                <div className="order-statuses-actions">
                    <button onClick={() => isEditingOrder(status)}>
                        <img src={editIcon} alt="Edit" />
                    </button>
                    <button onClick={() => handleDelete(status.id)}>
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
        name: status?.name || '',
        isFinalResultPositive: status?.isFinalResultPositive ?? null,
        isAvailableClient: status?.isAvailableClient || false,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (status) {
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