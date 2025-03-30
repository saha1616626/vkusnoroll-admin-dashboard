// Компонент для отображения архивного списка данных

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// Импорт стилей
import "./../../styles/elements/archiveStorageButton.css"; // Стили на кнопку
import "./../../styles/pages.css"; // Общие стили

// Импорт иконок
import archiveIcon from './../../assets/icons/archive.png';

const ArchiveStorageButton = ({
    onToggleArchive,
    pageId // Уникальный идентификатор страницы
}) => {

    const [isArchived, setIsArchived] = useState(false); // Состяние кнопки

    // Загрузка состояния кнопки из localStorage при монтировании компонента
    useEffect(() => {
        const savedState = localStorage.getItem(`archiveState_${pageId}`);
        const initialState = savedState === "true";

        setIsArchived(initialState); // Обновелние внутреннего состояния 
        onToggleArchive?.(initialState); // Сообщаем состояние родителю
    }, [pageId, onToggleArchive]);

    // Переключение и сохранение состояния
    const toggleArchive = () => {
        const newState = !isArchived; // Переключение состояния
        setIsArchived(newState); // Обновление состояния
        localStorage.setItem(`archiveState_${pageId}`, newState); // Сохранение нового состояния в localStorage
        onToggleArchive?.(newState);
    };

    return (
        <button
            className={`button-control archive-button ${isArchived ? 'active' : ''}`}
            onClick={toggleArchive}
        >
            <img
                src={archiveIcon}
                alt="Archive"
                className={isArchived ? "icon-button icon-archive" : "icon-button"} />
            {isArchived ? "Закрыть архив" : "Архив"} {/* Изменяем текст кнопки при нажатии */}
        </button>
    );

};

ArchiveStorageButton.propTypes = {
    onToggleArchive: PropTypes.func, // Функция обработки архива
    title: PropTypes.string, // Заголовок для кнопки
    pageId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]).isRequired
};

export default ArchiveStorageButton;