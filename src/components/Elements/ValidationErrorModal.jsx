// Модальное окно вывода ошибки ввода при сохранении данных

import React, { useEffect } from 'react';
import './../../styles/elements/validationErrorModal.css';

const ValidationErrorModal = ({ errors, onClose, isOpen }) => {
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

    if (!isOpen) return null; // Не рендерить, если isOpen=false

    return (
        <div className="validation-modal-overlay">
            <div className="validation-modal">
                <div className="validation-modal-header">
                    <h3>Ошибки заполнения</h3>
                    <button className="validation-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="validation-modal-content">
                    <p>Пожалуйста, заполните обязательные поля:</p>
                    <ul>
                        {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>

                <div className="validation-modal-footer">
                    <button className="button-control validation-confirm-button" onClick={onClose}>Закрыть</button>
                </div>
            </div>
        </div>
    );
}

export default ValidationErrorModal;