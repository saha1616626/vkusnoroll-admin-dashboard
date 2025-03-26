// Меню фильтра

import React from 'react';
import PropTypes from 'prop-types';
import FilterMultiSelect from './FilterMultiSelect';

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

    // Функция обработки изменения значения в поле
    const handleChange = (e) => {
        const { name, value } = e.target; // Деструктуризация для доступа к имени и значению элемента
        onFormUpdate(name, value);
    };

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

                        {filter.type === 'date-range' && (
                            <div className="filter-input-date-container">
                                <input
                                    id={`${filter.name}_start`}
                                    type="datetime-local"
                                    name={`${filter.name}_start`}
                                    value={formData[`${filter.name}_start`] || ''}
                                    onChange={(e) => handleChange(e)}
                                    className="filter-input-date"
                                />
                                -
                                <input
                                    id={`${filter.name}_start`}
                                    type="datetime-local"
                                    name={`${filter.name}_end`}
                                    value={formData[`${filter.name}_end`] || ''}
                                    onChange={(e) => handleChange(e)}
                                    className="filter-input-date"
                                />
                            </div>
                        )}

                        {filter.type === 'select' && (
                            <input
                                id={filter.name}
                                type="text"
                                placeholder={filter.placeholder || 'Выберите значение'}
                                name={filter.name}
                                value={formData[filter.name] || ''}
                                onChange={(e) => handleChange(e)}
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
      type: PropTypes.oneOf(['text', 'date-range', 'select', 'multi-select']).isRequired,
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