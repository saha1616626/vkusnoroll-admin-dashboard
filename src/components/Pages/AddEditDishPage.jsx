// Управление блюдом. Добавление или редактирование

import React, { useEffect, useState } from "react";

// Импорт стилей
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditDishPage.css"; // Основной для данной страницы

// Импорт иконок
import crossIcon from './../../assets/icons/cross.png' // Крестик

const AddEditDishPage = ({ onClose, pageData, setPageData }) => {
    const [categories, setCategories] = useState([]); // Список категорий
    const [formData, setFormData] = useState({ // Инициализация полей
        name: '',
        description: '',
        category: '',
        isNutritionalValue: false,
        calories: '',
        fats: '',
        squirrels: '',
        carbohydrates: '',
        isWeight: false,
        weight: '',
        isQuantitySet: false,
        quantity: '',
        isVolume: false,
        volume: '',
        price: '',
        isArchived: false,
        image: null
    });

    const isEditMode = !!pageData?.id; // Режим добавить или редактировать

    // Инициализация данных при монтировании текущего компонента
    useEffect(() => {
        const loadCategories = async () => { // Получаем список категорий
            try {
                const response = await fetch('http://localhost:5000/api/categories');
                const data = await response.json();
                setCategories(data.map(c => c.name)); // Устанавливаем список категорий
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };

        loadCategories();

        // Если есть данные блюда - заполняем форму
        if (pageData?.id) {
            setFormData({
                name: pageData.name || '',
                description: pageData.description || '',
                category: pageData.category || '',
                isNutritionalValue: pageData.isNutritionalValue || false,
                calories: pageData.calories?.toString() || '',
                fats: pageData.fats?.toString() || '',
                squirrels: pageData.squirrels?.toString() || '',
                carbohydrates: pageData.carbohydrates?.toString() || '',
                isWeight: pageData.isWeight || false,
                weight: pageData.weight?.toString() || '',
                isQuantitySet: pageData.isQuantitySet || false,
                quantity: pageData.quantity?.toString() || '',
                isVolume: pageData.isVolume || false,
                volume: pageData.volume?.toString() || '',
                price: pageData.price?.toString() || '',
                isArchived: pageData.isArchived || false,
                image: pageData.image || null
            });

            // Устанавливаем видимость полей
            setNutritionVisible(pageData.isNutritionalValue);
            setWeightVisible(pageData.isWeight);
            setQuantityVisible(pageData.isQuantitySet);
            setVolumeVisible(pageData.isVolume);
            setIsArchived(pageData.isArchived);
        }
    }, [pageData]);

    // Обработчик изменения полей
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value })); // Сохраняем только измененные поля
    };

    // Обработчик изображений
    useEffect(() => {
        if (pageData?.image) { // Если изображение передано
            setSelectedImage(pageData.image);
        }
    }, [pageData])

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
     Поля и прочяя разметка страницы
    ===========================
    */
    const [isArchived, setIsArchived] = useState(false); // Архив
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
                setFormData(prev => ({ ...prev, image: reader.result })); // Фиксируем выбранное изображение
            };
            reader.readAsDataURL(file);
        }
    };

    // Убрать изображение
    const handleImageRemove = () => {
        setSelectedImage(null);
    };

    return (
        <main className="addEditPage-container">

            <div className="control-components">

                {/* Заголовок страницы */}
                <div className="page-name">{pageData?.title || 'Добавить блюдо'}</div>

                <div className="archive-close-save-group">
                    {/* Архивировать */}
                    <label className="archiving-object-container">
                        <input className="archiving-object-checkbox"
                            type="checkbox"
                            checked={isArchived}
                            onChange={(e) => {
                                setIsArchived(e.target.checked); // Установили новое значение чекбокса
                                if(!e.target.checked) { // Если чекбокс не нажат, то мы устанавливаем false
                                    setFormData(prev => ({
                                        ...prev,
                                        isArchived: false
                                    }));
                                }
                                else { // Если чекбокс нажат, то мы устанавливаем true
                                    setFormData(prev => ({
                                        ...prev,
                                        isArchived: true
                                    }));
                                }
                            }} 
                            />
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
                            style={{ width: 'auto', height: '30px' }}
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Слева поля, а справа изображение */}
                    <div className="form-row" style={{ width: 'auto', justifyContent: 'space-between' }}>

                        <div style={{ width: 'auto' }}>
                            <div className="form-group">
                                <label className="input-label">Описание</label>
                                <textarea
                                    className="input-field"
                                    style={{ height: '100px' }}
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group" >
                                    <label className="input-label">Цена*</label>
                                    <input
                                        type="number"
                                        placeholder="₽"
                                        className="input-field"
                                        style={{ width: '5em', height: '30px' }}
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group" >
                                    <label className="input-label">Категория*</label>
                                    <select
                                        name="category"
                                        className="input-field"
                                        style={{ width: '20em', height: '53.2px' }}
                                        value={formData.category}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Выберите категорию</option>
                                        {categories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="image-upload-container">
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
                            >
                                Загрузить изображение
                            </label>

                            {selectedImage && (
                                <div className="image-preview-wrapper">
                                    <img
                                        src={selectedImage}
                                        alt="Preview"
                                        className="image-preview"
                                    />
                                    <button
                                        className="remove-image-btn"
                                        onClick={handleImageRemove}>
                                        <img src={crossIcon} alt="Remove" />
                                    </button>
                                </div>
                            )}

                        </div>

                    </div>

                </div>

                {/* Правая часть страницы */}
                <div className="addEditDishPage-right-column" style={{ width: '40%', paddingLeft: '20px' }}>
                    <h3 className="section-title">Характеристики</h3>

                    {/* Калории, жиры, белки и углеводы */}
                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={nutritionVisible}
                                onChange={(e) => {
                                    setNutritionVisible(e.target.checked);
                                    if (!e.target.checked) { // Если чекбокс === false, то все поля для него очищаются
                                        setFormData(prev => ({
                                            ...prev,
                                            isNutritionalValue: false,
                                            calories: '',
                                            fats: '',
                                            squirrels: '',
                                            carbohydrates: ''
                                        }));
                                    }
                                    else { // Если чекбокс нажат, то мы устанавливаем true
                                        setFormData(prev => ({
                                            ...prev,
                                            isNutritionalValue: true
                                        }));
                                    }
                                }}
                            />
                            <span className="checkbox-caption">Пищевая ценность</span>
                        </label>

                        {nutritionVisible && (
                            <>
                                <div style={{ width: '100%' }}>
                                    <div className="form-group">
                                        <label className="input-label">Калории*</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ height: '30px' }}
                                            name="calories"
                                            value={formData.calories}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-row">
                                        {[
                                            { name: 'fats', label: 'Жиры*' },
                                            { name: 'squirrels', label: 'Белки*' },
                                            { name: 'carbohydrates', label: 'Углеводы*' }
                                        ].map((field) => (
                                            <div key={field.name} className="form-group">
                                                <label className="input-label">{field.label}</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    style={{ width: 'auto', height: '30px' }}
                                                    name={field.name}
                                                    value={formData[field.name]}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Вес и объем */}
                    <div className="checkbox-group" style={{ width: 'auto', marginTop: '20px' }}>
                        <div className="form-row" style={{ gap: '15px' }}>
                            {['Вес', 'Объем'].map((label) => {
                                const fieldName = label === 'Вес' ? 'weight' : 'volume';

                                return (
                                    <div key={label} style={{
                                        width: '48%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start'
                                    }}>
                                        <label className="checkbox-label" style={{ width: '95%' }}>
                                            <input
                                                type="checkbox"
                                                checked={label === 'Вес' ? weightVisible : volumeVisible}
                                                onChange={(e) => {
                                                    if (label === 'Вес') {
                                                        setWeightVisible(e.target.checked);
                                                        if (!e.target.checked) { // Если чекбокс === false, то все поля для него очищаются
                                                            setFormData(prev => ({ ...prev, isWeight: false, weight: '' }));
                                                        }
                                                        else { // Если чекбокс нажат, то мы устанавливаем true
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                isWeight: true
                                                            }));
                                                        }
                                                    } else {
                                                        setVolumeVisible(e.target.checked);
                                                        if (!e.target.checked) { // Если чекбокс === false, то все поля для него очищаются
                                                            setFormData(prev => ({ ...prev, isVolume: false, volume: '' }));
                                                        }
                                                        else { // Если чекбокс нажат, то мы устанавливаем true
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                isVolume: true
                                                            }));
                                                        }
                                                    }
                                                }}
                                            />
                                            <span className="checkbox-caption">{label}</span>
                                        </label>

                                        <div style={{
                                            width: '95%',
                                            visibility: label === 'Вес'
                                                ? (weightVisible ? 'visible' : 'hidden')
                                                : (volumeVisible ? 'visible' : 'hidden'),
                                            opacity: label === 'Вес'
                                                ? (weightVisible ? 1 : 0)
                                                : (volumeVisible ? 1 : 0),
                                            transition: 'opacity 0.2s',
                                            height: (label === 'Вес' ? weightVisible : volumeVisible) ? 'auto' : 0
                                        }}>
                                            <div className="form-group">
                                                <label className="input-label">
                                                    {label === 'Вес' ? 'Вес (г)*' : 'Объем (мл)*'}
                                                </label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    style={{
                                                        width: '95%',
                                                        height: '30px'
                                                    }}
                                                    name={fieldName}
                                                    value={formData[fieldName]}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );

                            })}
                        </div>
                    </div>

                    <div className="checkbox-group" style={{ marginTop: '20px' }}>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={quantityVisible}
                                onChange={(e) => {
                                    setQuantityVisible(e.target.checked); // Если чекбокс === false, то все поля для него очищаются
                                    if (!e.target.checked) {
                                        setFormData(prev => ({ ...prev, isQuantitySet: false, quantity: '' }));
                                    }
                                    else { // Если чекбокс нажат, то мы устанавливаем true
                                        setFormData(prev => ({
                                            ...prev,
                                            isQuantitySet: true
                                        }));
                                    }
                                }}
                            />
                            <span className="checkbox-caption">Количество в наборе</span>
                        </label>

                        {quantityVisible && (
                            <div className="form-group">
                                <label className="input-label">Кол-во штук*</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ height: '30px' }}
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleInputChange}
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