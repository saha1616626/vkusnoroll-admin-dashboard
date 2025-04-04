import React, { useState, useRef, useEffect } from "react";

// Импорт стилей
import "./../../styles/elements/dropdownButtonChange.css";
import "./../../styles/pages.css";

// Импорт иконок
import archiveIcon from './../../assets/icons/archive.png';

const DropdownButtonChange = ({ IsArchived, onDelete, onArchive, onUnarchive }) => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для управления закрытия/открытия списка
    const dropdownRef = useRef(null); // Ссылка на элемент выпадающего списка кнопки "Изменить". Для получения доступа к DOM-элементу и проверки, был ли клик вне него

    // Кнопка "изменить" с выпадающим списком функций
    const toggleDropdown = (option) => {
        setIsOpen(prev => !prev); // Переключение состояния
    };

    // Выбранная функция в раскрывающемся списке кнопки

    // Удаление
    const handleDeleteClick = () => {
        onDelete?.();
        setIsOpen(false); // Закрыть выпадающий список после выбора
    }

    // Архивация
    const handleArchiveClick = () => {
        onArchive?.();
        setIsOpen(false); // Закрыть выпадающий список после выбора
    }

    // Разархивация
    const handleUnarchiveClick = () => {
        onUnarchive?.();
        setIsOpen(false); // Закрыть выпадающий список после выбора
    }

    // Хук для обработки кликов вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { // Если клик произошел вне элемента
                setIsOpen(false); // Закрыть выпадающий список
            }
        };

        // Обработчик события клика
        document.addEventListener('mousedown', handleClickOutside);

        // Удаление обработчика при размонтировании компонента
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, []);

    return (
        <div className="dropdown-change" ref={dropdownRef}>
            <button className="button-control" onClick={toggleDropdown}>
                Изменить
            </button>
            {isOpen && (
                <div className="dropdown-menu-change">
                    <div className="dropdown-option-change" onClick={() => handleDeleteClick()}>Удалить</div>
                    <div className="dropdown-option-change" onClick={() => handleArchiveClick()} style={{ display: IsArchived ? 'none' : ''}}>Архивировать</div>
                    <div className="dropdown-option-change" onClick={() => handleUnarchiveClick()} title="Достать из архива" 
                        style={{ display: !IsArchived ? 'none' : ''}}>Достать
                        <img src={archiveIcon} alt="Archive" className="dropdown-button-icon" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownButtonChange;