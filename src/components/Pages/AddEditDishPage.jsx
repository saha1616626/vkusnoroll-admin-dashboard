// Управление блюдом. Добавление или редактирование

import React, { useEffect } from "react";

// Импорт стилей
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditDishPage.css"; // Основной для данной страницы

const AddEditDishPage = ({ onClose, pageData, setPageData }) => {

    // Блокируем закрытие страницы при ее обновлении
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Закрываем страницу
    const handleClose = () => {
        onClose();
    };

    return (
        <main className="addEditPage-container">

            <div className="control-components">
                {/* Заголовок страницы */}
                <div className="page-name">{pageData?.title || 'Добавить блюдо'}</div>

                <div className="archive-close-save-group">
                    <button className="button-control close" onClick={handleClose}>Закрыть</button>
                    <button className="button-control save" type="submit">Сохранить</button>
                </div>
            </div>



        </main>
    );
};

export default AddEditDishPage;