import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// Импорт стилей
import './../../styles/elements/filterButton.css'

const FilterButton = ({ filters }) => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для управления открытием/закрытием фильтра
    const [isActive, setIsActive] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const savedState = localStorage.getItem('filterButtonState');
        if (savedState) {
            const { open, active, data } = JSON.parse(savedState);
            setIsOpen(open);
            setIsActive(active);
            setFormData(data || {});
        }
    }, []);

    // Открытие/Закрытие фильтра
    const toggleFilter = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        setIsActive(newIsOpen);
        localStorage.setItem('filterButtonState', JSON.stringify({ open: newIsOpen, active: newIsOpen, data: formData }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Срабатывает после расфокусировки с поля select
    const handleBlur = (e, options) => {
        const { name, value } = e.target;
        if (!options.includes(value)) {
            setFormData((prev) => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Выполнение поиска по выбранным значениям фильтра
    const handleSearch = () => {
        // TODO Код для выполнения поиска
    };

    // Сброс выбранных значений фильтра
    const handleReset = () => {
        setFormData({});
        localStorage.setItem('filterButtonState', JSON.stringify({ open: false, active: false, data: {} }));
    };

    return (
        <div className="filter-container">

            <button
                className={`button-control filter-button ${isActive ? 'active' : ''}`}
                onClick={toggleFilter}
            >
                Фильтрация
            </button>

            {isOpen &&
                <div className="filter-menu">
                    <div className="filter-items">
                        {filters.map((filter, index) => (
                            <div key={index} className="filter-item">

                                <label htmlFor={filter.name} className="filter-label">{filter.label}</label>
                                {filter.type === 'text' && (
                                    <input
                                        id={filter.name}
                                        type="text"
                                        placeholder={filter.placeholder || ''}
                                        name={filter.name}
                                        value={formData[filter.name] || ''}
                                        onChange={handleChange}
                                        onBlur={(e) => handleBlur(e, [])} // Пустой массив для обычного текстового поля
                                        className="filter-input"
                                    />
                                )}

                                {filter.type === 'date-range' && (
                                    <div className="filter-input-date-container">
                                        <input
                                            type="datetime-local"
                                            name={`${filter.name}_start`}
                                            value={formData[`${filter.name}_start`] || ''}
                                            onChange={handleChange}
                                            className="filter-input-date"
                                        />
                                        -
                                        <input
                                            type="datetime-local"
                                            name={`${filter.name}_end`}
                                            value={formData[`${filter.name}_end`] || ''}
                                            onChange={handleChange}
                                            className="filter-input-date"
                                        />
                                    </div>
                                )}

                                {filter.type === 'select' && (
                                    <input
                                        id={filter.name}
                                        type="text"
                                        placeholder={filter.placeholder || 'Выберите или введите значение'}
                                        name={filter.name}
                                        value={formData[filter.name] || ''}
                                        onChange={handleChange}
                                        onBlur={(e) => handleBlur(e, filter.options)} // Передаем массив опций
                                        className="filter-input"
                                        list={`${filter.name}-options`}
                                    />
                                )}

                                {filter.type === 'select' && (
                                    <datalist id={`${filter.name}-options`}>
                                        {filter.options.map((option, idx) => (
                                            <option key={idx} value={option} />
                                        ))}
                                    </datalist>
                                )}

                            </div>
                        ))}
                    </div>

                    <div className="filter-actions">
                        <button className="button-control filter-button-action-search" onClick={handleSearch}>
                            Поиск
                        </button>
                        <button className="button-control filter-button-action-clearing" onClick={handleReset}>
                            Очистка
                        </button>
                    </div>

                </div>
            }

        </div>
    );

};

FilterButton.propTypes = {
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.oneOf(['text', 'date-range', 'select']).isRequired,
            name: PropTypes.string.isRequired,
            label: PropTypes.string,  // Название фильтра
            placeholder: PropTypes.string,
            options: PropTypes.arrayOf(PropTypes.string)
        })
    ).isRequired,
};

export default FilterButton;