// Настройка доставки

import React, { useState, useEffect, useRef, useMemo } from 'react';

// Импорт компонентов
import { useYmaps } from './../Hooks/useYmaps'; // Кастомный хук для использования Яндекс карты

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/delivery.css"; // Стили только для данной страницы

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

    // Новое состояние для ошибок
    const [importError, setImportError] = useState('');

    /* 
    ===========================
     Управление картой
    ===========================
    */

    // Экспорт
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

    // Обработчик загрузки файла
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
                setImportError('');

                // TODO в будущем можно цвет, описание и другие характеристики зоны установить
            } catch (error) {
                setImportError('Ошибка загрузки JSON/GeoJSON: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    // Стиль точек на карте
    const POINT_STYLE = useMemo(() => ({
        preset: 'islands#blueCircleDotIcon',
        iconColor: '#0066FF',
        iconSize: [15, 15],
        strokeWidth: 2,
        draggable: true
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

    const POLYGON_STYLE = useMemo(() => ({
        // Основные стили
        fillColor: '#0066ff',
        fillOpacity: 0.02,       // Прозрачность заливки
        strokeColor: '#0066ff',
        strokeWidth: 1,
        hintContent: 'Зона доставки',
        interactivityModel: 'default#transparent'
    }), []);


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

    // Завершение редактирования полигона
    const stopEditing = () => {
        setEditingZoneIndex(-1);
    };

    // Удаление полигона
    const handleDeleteZone = (index) => {
        setZones(prev => prev.filter((_, i) => i !== index));
        setEditingZoneIndex(-1);
    };

    // Создание полигона
    const toggleCreationMode = () => {
        setIsCreatingZone(prev => {
            isCreatingRef.current = !prev;
            return !prev;
        });
    };

    // Завершение полигона (смыкание первой и последней метки)
    const finishZone = () => {
        setZones(prev => {
            const lastZone = prev[prev.length - 1];
            if (!lastZone || lastZone.completed) return prev;

            return [
                ...prev.slice(0, -1),
                {
                    ...lastZone,
                    completed: true
                }
            ];
        });
        setIsCreatingZone(false);
        isCreatingRef.current = false;
    };

    if (!ymaps) return <div>Загрузка карты...</div>;

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="delivery-settings" style={{ display: 'flex', justifyContent: 'space-between' }}>

            {/* Карта */}
            <div ref={mapContainerRef} style={{ width: '50%', height: '500px' }} />

            <div className="controls">
                <button
                    className="create-zone-btn"
                    onClick={isCreatingZone ? finishZone : toggleCreationMode}
                >
                    {isCreatingZone ? 'Завершить зону' : 'Новая зона'}
                </button>
                <label>
                    Стандартная стоимость:
                    <input
                        type="number"
                        value={defaultPrice}
                        onChange={(e) => setDefaultPrice(e.target.value)}
                    />
                </label>

                {zones.map((zone, index) => (
                    <div key={index} className="zone-control"
                        // Zoom
                        onClick={() => {
                            const zoneCoords = zone.coordinates;
                            if (zoneCoords?.length > 0) {
                                mapRef.current.setBounds(ymaps.util.bounds.fromPoints(zoneCoords), { checkZoomRange: true });
                            }
                        }}>
                        <div className="zone-header">
                            <input
                                type="text"
                                value={zone.name || `Зона ${index + 1}`}
                                onChange={(e) => {
                                    const newZones = [...zones];
                                    newZones[index].name = e.target.value;
                                    setZones(newZones);
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (isCreatingZone || !mapRef.current || !ymaps) return;  // Блокировать, если идет создание
                                    if (editingZoneIndex === index) {
                                        stopEditing();
                                    } else {
                                        stopEditing();
                                        setEditingZoneIndex(index);
                                        // Zoom
                                        const zoneCoords = zone.coordinates;
                                        if (zoneCoords?.length > 0) {
                                            mapRef.current.setBounds(ymaps.util.bounds.fromPoints(zoneCoords), { checkZoomRange: true });
                                        }
                                    }

                                }}
                                disabled={isCreatingZone}
                            >
                                {editingZoneIndex === index ? 'Закончить' : 'Изменить форму'}
                            </button>
                            <button
                                className="delete-btn"
                                onClick={() => handleDeleteZone(index)}
                            >
                                Удалить
                            </button>
                        </div>
                        <input
                            type="number"
                            value={zone.price}
                            onChange={(e) => {
                                const newZones = [...zones];
                                newZones[index].price = Number(e.target.value);
                                setZones(newZones);
                            }}
                        />
                    </div>
                ))}

                <div className="import-section">
                    <label className="import-btn">
                        Загрузить зоны из файла
                        <input
                            type="file"
                            accept=".json,.geojson"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {importError && <div className="error-message">{importError}</div>}
                </div>

                <button onClick={handleExportZones} className="export-btn">
                    Экспортировать зоны
                </button>

            </div>

        </div>
    );
};

export default Delivery;