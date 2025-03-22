// Компонент - поле для поиска

import React, { useState } from 'react';

// Импорт стилей
import "./../../styles/elements/searchInput.css";

const SearchInput = ({ placeholder, onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Нажатие на Enter после ввода текста
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (onSearch) {
                onSearch(searchTerm);
            }
        }
    };
    
    // Нажатие на крестик для очистки поля для ввода
    const handleClearInput = () => {
        setSearchTerm(''); // Сброс состояния 
        if(onSearch) {
            onSearch(''); // Вызов функции поиска с пустым значением
        }
    }

    return (
        <div className="search-container">
            <input
                type="text"
                className="search-input"
                placeholder={placeholder} // Переданное значение
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
            />
            {/* Крестик для сброса ввода */}
            {searchTerm && ( // // Условное отображение крестика
                <button className="clear-button" onClick={handleClearInput}>
                    &times;
                </button>
            )}
        </div>
    );

}

export default SearchInput;