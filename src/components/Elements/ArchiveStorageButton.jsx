// Компонент для отображения архивного списка данных

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// Импорт стилей
import "./../../styles/elements/archiveStorageButton.css"; // Стили на кнопку
import "./../../styles/pages.css"; // Общие стили

// Импорт иконок
import archiveIcon from './../../assets/icons/archive.png';

const ArchiveStorageButton = ({ onToggleArchive, title }) => {

    // Состяние кнопки
    const [isArchived, setIsArchived] = useState(false);

    // Загрузка состояния кнопки из localStorage при монтировании компонента
    useEffect(() => {
        const archivedState = localStorage.getItem('isArchived');
        if (archivedState !== null) {
            setIsArchived(JSON.parse(archivedState));
        }
    }, []);

    // Функция для переключения состояния кнопки
    const toggleArchive = () => {
        const newArchivedState = !isArchived; // Переключение состояния
        setIsArchived(newArchivedState); // Обновление состояния

        if (onToggleArchive) {
            onToggleArchive(newArchivedState); // Вызов функции для обработки архива
        }

        localStorage.setItem('isArchived', JSON.stringify(newArchivedState)); // Сохранение нового состояния в localStorage
    };

    return (
        <button
            className={`button-control archive-button ${isArchived ? 'active' : ''}`}
            onClick={toggleArchive}
            title={isArchived ? "Закрыть архив" : "Открыть архив"}
        >
            <img src={archiveIcon} alt="Archive" className={ isArchived ? "icon-button icon-archive" : "icon-button"}/>
            {isArchived ? "Закрыть архив" : "Архив"} {/* Изменяем текст кнопки при нажатии */}
        </button>
    );

};

ArchiveStorageButton.propTypes = {
    onToggleArchive: PropTypes.func.isRequired, // Функция обработки архива
    title: PropTypes.string, // Заголовок для кнопки
};

export default ArchiveStorageButton;