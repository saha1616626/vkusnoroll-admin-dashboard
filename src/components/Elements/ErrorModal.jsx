// Модальное окно для вывода ошибок

import React from 'react';
import './../../styles/elements/errorModal.css';

const ErrorModal = ({
    isOpen,
    title = "Ошибка",
    errors = [],
    onClose
}) => {
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