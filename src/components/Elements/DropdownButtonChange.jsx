import React, { useState, useRef, useEffect } from "react";

// Импорт стилей
import "./../../styles/elements/dropdownButtonChange.css";
import "./../../styles/pages.css";

// Импорт иконок
import archiveIcon from './../../assets/icons/archive.png';

const DropdownButtonChange = () => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для управления закрытия/открытия списка
    const dropdownRef = useRef(null); // Ссылка на элемент выпадающего списка кнопки "Изменить". Для получения доступа к DOM-элементу и проверки, был ли клик вне него

    // Кнопка "изменить" с выпадающим списком функций
    const toggleDropdown = (option) => {
        setIsOpen(prev => !prev); // Переключение состояния
    };

    // Выбранная функция в раскрывающемся списке кнопки
    const handleOptionClick = () => {
        // TODO вставить выполнение функции
        setIsOpen(false); // Закрыть выпадающий список после выбора
    }

    // Хук для обработки кликов вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
        <div className="dropdown" ref={dropdownRef}>
            <button className="button-control dropdown-button" onClick={toggleDropdown}>
                Изменить
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    <div className="dropdown-option" onClick={() => handleOptionClick('Удалить')}>Удалить</div>
                    <div className="dropdown-option" onClick={() => handleOptionClick('Архивировать')}>Архивировать</div>
                    <div className="dropdown-option" onClick={() => handleOptionClick('Достать')} title="Достать из архива">Достать
                         <img src={archiveIcon} alt="Archive" className="icon-dropdown-button-archive"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownButtonChange;