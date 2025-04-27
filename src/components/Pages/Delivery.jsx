// Настройка доставки

import React, { useState, useEffect, useRef, useMemo } from 'react';

// Импорт компонентов
import { useYmaps } from './../Hooks/useYmaps'; // Кастомный хук для использования Яндекс карты
import ErrorModal from "../Elements/ErrorModal"; //Модальное окно для отображения ошибок

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/delivery.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'
import deleteIcon from './../../assets/icons/delete.png'
import importIcon from './../../assets/icons/import.png'
import exportIcon from './../../assets/icons/export.png'

const Delivery = () => {

    // Карта
    const ymaps = useYmaps(); // API янедкс карт
    const [zones, setZones] = useState([]); // Массив полигонов
    const [defaultPrice, setDefaultPrice] = useState(300); // Цена доставки в зоне
    const [editingZoneIndex, setEditingZoneIndex] = useState(-1); // Режим редактирования полигона
    const [isCreatingZone, setIsCreatingZone] = useState(false); // Режим создания полигона
    const mapContainerRef = useRef(null); // Ссылка на DOM-элемент
    const mapInstanceRef = useRef(null);  // Ссылка на экземпляр карты
    const mapRef = useRef(null); // Хранит экземпляр карты и DOM элемент после создания карты
    const isMountedRef = useRef(false); // Защита от двойного рендера карты
    const isCreatingRef = useRef(false); // Для актуального состояния создания зоны

    const [openZone, setOpenZone] = useState(-1); // Для аккордеона (Список зон)
    const [isFreeDelivery, setIsFreeDelivery] = useState(false); // Чекбокс бесплатной доставки
    const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(0); // Сумма заказа для бесплатной доставки
    const [deliveryInterval, setDeliveryInterval] = useState(30); // Стандартный интервал доставки
    const [isDirty, setIsDirty] = useState(false); // Для отслеживания изменений в полях

    // Модальное окно для отображения ошибок
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение модального окна 
    const [errorTitle, setErrorTitle] = useState(); // Заголовок ошибки
    const [errorMessages, setErrorMessages] = useState([]); // Сообщение ошибки


    /* 
    ===========================
     Управление картой
    ===========================
    */

    // Экспорт всех полигонов в JSON
    const handleExportZones = () => {
        const features = zones.map((zone, index) => ({
            type: "Feature",
            properties: {
                name: zone.name,
                price: zone.price,
                fill: "#0066FF",
                "fill-opacity": 0.1,
                stroke: "#0066FF",
                "stroke-width": 2
            },
            geometry: {
                type: "Polygon",
                coordinates: [
                    zone.coordinates.map(coord => [coord[1], coord[0]]) // Конвертация обратно
                ]
            }
        }));

        const geoJsonData = {
            type: "FeatureCollection",
            metadata: {
                name: "Экспорт зон доставки",
                creator: "Delivery App"
            },
            features: features
        };

        const dataStr = JSON.stringify(geoJsonData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'delivery_zones.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Импорт полигонов (один или много, JSON или GeoJSON)
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const geoJsonData = JSON.parse(event.target.result);

                if (geoJsonData.type !== 'FeatureCollection' || !Array.isArray(geoJsonData.features)) {
                    throw new Error('Некорректный формат JSON/GeoJSON');
                }

                const convertedZones = geoJsonData.features
                    .filter(feature =>
                        feature.geometry.type === 'LineString' ||
                        feature.geometry.type === 'Polygon'
                    )
                    .map((feature, index) => {
                        // Обработка координат для Polygon и LineString
                        let coordinates = [];
                        if (feature.geometry.type === 'Polygon') {
                            // Берем первый контур (игнорируем отверстия)
                            coordinates = feature.geometry.coordinates[0]
                                .map(coord => [coord[1], coord[0]]); // Конвертация координат
                        } else {
                            coordinates = feature.geometry.coordinates
                                .map(coord => [coord[1], coord[0]]);
                        }

                        return {
                            name: (feature.properties?.name || geoJsonData.metadata?.name) === 'Зона 1' ? `Зона ${index + 1}` : feature.properties?.name || geoJsonData.metadata?.name,
                            coordinates: coordinates,
                            price: feature.properties.price || defaultPrice,
                            completed: true,
                            points: coordinates.map(coord =>
                                new ymaps.Placemark(coord, {}, POINT_STYLE)
                            )
                        };
                    });

                if (convertedZones.length === 0) {
                    throw new Error('Файл не содержит подходящих объектов');
                }

                setZones(convertedZones);

                // TODO в будущем можно цвет, описание и другие характеристики зоны установить
            } catch (error) {
                setErrorTitle('Ошибка импорта');
                setErrorMessages(['Ошибка загрузки JSON/GeoJSON: ' + error.message]);
            }
        };
        reader.readAsText(file);
    };

    // Стиль меток на карте
    const POINT_STYLE = useMemo(() => ({
        preset: 'islands#blueCircleDotIcon',
        iconColor: '#0066FF',
        iconSize: [15, 15],
        strokeWidth: 2,
        draggable: true
    }), []);

    // Стиль полигона
    const POLYGON_STYLE = useMemo(() => ({
        fillColor: '#0066ff',
        fillOpacity: 0.02,       // Прозрачность заливки
        strokeColor: '#0066ff',
        strokeWidth: 1,
        hintContent: 'Зона доставки',
        interactivityModel: 'default#transparent'
    }), []);

    // Инициализация карты
    useEffect(() => {
        if (!ymaps || isMountedRef.current || !mapContainerRef.current) return; // Проверка API, повторного рендера
        isMountedRef.current = true;

        ymaps.ready(() => {
            // Уничтожаем предыдущую карту, если она существует
            if (mapInstanceRef.current) {
                mapInstanceRef.current.destroy();
            }

            // Создаем новую карту
            mapInstanceRef.current = new ymaps.Map(mapContainerRef.current, {
                center: [56.129057, 40.406635],
                zoom: 12,
                behaviors: ['default', 'scrollZoom']
            })

            const finishButton = new ymaps.control.Button({
                data: { content: 'Завершить зону' },
                options: { maxWidth: 150 }
            });

            finishButton.events.add('press', () => {
                finishZone();
                setIsCreatingZone(false); // Явное обновление состояния
                isCreatingRef.current = false;
            });

            mapInstanceRef.current.controls.add(finishButton);

            // Обработчик клика для добавления точек
            mapInstanceRef.current.events.add('click', (e) => {
                // Разрешить клики только в режиме создания
                if (!isCreatingRef.current) return;

                const coords = e.get('coords');
                setZones(prev => {
                    const lastZone = prev[prev.length - 1];

                    // Новая зона
                    if (!lastZone || lastZone.completed) {
                        return [...prev, {
                            coordinates: [coords],
                            price: defaultPrice,
                            completed: false,
                            points: [new ymaps.Placemark(coords, {})]
                        }];
                    }

                    // Добавление точки в существующую зону
                    const updatedZones = [...prev];
                    updatedZones[prev.length - 1].coordinates.push(coords);
                    updatedZones[prev.length - 1].points.push(
                        new ymaps.Placemark(coords, {})
                    );

                    return updatedZones;
                });
            });

            mapRef.current = mapInstanceRef.current; // Сохраняем экземпляр карты
        });

        return () => {
            if (mapInstanceRef.current) {
                // Полная очистка всех объектов
                mapInstanceRef.current.geoObjects.removeAll();
                mapInstanceRef.current.destroy();
                mapInstanceRef.current = null;
            }
            isMountedRef.current = false;
            setIsCreatingZone(false);
            setEditingZoneIndex(-1);
            isCreatingRef.current = false;
        };
    }, [ymaps, defaultPrice]); // Зависимости только от неизменяемых значений

    // Отрисовка зон с возможностью редактирования
    useEffect(() => {
        if (
            !mapRef.current || // Проверка на наличие карты
            !ymaps ||
            !mapRef.current.geoObjects ||  // Проверка на наличие geoObjects
            typeof mapRef.current.geoObjects.removeAll !== 'function' // Проверка метода
        ) return;

        const map = mapRef.current;
        map.geoObjects.removeAll();

        zones.forEach((zone, index) => {

            // Установка дизайна меток
            const points = zone.coordinates.map(coord =>
                new ymaps.Placemark(coord, {}, POINT_STYLE)
            );

            points?.forEach((point, pointIndex) => {

                // Показываем метки только при редактировании или создании полигона
                if (editingZoneIndex === index || (isCreatingZone && index === zones.length - 1 && !zone.completed)) {
                    map.geoObjects.add(point);
                } else {
                    map.geoObjects.remove(point);
                }

                // Отображаем линии между метками
                if (zone.coordinates.length > 1 && !zone.completed) {
                    const polyline = new ymaps.Polyline(
                        zone.coordinates
                    );
                    map.geoObjects.add(polyline);
                }

                // Добавляем возможность перетаскивания (для редактирования и добавления)
                point.options.set('draggable', editingZoneIndex === index || (isCreatingZone && index === zones.length - 1));

                // Удаляем старые обработчики
                point.events.remove('dragend');
                point.events.remove('contextmenu');

                // Обновляем координаты существующей метки (без создания новой)
                point.events.add('dragend', (e) => {
                    const newCoords = e.get('target').geometry.getCoordinates();
                    setZones(prev => prev.map(z => {
                        if (z === zone) {
                            return {
                                ...z,
                                coordinates: z.coordinates.map((c, i) =>
                                    i === pointIndex ? newCoords : c
                                )
                            };
                        }
                        return z;
                    }));
                });

                // Контекстное меню для удаления
                point.events.add('contextmenu', (e) => {
                    e.preventDefault();

                    setZones(prev => prev.map(z => {
                        if (z === zone) {
                            const newCoordinates = z.coordinates.filter((_, i) => i !== pointIndex);
                            // Удаляем зону, если точек стало меньше 3
                            if (newCoordinates.length < 3) return null;

                            return {
                                ...z,
                                coordinates: newCoordinates,
                                points: newCoordinates.map(c =>
                                    new ymaps.Placemark(c, {}, POINT_STYLE)
                                )
                            };
                        }
                        return z;
                    }).filter(Boolean)); // Фильтруем null'ы
                });

                // Проверяем завершение зоны и создаем полигон
                if (zone.completed && zone.coordinates.length >= 3) {
                    // Если полигон уже существует, просто обновляем координаты
                    const polygon = new ymaps.Polygon(
                        [zone.coordinates],
                        {
                            hintContent: `Зона ${index + 1} (${zone.price} руб)`
                        },
                        {
                            ...POLYGON_STYLE,
                            editorMaxPoints: Infinity,
                            editorDrawOver: false,
                            open: true,
                            useMapMargin: false,
                            editorMenuManager: () => []
                        }
                    );

                    map.geoObjects.add(polygon);
                }
            });
        });
    }, [zones, editingZoneIndex, POINT_STYLE, POLYGON_STYLE, isCreatingZone, ymaps]);

    // Создание полигона
    const toggleCreationMode = () => {
        setIsCreatingZone(prev => {
            if (!prev) {
                // Начало создания - добавляем пустую зону
                setZones(prevZones => [...prevZones, {
                    coordinates: [],
                    price: defaultPrice,
                    completed: false,
                    points: []
                }]);
            } else {
                // Завершение создания - проверяем точки
                finishZone();
            }
            return !prev;
        });
    };

    // Завершение создания полигона (смыкание первой и последней метки)
    const finishZone = () => {
        setZones(prev => {
            const lastZone = prev[prev.length - 1];

            if (!lastZone || lastZone.completed) return prev;

            // Проверка на минимальное количество точек
            if (lastZone.coordinates.length < 3) {
                setErrorTitle('Ошибка создания зоны');
                setErrorMessages(['Для сохранения зоны необходимо минимум 3 точки']);
                setShowErrorModal(true);
                return prev.filter((_, i) => i !== prev.length - 1);
            }

            return [
                ...prev.slice(0, -1),
                {
                    ...lastZone,
                    completed: true,
                    name: lastZone.name || `Зона ${prev.length}`
                }
            ];
        });
    };

    // Завершение редактирования полигона
    const stopEditing = () => {
        setEditingZoneIndex(-1);
    };

    // Удаление полигона
    const handleDeleteZone = (index) => {
        setZones(prev => prev.filter((_, i) => i !== index));
        setEditingZoneIndex(-1);
    };

    // Переключение аккордеона
    const toggleZone = (index) => {
        setOpenZone(prev => prev === index ? -1 : index);
    };

    /* 
    ===========================
     Управление настройками доставки
    ===========================
    */

    // Обновление названия зоны
    const handleZoneNameChange = (index, value) => {
        setZones(prev => prev.map((zone, i) =>
            i === index ? { ...zone, name: value } : zone
        ));
        setIsDirty(true);
    };

    // Сохранение всех настроек
    const handleSaveSettings = () => {
        // Проверка всех зон перед сохранением
        const invalidZones = zones.filter(zone =>
            !zone.completed || zone.coordinates.length < 3
        );

        if (invalidZones.length > 0) {
            setErrorTitle('Ошибка сохранения');
            setErrorMessages(['Некоторые зоны содержат ошибки']);
            setShowErrorModal(true);
            return;
        }

        // Логика сохранения...
        setIsDirty(false);
    };

    // const [editingZone, setEditingZone] = useState({});
    // const [isCreatingZone, setIsCreatingZone] = useState(false);

    // Обработчик режима редактирования
    const toggleEditZone = (index) => {
        setEditingZoneIndex(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
        setIsDirty(true);
    };

    /* 
    ===========================
     Рендер
    ===========================
    */

    // Загрузка API карты
    if (!ymaps) return <div>Загрузка карты...</div>;

    return (
        <div className="delivery-page">
            <div className="control-components">
                <div className="page-name">Доставка</div>
            </div>

            <div className="delivery-column-group">
                {/* Левая колонка с картой */}
                <div className="delivery-map-section">
                    <div className="delivery-settings-header">Зоны доставки</div>
                    <div ref={mapContainerRef} className="delivery-map-container" />
                </div>

                {/* Правая колонка с настройками */}
                <div className="delivery-settings-section">
                    <div className="delivery-settings-header">Настройка доставки</div>
                    <div className="delivery-settings-header-wrapper">
                        {/* Группа кнопок управления */}
                        <div className="delivery-control-buttons">
                            <button
                                className={`delivery-icon-btn ${isCreatingZone ? 'creating' : ''}`}
                                onClick={toggleCreationMode}
                            >
                                <img src={addIcon} alt="Создать" />
                                {isCreatingZone ? 'Завершить создание' : 'Новая зона'}
                            </button>

                            <label className="delivery-icon-btn">
                                <input type="file" onChange={handleFileUpload} hidden />
                                <img src={importIcon} alt="Импорт" />
                                Импорт
                            </label>

                            <button className="delivery-icon-btn" onClick={handleExportZones}>
                                <img src={exportIcon} alt="Экспорт" />
                                Экспорт
                            </button>
                        </div>
                    </div>

                    {/* Секция со списком зон */}
                    <div className="delivery-zones-section">
                        {/* Список зон с аккордеоном */}
                        <div className="delivery-zones-accordion">
                            {zones.map((zone, index) => (
                                <div key={index} className="delivery-zone-item">
                                    <div className="delivery-zone-header" onClick={() => toggleZone(index)}>
                                        <div className="delivery-zone-title">
                                            {editingZoneIndex[index] ? (
                                                <input
                                                    value={zone.name}
                                                    onChange={(e) => handleZoneNameChange(index, e.target.value)}
                                                    className="delivery-zone-edit-input"
                                                />
                                            ) : (
                                                zone.name || `Зона ${index + 1}`
                                            )}
                                        </div>

                                        <div className="delivery-zone-actions">
                                            <button
                                                className="delivery-action-btn edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleEditZone(index);
                                                }}
                                            >
                                                {editingZoneIndex[index] ? 'Сохранить' : 'Изменить'}
                                            </button>

                                            <button
                                                className="delivery-action-btn delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteZone(index);
                                                }}
                                            >
                                                <img src={deleteIcon} alt="Удалить" />
                                            </button>

                                            <span className="delivery-zone-toggle">
                                                {openZone === index ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {openZone === index && (
                                        <div className="delivery-zone-content">

                                            <div className="delivery-input-group">
                                                <label>Стоимость доставки</label>
                                                <input
                                                    type="number"
                                                    value={zone.price}
                                                    // onChange={(e) => handlePriceChange(index, e.target.value)}
                                                    disabled={!editingZoneIndex[index]}
                                                    className={editingZoneIndex[index] ? '' : 'delivery-disabled-field'}
                                                />
                                            </div>

                                            <div className="delivery-input-group">
                                                <label>Название зоны</label>
                                                <input
                                                    type="text"
                                                    value={zone.name || `Зона ${index + 1}`}
                                                    onChange={(e) => handleZoneNameChange(index, e.target.value)}
                                                />
                                            </div>

                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Секция настройки доставки */}
                    <div className="delivery-global-settings">
                        {/* Стандартная стоимость */}
                        <div className="delivery-input-group">
                            <label>Стандартная стоимость доставки</label>
                            <input
                                type="number"
                                value={defaultPrice}
                                onChange={(e) => {
                                    setDefaultPrice(e.target.value);
                                    setIsDirty(true);
                                }}
                            />
                        </div>

                        {/* Чекбокс бесплатной доставки */}
                        <div className="delivery-checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isFreeDelivery}
                                    onChange={(e) => {
                                        setIsFreeDelivery(e.target.checked);
                                        setIsDirty(true);
                                    }}
                                />
                                Бесплатная доставка
                            </label>
                        </div>

                        {/* Условие бесплатной доставки */}
                        {isFreeDelivery && (
                            <div className="delivery-input-group">
                                <label>Сумма покупки от</label>
                                <input
                                    type="number"
                                    value={freeDeliveryThreshold}
                                    onChange={(e) => {
                                        setFreeDeliveryThreshold(e.target.value);
                                        setIsDirty(true);
                                    }}
                                />
                            </div>
                        )}

                        {/* Выбор интервала доставки */}
                        <div className="delivery-input-group">
                            <label>Стандартный интервал доставки</label>
                            <select
                                value={deliveryInterval}
                                onChange={(e) => {
                                    setDeliveryInterval(e.target.value);
                                    setIsDirty(true);
                                }}
                            >
                                {[...Array(30)].map((_, i) => (
                                    <option key={i} value={(i + 1) * 10}>
                                        {(i + 1) * 10} минут
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Кнопка сохранения */}
                        <button
                            className={`delivery-save-btn ${isDirty ? 'active' : ''}`}
                            // onClick={handleSaveSettings}
                            onClick={isCreatingZone ? finishZone : toggleCreationMode}
                            disabled={!isDirty}
                        >
                            {isDirty ? 'Сохранить изменения' : 'Все изменения сохранены'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Модальное окно для отображения ошибок */}
            <ErrorModal
                isOpen={showErrorModal}
                title={errorTitle || 'Ошибка'}
                errors={errorMessages}
                onClose={() => { setShowErrorModal(false); }}
            />

        </div >
    );
};

export default Delivery;