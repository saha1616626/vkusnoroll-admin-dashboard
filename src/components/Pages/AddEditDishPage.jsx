// Управление блюдом. Добавление или редактирование

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // useNavigate - позволяет программно изменять маршрут (навигацию) приложения, nакже позволяет передавать состояние и управлять историей переходов с помощью таких параметров, как replace (заменить текущий элемент в истории) и state (передавать дополнительные данные в маршрут). useLocation - позволяет получать доступ к объекту location, представляющему текущее местоположение (маршрут) приложения. При вызове useLocation объект включает такие свойства, как pathname, search и state.
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство.

// Импорт стилей
import "./../../styles/addEditPage.css";  // Для всех страниц добавления или редактирования данных
import "./../../styles/addEditDishPage.css"; // Основной для данной страницы

// Импорт иконок
import crossIcon from './../../assets/icons/cross.png' // Крестик

import api from '../../utils/api'; // Импорт API

const AddEditDishPage = ({ mode }) => {

    /* 
    ===========================
     Управление страницей
    ===========================
    */

    const [isDirty, setIsDirty] = useState(false); // Изменения на странице, требующие сохранения
    const [initialData, setInitialData] = useState(null); // Исходные данные о Блюде, которые были получены при загрузке страницы (Если таковые имеются)

    const { id } = useParams(); // Получаем ID только в режиме редактирования
    const navigate = useNavigate(); // Для управления маршрутом приложения

    // Обработчик для кнопки "Назад" браузера
    useEffect(() => {
        const handleBackButton = (e) => {
            if (isDirty) {
                e.preventDefault();
                if (window.confirm('Есть несохранённые изменения. Уйти?')) {
                    setIsDirty(false);
                    navigate('/menu/dishes', { replace: true });
                }
            }
        };

        window.history.pushState(null, null, window.location.pathname);
        window.addEventListener('popstate', handleBackButton);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
        };
    }, [isDirty, navigate]);

    // Сохраняем состояние о наличии несохраненных данных на странице
    useEffect(() => {
        localStorage.setItem('isDirty', isDirty.toString());
    }, [isDirty]);

    // Очистка состояния о наличии несохраненных данных при размонтировании
    useEffect(() => {
        return () => {
            localStorage.removeItem('isDirty');
        };
    }, []);

    // Инициализация данных при монтировании текущего компонента
    useEffect(() => {

        // Получаем список категорий
        const loadCategories = async () => {
            try {
                const categoriesResponse = await api.getCategories();
                const loadedCategories = categoriesResponse.data; // Получаем данные

                // Проверяем наличие данных
                if (!loadedCategories || !Array.isArray(loadedCategories)) {
                    throw new Error('Invalid categories data');
                }

                setCategories(loadedCategories);  // Устанавливаем список категорий
            } catch (error) {
                console.error('Error:', error.response ? error.response.data : error.message);
                navigate('/menu/dishes', { replace: true }); // Перенаправление при ошибке
            }
        };

        loadCategories();

        if (mode === 'edit' && id) { // Проверка режима редактирования и наличие переданного id
            const fetchDish = async () => {
                try {
                    const response = await api.getDishById(id);
                    const dish = response.data; // Получаем данные

                    // Проверяем наличие данных
                    if (!dish) {
                        throw new Error('Invalid dish data');
                    }

                    // Заполняем поля полученными данными
                    const formattedData = formatDishData(dish);
                    setFormData(formattedData); // Текущие значения в полях
                    setInitialData(formattedData); // Сохранение исходных данных
                    setIsDirty(false); // Изменений на странице, требующих сохранений, нет

                    // Устанавливаем видимость полей
                    setNutritionVisible(dish.isNutritionalValue);
                    setWeightVisible(dish.isWeight);
                    setQuantityVisible(dish.isQuantitySet);
                    setVolumeVisible(dish.isVolume);
                    setIsArchived(dish.isArchived);

                } catch (error) {
                    console.error('Error:', error.response ? error.response.data : error.message);
                    navigate('/menu/dishes', { replace: true }); // Перенаправление при ошибке
                }
            };

            fetchDish();
        }

        if (mode === 'add') {
            // Заполняем пустыми данными
            setFormData(formatDishData({})); // Текущие значения в полях
            setInitialData(formatDishData({})); // Сохранение исходных данных
        }

    }, [mode, id, navigate]); // Срабатывает при маршрутизации, изменении режима и id

    // Функция для форматирования данных блюда
    const formatDishData = (dish) => {
        return {
            name: dish.name || '',
            description: dish.description || '',
            categoryId: dish.categoryId ? Number(dish.categoryId) : '',
            isNutritionalValue: !!dish.isNutritionalValue,
            calories: dish.calories?.toString() || '',
            fats: dish.fats?.toString() || '',
            squirrels: dish.squirrels?.toString() || '',
            carbohydrates: dish.carbohydrates?.toString() || '',
            isWeight: !!dish.isWeight,
            weight: dish.weight?.toString() || '',
            isQuantitySet: !!dish.isQuantitySet,
            quantity: dish.quantity?.toString() || '',
            isVolume: !!dish.isVolume,
            volume: dish.volume?.toString() || '',
            price: dish.price?.toString() || '',
            isArchived: !!dish.isArchived,
            image: dish.image || null,
        };
    };

    // Проверка изменений, требующих сохранения
    const checkDirty = useCallback((currentData) => {
        return !isEqual(initialData, currentData); // Проверка, изменились ли данные в полях по отношению к первоначальным. Если да, то требуется сохранение изменения
    }, [initialData]);

    // Обработчик изменений в полях
    const handleInputChange = (e) => {
        const newData = { ...formData, [e.target.name]: e.target.value }; // Изменяем определенные поля
        setFormData(newData);
        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
    };

    // Блокируем закрытие страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (e) => { // Пользователь пытается покинуть страницу
            if (isDirty) { // Есть несохраненные изменения
                e.preventDefault(); // Предотвращает уход с текущей страницы
                e.returnValue = ''; // Всплывающее окно, которое предупреждает пользователя
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload); // Обработчик handleBeforeUnload добавляется к объекту window всякий раз, когда пользователь пытается покинуть страницу
        return () => window.removeEventListener('beforeunload', handleBeforeUnload); // Функция очистки, которая удаляет обработчик события, когда компонент размонтируется или когда isDirty изменяется
    }, [isDirty]); // Обработчик события будет добавляться каждый раз, когда isDirty изменяется

    // Обработчик закрытия
    const handleClose = (forceClose = false) => { // Функция принимает аргумент forceClose, по умолчанию равный false. Аргумент позволяет при необходимости принудительно закрыть окно или перейти на другую страницу, минуя любые проверки
        if (!forceClose && isDirty) { // Если есть несохраненные изменения
            if (!window.confirm('Есть несохранённые изменения. Закрыть?')) return; // Диалоговое окно с подтверждением. При отказе закрыть страницу возвращается return
        }
        navigate('/menu/dishes', { replace: true }); // Возврат пользователя на страницу dishes с удалением предыдущего маршрута
    };

    // Обработчик сохранения
    const handleSave = async () => {
        try {
            if (!formData.name || !formData.price || !formData.categoryId || formData.image === null) {
                alert('Заполните обязательные поля (помечены *)');
                return;
            }

            // Преобразуем данные перед отправкой
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                categoryId: Number(formData.categoryId),
                isNutritionalValue: Boolean(formData.isNutritionalValue),
                calories: formData.calories ? Number(formData.calories) : null,
                fats: formData.fats ? Number(formData.fats) : null,
                squirrels: formData.squirrels ? Number(formData.squirrels) : null,
                carbohydrates: formData.carbohydrates ? Number(formData.carbohydrates) : null,
                isWeight: Boolean(formData.isWeight),
                weight: formData.weight ? Number(formData.weight) : null,
                isQuantitySet: Boolean(formData.isQuantitySet),
                quantity: formData.quantity ? Number(formData.quantity) : null,
                isVolume: Boolean(formData.isVolume),
                volume: formData.volume ? Number(formData.volume) : null,
                price: Number(formData.price),
                isArchived: Boolean(formData.isArchived),
                image: formData.image.split(',')[1] || null
            };

            if (mode === 'add') {
                await api.createDish(payload);
            } else {
                await api.updateDish(id, payload);
            }

            // Обработка успешной операции
            setIsDirty(false); // Несохраненных изменений нет
            setInitialData(formData); // Обновляем начальные данные полей на странице, чтобы проверка наличия сохранения данных начиналась от них
            navigate('/menu/dishes');
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            alert('Произошла ошибка при сохранении: ' +
                (error.response?.data?.message || error.message));
        }
    }

    // Блокируем обновление страницы, если есть несохраненные данные
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isDirty) {
                const confirmationMessage = 'Есть несохранённые изменения. Уйти?';
                event.returnValue = confirmationMessage; // Для старых браузеров
                return confirmationMessage; // Для современных браузеров
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isDirty]);

    /* 
    ===========================
     Поля и прочая разметка страницы
    ===========================
    */

    const [isArchived, setIsArchived] = useState(false); // Архив
    const [nutritionVisible, setNutritionVisible] = useState(false); // Пищевая ценность
    const [weightVisible, setWeightVisible] = useState(false); // Вес
    const [volumeVisible, setVolumeVisible] = useState(false); // Объем
    const [quantityVisible, setQuantityVisible] = useState(false); // Кол-во в наборе
    const [selectedImage, setSelectedImage] = useState(null); // Выбранное изображение

    const [categories, setCategories] = useState([]); // Список категорий
    const [formData, setFormData] = useState({ // Инициализация полей
        name: '',
        description: '',
        categoryId: '',
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

    // Обработчик установки изображения на отображние при загрузке страницы
    useEffect(() => {
        if (formData?.image) { // Если изображение передано
            setSelectedImage(formData.image);
        }
    }, [formData])

    // Обработчик загрузки изображения из файлов
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {

                setSelectedImage(reader.result);

                const newData = { ...formData, image: reader.result  }; // Обновляем изображение. Сохраняем только чистый base64
                setFormData(newData); // Фиксируем изменения
                setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
            };
            reader.readAsDataURL(file);
        }
    };

    // Убрать изображение
    const handleImageRemove = () => {
        setSelectedImage(null);

        const newData = { ...formData, image: null }; // Обновляем изображение
        setFormData(newData); // Фиксируем изменения
        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
    };

    return (
        <main className="addEditPage-container">

            <div className="control-components">

                {/* Заголовок страницы */}
                <div className="page-name">{id ? 'Редактирование блюда' : 'Добавить блюдо'}</div>

                <div className="archive-close-save-group">
                    {/* Архивировать */}
                    <label className="archiving-object-container">
                        <input className="archiving-object-checkbox"
                            type="checkbox"
                            checked={isArchived}
                            onChange={(e) => {
                                setIsArchived(e.target.checked); // Установили новое значение чекбокса
                                if (!e.target.checked) { // Если чекбокс не нажат, то мы устанавливаем false
                                    // Фиксируем изменения
                                    const newData = { ...formData, isArchived: false };
                                    setFormData(newData);
                                    setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                }
                                else { // Если чекбокс нажат, то мы устанавливаем true
                                    const newData = { ...formData, isArchived: true };
                                    setFormData(newData);
                                    setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                }
                            }}
                        />
                        <div className="archiving-object-text">Архивировать</div>
                    </label>

                    <button className="button-control close" onClick={() => handleClose()}>Закрыть</button>
                    <button className="button-control save" type="submit" onClick={handleSave}>Сохранить</button>
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
                            maxLength={60}
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
                                    maxLength={300}
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
                                        min={0} step={1}
                                    />
                                </div>
                                <div className="form-group" >
                                    <label className="input-label">Категория*</label>
                                    <select
                                        name="categoryId"
                                        className="input-field"
                                        style={{ width: '20em', height: '53.2px' }}
                                        value={formData.categoryId || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Выберите категорию</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
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
                                        // Фиксируем изменения
                                        const newData = { ...formData, isNutritionalValue: false, calories: '', fats: '', squirrels: '', carbohydrates: '' };
                                        setFormData(newData);
                                        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                    }
                                    else { // Если чекбокс нажат, то мы устанавливаем true
                                        const newData = { ...formData, isNutritionalValue: true };
                                        setFormData(newData);
                                        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
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
                                                            // Фиксируем изменения
                                                            const newData = { ...formData, isWeight: false, weight: '' };
                                                            setFormData(newData);
                                                            setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                                        }
                                                        else { // Если чекбокс нажат, то мы устанавливаем true
                                                            const newData = { ...formData, isWeight: true };
                                                            setFormData(newData);
                                                            setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                                        }
                                                    } else {
                                                        setVolumeVisible(e.target.checked);
                                                        if (!e.target.checked) { // Если чекбокс === false, то все поля для него очищаются
                                                            // Фиксируем изменения
                                                            const newData = { ...formData, isVolume: false, volume: '' };
                                                            setFormData(newData);
                                                            setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                                        }
                                                        else { // Если чекбокс нажат, то мы устанавливаем true
                                                            const newData = { ...formData, isVolume: true };
                                                            setFormData(newData);
                                                            setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
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
                                        // Фиксируем изменения
                                        const newData = { ...formData, isQuantitySet: false, quantity: '' };
                                        setFormData(newData);
                                        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
                                    }
                                    else { // Если чекбокс нажат, то мы устанавливаем true
                                        const newData = { ...formData, isQuantitySet: true };
                                        setFormData(newData);
                                        setIsDirty(checkDirty(newData)); // Проверка необходимости сохранения изменений при наличии
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