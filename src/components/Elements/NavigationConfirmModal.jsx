// Модальное окно подтверждения ухода со страницы при наличии несохраненных данных

import React, { useEffect } from "react";
import './../../styles/elements/navigationConfirmModal.css';

const NavigationConfirmModal = ({
    isOpen,
    onConfirm,
    onCancel
}) => {

    // При нажатии клавиши Escape закрываем модальное окно
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyPress);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null; // Не рендерить, если isOpen=false

    return (
        <div className="navigation-modal-overlay">
            <div className="navigation-confirm-modal">
                <div className="navigation-modal-header">
                    <h3>Несохранённые изменения</h3>
                </div>

                <div className="navigation-modal-body">
                    <p>У вас есть несохранённые изменения. Вы уверены, что хотите уйти?</p>
                </div>

                <div className="navigation-modal-footer">
                    <button className="navigation-confirm-button button-control" onClick={onConfirm}>
                        Уйти
                    </button>
                    <button className="navigation-cancel-button button-control" onClick={onCancel}>
                        Остаться
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NavigationConfirmModal;
