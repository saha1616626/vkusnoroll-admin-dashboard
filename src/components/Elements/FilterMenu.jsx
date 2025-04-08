// Меню фильтра

import React from 'react';
import PropTypes from 'prop-types';
import FilterMultiSelect from './FilterMultiSelect';
import FilterSelect from './FilterSelect';

// Импорт стилей
import './../../styles/elements/filterMenu.css'

const FilterMenu = ({
    isOpen,
    filters,
    formData,
    onFormUpdate,
    onSearch,
    onReset
}) => {

    // Инициализация полей дат
    const initialDateValues = {
        start: formData.date?.start || '',
        end: formData.date?.end || ''
    };

    // Функция обработки изменения значения в поле
    const handleChange = (e) => {
        const { name, value } = e.target; // Деструктуризация для доступа к имени и значению элемента
        onFormUpdate(name, value);
    };

    // Обработка изменений в полях дат
    const handleDateChange = (e, type) => {
        let value = e.target.value;

        // Автоматически выставляем время если не указано
        if (value && !value.includes('T')) {
            if (type === 'start') {
                value += 'T00:00';
            } else {
                value += 'T23:59';
            }
        }

        // Сохраняем в формате { date: { start, end } }
        const newDate = {
            ...formData.date,
            [type]: value
        };

        onFormUpdate('date', newDate);
    }

    const handleBlur = (e, options) => {
        const { name, value } = e.target;
        if (options.length > 0 && !options.includes(value)) {
            onFormUpdate(name, '');
        }
    };

    // Функция обработки изменения значения в поле MultiSelect
    const handleMultiSelectChange = (selectedValues, name) => {
        onFormUpdate(name, selectedValues); // Передаем и обновляем выбранные данные
    };

    const handleLocalSearch = (e) => {
        onSearch(formData);
    }

    const handleLocalReset = () => {
        onReset();
    };

    if (!isOpen) return null;

    return (
        <div className="filter-menu">
            <div className="filter-items">
                {filters.map((filter, index) => (
                    <div key={index} className="filter-item">
                        <label htmlFor={filter.name} className="filter-label">{filter.label}</label>

                        {filter.type === 'text' && (
                            <input
                                id={filter.name}
                                type="text"
                                placeholder={filter.placeholder || ''} // '' - для корректного сброса значений кнопкой "очистка"
                                name={filter.name}
                                value={formData[filter.name] || ''}
                                onChange={(e) => handleChange(e)}
                                onBlur={(e) => handleBlur(e, [])} // Пустой массив для обычного текстового поля
                                className="filter-input"
                            />
                        )}

                        {filter.type === 'number' && (
                            <input
                                id={filter.name}
                                type="number"
                                placeholder={filter.placeholder || ''} // '' - для корректного сброса значений кнопкой "очистка"
                                name={filter.name}
                                value={formData[filter.name] || ''}
                                onChange={(e) => handleChange(e)}
                                onBlur={(e) => handleBlur(e, [])} // Пустой массив для обычного числового поля
                                className="filter-input"
                            />
                        )}

                        {filter.type === 'date-range' && (
                            <div className="filter-input-date-container">
                                <input
                                    id={`${filter.name}_start`}
                                    type="datetime-local"
                                    name="date"
                                    value={initialDateValues.start || ''}
                                    onChange={(e) => handleDateChange(e, 'start')}
                                    className="filter-input-date"
                                />
                                -
                                <input
                                    id={`${filter.name}_start`}
                                    type="datetime-local"
                                    name="date"
                                    value={initialDateValues.end || ''}
                                    onChange={(e) => handleDateChange(e, 'end')}
                                    className="filter-input-date"
                                />
                            </div>
                        )}

                        {filter.type === 'select' && (
                            <FilterSelect
                                placeholder={filter.placeholder || 'Выберите значение'}
                                options={filter.options}
                                selectedValue={formData[filter.name] || ''}
                                onChange={(value) => handleChange({
                                    target: {
                                        name: filter.name,
                                        value: value
                                    }
                                })}
                            />
                        )}

                        {filter.type === 'multi-select' && (
                            <FilterMultiSelect
                                placeholder={filter.placeholder || ''}
                                options={filter.options}
                                selectedValues={formData[filter.name] || []}
                                onChange={(values) => handleMultiSelectChange(values, filter.name)}
                            />
                        )}

                    </div>
                ))}
            </div>

            <div className="filter-actions">
                <button className="button-control filter-button-action-search" onClick={handleLocalSearch}>
                    Поиск
                </button>
                <button className="button-control filter-button-action-clearing" onClick={handleLocalReset}>
                    Очистка
                </button>
            </div>
        </div>
    );
};

FilterMenu.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    filters: PropTypes.arrayOf(
        PropTypes.shape({
            type: PropTypes.oneOf(['text', 'number', 'date-range', 'select', 'multi-select']).isRequired,
            name: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            placeholder: PropTypes.string,
            options: PropTypes.arrayOf(PropTypes.string)
        })
    ).isRequired,
    formData: PropTypes.object.isRequired,
    onFormUpdate: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired
};

export default FilterMenu;