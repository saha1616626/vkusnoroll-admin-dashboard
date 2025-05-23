// Модальное окно для вывода ошибок

import React, { useEffect } from 'react';
import './../../styles/elements/errorModal.css';

const ErrorModal = ({
    isOpen,
    title = "Ошибка",
    errors = [],
    onClose
}) => {

    // Обработчик нажатия на Escape
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') onClose(); // Закрыть окно при нажатии кнопки "Escape"
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onClose]);

    // Убираем скролл с перекрытой страницы
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('no-scroll');
            return () => document.body.classList.remove('no-scroll');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="error-modal-ErrorModal">
                <div className="modal-header-ErrorModal">
                    <h3>{title}</h3>
                    <button className="close-icon-ErrorModal" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {errors.length > 0 && (
                        <ul className="error-list-ErrorModal">
                            {errors.map((error, index) => (
                                <li key={index} className="error-item-ErrorModal">
                                    {error}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="modal-footer-ErrorModal">
                    <button
                        className="button-control close-button-ErrorModal"
                        onClick={onClose}
                    >
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;