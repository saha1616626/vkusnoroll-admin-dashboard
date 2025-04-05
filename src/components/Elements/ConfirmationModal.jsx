//  Модальное окно подтверждения действия

import React from 'react';
import './../../styles/elements/confirmationModal.css';

const ConfirmationModal = ({
    isOpen,
    title = "Подтверждение действия",
    message = "Вы уверены, что хотите выполнить это действие?",
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="confirmation-modal">
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>

                <div className="modal-body">
                    <p>{message}</p>
                </div>

                <div className="modal-footer">
                    <button className="button-control confirm-button" onClick={onConfirm}>Да</button>
                    <button className="button-control cancel-button" onClick={onCancel}>Отмена</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;