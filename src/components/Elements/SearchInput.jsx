// Компонент - поле для поиска

import React, { forwardRef, useImperativeHandle, useState } from 'react';
import PropTypes from 'prop-types';

// Импорт стилей
import "./../../styles/elements/searchInput.css";

const SearchInput = forwardRef (({ onChange, placeholder, onSearch }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const inputRef = React.useRef();

    // Экспортируем методы для родителя
    useImperativeHandle(ref, () => ({
        clearAndUpdate: () => {
            setSearchTerm('');
            inputRef.current.value = '';
            onSearch(''); // Вызов функции поиска с пустым значением
        },
        clear: () => {
            setSearchTerm('');
            inputRef.current.value = '';
        }
    }));

    const handleInputChange = (event) => {
        setSearchTerm(event.target.value);
        // if(event.target.value.trim() === ''){ // Обновление списка таблицы, если нет значений в поле
        //     onSearch('');
        // }
    };

    // Нажатие на Enter после ввода текста
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            onSearch(searchTerm);
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
                ref={inputRef}
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

});

SearchInput.propTypes = {
    onSearch: PropTypes.func.isRequired,
    placeholder: PropTypes.string
};

export default SearchInput;