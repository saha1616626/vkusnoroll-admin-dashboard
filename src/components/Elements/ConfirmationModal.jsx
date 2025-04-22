//  Модальное окно подтверждения действия

import React, { useEffect } from 'react';
import './../../styles/elements/confirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    title = "Подтверждение действия",
    message = "Вы уверены, что хотите выполнить это действие?",
    onConfirm,
    onCancel
}) => {

    // Обработчик нажатия на Escape
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') onCancel(); // Закрыть окно при нажатии кнопки "Escape"
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [onCancel]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="confirmation-modal">
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>

                <div className="modal-body">
                    {/* Добавляем ручной перенос строки */}
                    <p>{message.split('\n').map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}</p>
                </div>

                <div className="modal-footer">
                    <button className="button-control confirm-button-ConfirmationModal" onClick={onConfirm}>Да</button>
                    <button className="button-control cancel-button-ConfirmationModal" onClick={onCancel}>Отмена</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;