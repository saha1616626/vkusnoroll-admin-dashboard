// Модальное окно результата удаления
import React from 'react';
import './../../styles/elements/deletionResultModal.css';

const DeletionResultModal = ({ 
    isOpen = false,
    title = "Результат операции",
    conflicts = [], 
    deleted = [], 
    onClose 
}) => {
    if (!isOpen) return null; // Не рендерить, если isOpen=false

    return (
        <div className="deletion-modal-overlay">
            <div className="deletion-modal">
                <div className="deletion-modal-header">
                    <h3>{title}</h3>
                </div>

                <div className="deletion-modal-content">
                    {/* Конфликтные элементы */}
                    {conflicts.length > 0 && (
                        <div className="section">
                            <h4>Не удалось выполнить из-за наличия связанных объектов:</h4> {/* Не удалось выполнить из-за наличия зависимостей: */}
                            <div className="scrollable-list conflict-list">
                                {conflicts.map((item, index) => (
                                    <div key={index} className="list-item conflict">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Успешно удаленные */}
                    {deleted.length > 0 && (
                        <div className="section">
                            <h4>Успешно выполнено:</h4>
                            <div className="scrollable-list success-list">
                                {deleted.map((item, index) => (
                                    <div key={index} className="list-item success">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="button-control modal-close-button" onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeletionResultModal;

