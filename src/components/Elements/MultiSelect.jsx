// Поле для выбора нескольких значений

import React, { useState } from 'react';

// Импорт стилей
import './../../styles/elements/multiSelect.css'

const MultiSelect = ({ options, selectedValues, onChange }) => {
    const [inputValue, setInputValue] = useState('');

    const handleSelect = (option) => {
        if (!selectedValues.includes(option)) {
            const newSelectedValues = [...selectedValues, option];
            onChange(newSelectedValues);
        }
    };

    const handleRemove = (option) => {
        const newSelectedValues = selectedValues.filter(value => value !== option);
        onChange(newSelectedValues);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && inputValue.trim()) {
            handleSelect(inputValue.trim());
            setInputValue('');
        }
    };

    return (
        <div className="multi-select">
            <div className="selected-values">
                {selectedValues.map(value => (
                    <span className="selected-item" key={value}>
                        {value}
                        <button onClick={() => handleRemove(value)} className="remove-item">&times;</button>
                    </span>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Добавить элемент и нажмите Enter"
                    className="filter-input"
                />
            </div>
            <div className="dropdown-multi-select">
                {options.filter(option => !selectedValues.includes(option)).map((option, index) => (
                    <div key={index} className="dropdown-item" onClick={() => handleSelect(option)}>
                        {option}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MultiSelect;
