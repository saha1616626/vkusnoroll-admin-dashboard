// Список статусов заказов

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/orderStatuses.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'
import sortIcon from './../../assets/icons/sort.png'

// Импорт компонентов
import RefreshButton from "../Elements/RefreshButton"; // Кнопка обновления данных на странице
import SearchInput from "./../Elements/SearchInput"; // Поле поиска
import api from '../../utils/api'; // API сервера

const OrderStatuses = () => {


    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="page" style={{ marginTop: '35px', marginLeft: '1.5rem', marginRight: '1.5rem' }}>

            <div className="control-components">

                <div className="grouping-groups-elements">
                    {/* Обновить страницу */}
                    <RefreshButton title="Обновить страницу" />

                    {/* Заголовок страницы */}
                    <div className="page-name">
                        Статусы заказов
                    </div>
                </div>

                <div className="grouping-groups-elements">
                    <div className="grouping-elements">
                        {/* Кнопка добавить */}
                        <button className="button-control add" >
                            <img src={addIcon} alt="Update" className="icon-button" />
                            Статус
                        </button>

                        {/* Кнопка изменить порядок */}
                        <button className="button-control add" >
                            <img src={sortIcon} alt="Update" className="icon-button" />
                            Изменить порядок
                        </button>

                    </div>

                    {/* Поиск */}
                    <SearchInput
                        placeholder="Поиск статуса"
                    />
                </div>

            </div>

        </div>
    );

};

export default OrderStatuses;