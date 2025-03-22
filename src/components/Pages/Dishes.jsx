import React from "react";

// Импорт стилей
import "./../../styles/pages.css";

// Импорт иконок
import addIcon from './../../assets/icons/add.png'

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import DropdownButtonChange from './../Elements/DropdownButtonChange'; // Кнопка "Изменить"
import SearchInput from "./../Elements/SearchInput"; // Поле поиска

const Dishes = () => {

    // Обновление страницы
    const refreshData = () => {
        // TODO логика обновления страницы

    }

    // Поиск
    const handleSearch = (item) => {
        // TODO логика поиска

    };

    return (
        <main className="page">

            {/* Обновить страницу, название, добавить, фильтрация, изменить, поиcк, архив и настройка колонок */}
            <div className="control-components">

                {/* Обновить страницу */}
                <RefreshButton onRefresh={refreshData} title="Обновить страницу"/>

                {/* Заголовок страницы */}
                <div className="page-name">
                    Блюда
                </div>

                {/* Кнопка добавить */}
                <button className="button-control add">
                    <img src={addIcon} alt="Update" className="icon-button-add" />
                    Блюдо
                </button>

                {/* Кнопка фильтра */}
                <button className="button-control filter">
                    Фильтрация
                </button>

                {/* Кнопка изменить с выпадающим списком */}
                <DropdownButtonChange />

                {/* Поиск */}
                <SearchInput placeholder="Поиск блюда" onSearch={handleSearch} />

            </div>

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах