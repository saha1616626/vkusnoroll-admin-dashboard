// Анимация загрузки данных

import React from "react";
import PropTypes from 'prop-types';

// Импорт стилей
import "./../../styles/elements/loader.css"; // Общие стили

import loadingIcon from './../../assets/icons/loading.png'

const Loader = ({ isWorking }) => (
        <div className={`loading ${isWorking ? 'rotate' : ''}`}>
            <img src={loadingIcon} alt="loadingIcon" className="loadingIcon"/>
        </div>
);

Loader.propTypes = {
    isWorking: PropTypes.func.isRequired, // обязываем передавать функцию обновления
};

export default Loader;