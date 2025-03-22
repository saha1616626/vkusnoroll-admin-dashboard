import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

// Импорт стилей
import "./../../styles/elements/dropdownColumnSelection.css";

// Импорт иконок
import resetIcon from './../../assets/icons/reset.png'

const DropdownColumnSelection = ({ options, title, defaultSelected }) => {

    const [isOpen, setIsOpen] = useState(false); // Состояние для управления открытием/закрытием списка
    const [selectedOptions, setSelectedOptions] = useState(() => {
        // Загрузка выбранных столбцов из localStorage при инициализации состояния
        const savedOptions = localStorage.getItem('selectedOptions');
        return savedOptions ? JSON.parse(savedOptions) : defaultSelected;
    }); // Сохранение выбранных опций
    const dropdownRef = useRef(null); // Ссылка на элемент выпадающего списка

    // Хук для обработки кликов вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false); // Закрыть выпадающий список
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    // Обработчик клика по чекбоксу
    const handleCheckboxChange = (option) => {
        setSelectedOptions(prev => {
            const updatedOptions = prev.includes(option)
                ? prev.filter(item => item !== option) // Деактивация опции
                : [...prev, option]; // Активировать опцию
            
            // Сохранение обновленных опций в localStorage
            localStorage.setItem('selectedOptions', JSON.stringify(updatedOptions));
            return updatedOptions;
        });
    };

    // Обработчик установки значения по умолчанию
    const handleReset = () => {
        setSelectedOptions(defaultSelected); // Установить значения по умолчанию
        localStorage.setItem('selectedOptions', JSON.stringify(defaultSelected)); // Сохранение значения по умолчанию в localStorage
    };

    const toggleDropdown = () => {
        setIsOpen(prev => !prev); // Переключение состояния
    };

    return (
        <div className="dropdown-columns" ref={dropdownRef}>
            <button className="button-control" onClick={toggleDropdown}>
                {title}
            </button>
            {isOpen && (
                <div className="dropdown-menu-columns">

                    <h4 className="dropdown-header">Настроить колонки</h4>

                    <button className="reset-button-columns" onClick={handleReset}>
                        <img src={resetIcon} alt="Reset" className="icon-reset-button-columns" />
                        Значения по умолчанию
                    </button>

                    <hr className="divider" /> {/* Разделительная линия */}

                    {options.map(option => (
                        <label key={option} className="dropdown-option-columns">
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option)}
                                onChange={() => handleCheckboxChange(option)}
                            />
                            {option}
                        </label>
                    ))}
                    
                </div>
            )}
        </div>
    );

};

DropdownColumnSelection.propTypes = {
    options: PropTypes.arrayOf(PropTypes.string).isRequired, // Массив опций для чекбоксов
    title: PropTypes.string, // Заголовок для кнопки
    defaultSelected: PropTypes.arrayOf(PropTypes.string), // Массив опций по умолчанию
};

DropdownColumnSelection.defaultProps = {
    defaultSelected: [], // Значения по умолчанию
};

export default DropdownColumnSelection;