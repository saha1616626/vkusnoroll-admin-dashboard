// Список карточек новостей

import React, { useState } from 'react';

// Импорт стилей 
import "./../../styles/elements/newsCard.css"; // Общие стили

// Импорт иконок
import editIcon from './../../assets/icons/edit.png';

const NewsCard = ({ news, onEdit, onSelect }) => {
    const [isSelected, setIsSelected] = useState(false);

    // Нажатие на чекбокс
    const handleCheckboxChange = (e) => {
        const checked = e.target.checked; // Получаем состояние чекбокса
        setIsSelected(checked);
        onSelect(news.id, checked);
    };

    return (
        <div className="news-card-NewsCard">
            <div className="card-header-NewsCard">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={handleCheckboxChange}
                    style={{ width: '17px', height: '17px' }}
                />
                <span className={`status-NewsCard ${news.isArchived ? 'archived' : ''}`}>
                    {news.isArchived ? 'В архиве' : 'Опубликовано'}
                </span>
                <button
                    className="edit-btn-NewsCard"
                    onClick={() => onEdit(news)}
                >
                    <img src={editIcon} alt="Edit" />
                </button>
            </div>

            <div className="card-divider-NewsCard"></div>

            {news.image ? (
                <img
                    src={news.image}
                    alt="Post"
                    className="post-image-NewsCard"
                />
            ) : (
                <div className="post-preview-NewsCard">
                    {news.message?.slice(0, 260)}{news.message?.length > 260 && '...'}
                </div>
            )}

            <div className="card-footer-NewsCard">
                <h4 className="post-title-NewsCard">{news.title?.slice(0, 30)}{news.title?.length > 30 && '...'}</h4>
                <span className="post-date-NewsCard">
                    {new Date(news.dateTimePublication).toLocaleDateString('ru-RU')}
                    {' '}
                    {new Date(news.dateTimePublication).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </span>
            </div>
        </div>
    );
};

export default NewsCard;