// Управление блюдом. Добавление или редактирование

import React, { useEffect, useState } from "react";

// Импорт стилей
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditDishPage.css"; // Основной для данной страницы

const AddEditDishPage = ({ onClose, pageData, setPageData }) => {

    /* 
    ===========================
     Управление страницей
    ===========================
    */

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

    /* 
    ===========================
     Чек бокс для архивации
    ===========================
    */

    const [isChecked, setIsChecked] = useState(false); // Чекбокс. Состояние работы

    // Клик по чекбоксу
    const handleCheckboxChange = () => {
        setIsChecked(prev => !prev);
    };


    /* 
    ===========================
     Поля и прочяя разметка страницы
    ===========================
    */
    const [nutritionVisible, setNutritionVisible] = useState(false); // Пищевая ценность
    const [weightVisible, setWeightVisible] = useState(false); // Вес
    const [volumeVisible, setVolumeVisible] = useState(false); // Объем
    const [quantityVisible, setQuantityVisible] = useState(false); // Кол-во в наборе
    const [selectedImage, setSelectedImage] = useState(null); // Выбранное изображение

    // Обработчик загрузки изображения
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <main className="addEditPage-container">

            <div className="control-components">

                {/* Заголовок страницы */}
                <div className="page-name">{pageData?.title || 'Добавить блюдо'}</div>

                <div className="archive-close-save-group">
                    {/* Архивировать */}
                    <label className="archiving-object-container">
                        <input className="archiving-object-checkbox" type="checkbox" checked={isChecked} onChange={handleCheckboxChange} />
                        <div className="archiving-object-text">Архивировать</div>
                    </label>

                    <button className="button-control close" onClick={handleClose}>Закрыть</button>
                    <button className="button-control save" type="submit">Сохранить</button>
                </div>
            </div>

            {/* Основное содержимое */}
            <div className="addEditDishPage-data">

                {/* Левая часть страницы */}

                <div className="addEditDishPage-left-column" style={{ width: '60%', paddingRight: '20px' }}>
                    <h3 className="section-title">Общие данные</h3>

                    <div className="form-group">
                        <label className="input-label">Наименование блюда*</label>
                        <input
                            type="text"
                            className="input-field"
                            style={{ width: '100%', height: '40px' }}
                        />
                    </div>

                    <div className="form-group" style={{ width: '48%' }}>
                        <label className="input-label">Описание</label>
                        <textarea
                            className="input-field"
                            style={{ width: '100%', height: '100px' }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group" style={{ width: '48%' }}>
                            <label className="input-label">Цена</label>
                            <input
                                type="number"
                                className="input-field"
                                style={{ width: '100%', height: '40px' }}
                            />
                        </div>
                        <div className="form-group" style={{ width: '48%' }}>
                            <label className="input-label">Категория</label>
                            <select className="input-field" style={{ width: '100%', height: '40px' }}>
                                <option value="">Выберите категорию</option>
                                <option>Суши</option>
                                <option>Роллы</option>
                                <option>Пицца</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ textAlign: 'center', marginTop: '20px' }}>
                        <input
                            type="file"
                            id="imageUpload"
                            hidden
                            onChange={handleImageUpload}
                            accept="image/*"
                        />
                        <label
                            htmlFor="imageUpload"
                            className="button-control upload-button"
                            style={{ width: '200px' }}
                        >
                            Загрузить изображение
                        </label>
                        {selectedImage && (
                            <img
                                src={selectedImage}
                                alt="Preview"
                                style={{
                                    width: '200px',
                                    height: '200px',
                                    marginTop: '15px',
                                    objectFit: 'cover'
                                }}
                            />
                        )}
                    </div>

                </div>

                {/* Правая часть страницы */}
                <div className="addEditDishPage-right-column" style={{ width: '40%', paddingLeft: '20px' }}>
                    <h3 className="section-title">Характеристики</h3>
                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                onChange={(e) => setNutritionVisible(e.target.checked)}
                            />
                            <span className="checkbox-caption">Пищевая ценность</span>
                        </label>

                        {nutritionVisible && (
                            <>
                                <div className="form-group">
                                    <label className="input-label">Калории</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100%', height: '40px' }}
                                    />
                                </div>
                                <div className="form-row">
                                    {['Жиры', 'Белки', 'Углеводы'].map((label) => (
                                        <div key={label} className="form-group" style={{ width: '30%' }}>
                                            <label className="input-label">{label}</label>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ width: '100%', height: '40px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="checkbox-group" style={{ marginTop: '20px' }}>
                        <div className="form-row">
                            {['Вес', 'Объем'].map((label) => (
                                <label key={label} className="checkbox-label" style={{ width: '48%' }}>
                                    <input
                                        type="checkbox"
                                        onChange={(e) =>
                                            label === 'Вес'
                                                ? setWeightVisible(e.target.checked)
                                                : setVolumeVisible(e.target.checked)
                                        }
                                    />
                                    <span className="checkbox-caption">{label}</span>
                                </label>
                            ))}
                        </div>

                        {weightVisible && (
                            <div className="form-group">
                                <label className="input-label">Вес (г)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ width: '100%', height: '40px' }}
                                />
                            </div>
                        )}

                        {volumeVisible && (
                            <div className="form-group">
                                <label className="input-label">Объем (мл)</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ width: '100%', height: '40px' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="checkbox-group" style={{ marginTop: '20px' }}>
                        <label className="checkbox-label">
                            <input 
                                type="checkbox" 
                                onChange={(e) => setQuantityVisible(e.target.checked)}
                            />
                            <span className="checkbox-caption">Количество в наборе</span>
                        </label>
                        
                        {quantityVisible && (
                            <div className="form-group">
                                <label className="input-label">Кол-во штук</label>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    style={{ width: '100%', height: '40px' }}
                                />
                            </div>
                        )}
                    </div>

                </div>


            </div>

        </main>
    );
};

export default AddEditDishPage;