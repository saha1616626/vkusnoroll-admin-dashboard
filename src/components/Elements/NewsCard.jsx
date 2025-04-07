// Список карточек новостей

import React, { useState } from 'react';

// Импорт стилей 
import "./../../styles/elements/newsCard.css"; // Общие стили

// Импорт иконок
import editIcon from './../../assets/icons/edit.png';

const NewsCard = ({ news, onEdit }) => {
    const [isSelected, setIsSelected] = useState(false);

    return (
        <div className="news-card-NewsCard">
            <div className="card-header-NewsCard">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => setIsSelected(e.target.checked)}
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
                    {news.message?.slice(0, 100)}{news.message?.length > 100 && '...'}
                </div>
            )}

            <div className="card-footer-NewsCard">
                <h4 className="post-title-NewsCard">{news.title}</h4>
                <span className="post-date-NewsCard">
                    {new Date(news.dateTimePublication).toLocaleString()}
                </span>
            </div>
        </div>
    );
};

export default NewsCard;