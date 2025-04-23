// Настройка графика работы

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/schedule.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'
import deleteIcon from './../../assets/icons/delete.png'

// Импорт компонентов
import api from '../../utils/api'; // API сервера
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import ConfirmationModal from '../Elements/ConfirmationModal'; // Окно для подтверждения удаления
import ErrorModal from "../Elements/ErrorModal"; //Модальное окно для отображения ошибок
import NavigationConfirmModal from "../Elements/NavigationConfirmModal"; // Модальное окно подтверждения ухода со страницы при наличии несохраненных данных
import Loader from '../Elements/Loader'; // Анимация загрузки данных

const Schedule = () => {

    /* 
    ===========================
     Константы и рефы
    ===========================
    */

    const navigate = useNavigate(); // Для управления маршрутом приложения
    const location = useLocation();
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных

    /* 
    ===========================
     Состояния
    ===========================
    */

    const [isLoading, setIsLoading] = useState(true); // Анимация загрузки данных
    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [initialData, setInitialData] = useState(null); // Исходные данные о списке статусов, которые были получены при загрузке страницы (Если таковые имеются)

    const [rawData, setRawData] = useState([]); // Оригинальные данные с сервера
    const [filteredData, setFilteredData] = useState([]); // Отфильтрованные данные для отображения
    const [editableData, setEditableData] = useState([]); // Данные в режиме редактирования

    const [showModal, setShowModal] = useState(false); // Отображение модального окна для редактирования и добавления
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Отображение модального окна для подтверждения удаления

    const [restaurantWorkingTimeToDelete, setRestaurantWorkingTimeToDelete] = useState(null); // Передача объекта для удаления

    /* 
    ===========================
     Управление данными
    ===========================
    */

    // Функция загрузки данных из БД
    const fetchData = async () => {
        setIsLoading(true); // Включаем анимацию загрузки данных
        try {
            const response = await api.getListRestaurantWorkingTime();
            const sortedData = response.data;

            setRawData(sortedData);
            setFilteredData(sortedData);
            setEditableData(sortedData);
            setInitialData({ ...response, data: sortedData });
        } catch (error) {
            console.error('Ошибка загрузки статусов:', error);
        } finally { // Выключаем анимацию загрузки данных
            setTimeout(() => setIsLoading(false), timeOut);
        }
    }

    // Обновление данные на странице (Иконка)
    const refreshData = async () => {
        await fetchData().then(() => {
            // Обновление данных с применением фильтров

        });
    };

    // Обработчик вызова модального окна для подтверждения удаления времени
    const handleDeleteInit = async () => {
        setShowDeleteConfirm(true); // Запуск модального окна
    }

    // Обработчик удаления рабочего времени в модальном окне
    const handleConfirmDelete = async () => {
        try {
            api.deleteClient(formData.id); // Удаление сотрудника
            setShowDeleteConfirm(false); // Скрытие модального окна
            navigate('/settings/users', { replace: true });
        } catch (error) {
            const message = error.response?.data?.error || 'Ошибка удаления';
            setErrorMessages([message]);
            setShowErrorModal(true);
        }
    }

    return (
        <div className="page" style={{ marginTop: '35px', marginLeft: '1.5rem', marginRight: '1.5rem' }}>

            <div className="grouping-groups-elements">
                {/* Обновить страницу */}
                <RefreshButton title="Обновить страницу" onRefresh={refreshData} />

                {/* Заголовок страницы */}
                <div className="page-name">
                    График работы
                </div>
            </div>

            <div className="grouping-groups-elements">
                {/* Кнопка добавить */}
                <button className="button-control add"
                    onClick={() => setShowModal(true)}>
                    <img src={addIcon} alt="Update" className="icon-button" />
                    Расписание
                </button>

                {/* Кнопка удалить */}
                <button className="button-control add"
                    onClick={() => handleDeleteInit()}>
                    <img src={addIcon} alt="Update" className="icon-button" />
                    Расписание
                </button>
            </div>

            {/* Подтверждение удаления */}
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                title="Подтвердите удаление"
                message="Вы уверены, что хотите удалить выбранный статус?"
                onConfirm={handleConfirmDelete}
                onCancel={() => { setShowDeleteConfirm(false); setRestaurantWorkingTimeToDelete(null); }}
            />

        </div>
    );
};

export default Schedule;