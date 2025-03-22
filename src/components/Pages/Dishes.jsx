import React from "react";

// Импорт стилей
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/dishes.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import DropdownButtonChange from './../Elements/DropdownButtonChange'; // Кнопка "Изменить"
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import ArchiveStorageButton from "../Elements/ArchiveStorageButton"; // Просмотр архива
import DropdownColumnSelection from "../Elements/DropdownColumnSelection"; // Выбор колонок для отображения таблицы

const Dishes = () => {

    // Обновление страницы
    const refreshData = () => {
        // TODO логика обновления страницы

    }

    // Поиск
    const handleSearch = (term) => {
        // TODO логика поиска

    };

    // Архивный список
    const handleToggleArchive = (isArchived) => {
        // TODO логика вывода архивного списка в зависимости от статуса 
    }

    // Массив колонок для отображения
    const columnOptions = ['Название', 'Дата', 'Статус', 'Наименование', 'Наименование большое'];
    // Значения колонок по умолчанию
    const defaultColumns = ['Название']; // Значения по умолчанию

    return (
        <main className="page">

            {/* Обновить страницу, название, добавить, фильтрация, изменить, поиcк, архив и настройка колонок */}
            <div className="control-components">

                {/* Обновить страницу */}
                <RefreshButton onRefresh={refreshData} title="Обновить страницу" />

                {/* Заголовок страницы */}
                <div className="page-name">
                    Блюда
                </div>

                <div className="add-filter-change-group">
                    {/* Кнопка добавить */}
                    <button className="button-control add">
                        <img src={addIcon} alt="Update" className="icon-button" />
                        Блюдо
                    </button>

                    {/* Кнопка фильтра */}
                    <button className="button-control filter">
                        Фильтрация
                    </button>

                    {/* Кнопка изменить с выпадающим списком */}
                    <DropdownButtonChange />
                </div>

                {/* Поиск */}
                <SearchInput placeholder="Поиск блюда" onSearch={handleSearch} />

                <div className="archive-settings-group">
                    {/* Архив */}
                    <ArchiveStorageButton onToggleArchive={handleToggleArchive} title="Архив" />

                    {/* Настройка колонок */}
                    <DropdownColumnSelection options={columnOptions} title="Колонки" defaultSelected={defaultColumns} />
                </div>


            </div>

        </main>
    );
};

export default Dishes; // Делаем компонент доступным для импорта в других файлах