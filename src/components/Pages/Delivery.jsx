// Настройка доставки

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Импорт компонентов
import { useYmaps } from './../Hooks/useYmaps'; // Кастомный хук для использования Яндекс карты
import ErrorModal from "../Elements/ErrorModal"; //Модальное окно для отображения ошибок
import isEqual from 'lodash/isEqual';  // Сравнивает два значения (обычно объекты или массивы) на глубокое равенство
import Loader from '../Elements/Loader'; // Анимация загрузки данных
import api from '../../utils/api'; // API сервера

// Импорт стилей 
import "./../../styles/pages.css"; // Общие стили
import "./../../styles/delivery.css"; // Стили только для данной страницы

// Импорт иконок
import addIcon from './../../assets/icons/add.png'
import deleteIcon from './../../assets/icons/delete.png'
import importIcon from './../../assets/icons/import.png'
import exportIcon from './../../assets/icons/export.png'
import checkedIcon from './../../assets/icons/checked.png'

const Delivery = () => {

    // Карта
    const ymaps = useYmaps(); // API янедкс карт
    const mapContainerRef = useRef(null); // Ссылка на DOM-элемент
    const mapInstanceRef = useRef(null);  // Ссылка на экземпляр карты
    const mapRef = useRef(null); // Хранит экземпляр карты и DOM элемент после создания карты
    const isMountedRef = useRef(false); // Защита от двойного рендера карты
    const isCreatingRef = useRef(false); // Для актуального состояния создания зоны

    // Состояния
    const [openZone, setOpenZone] = useState(-1); // Для аккордеона (Список зон)
    const [editingZoneIndex, setEditingZoneIndex] = useState(-1); // Режим редактирования полигона. (-1) - режим выключен
    const [isCreatingZone, setIsCreatingZone] = useState(false); // Режим создания полигона
    // Модальное окно для отображения ошибок
    const [showErrorModal, setShowErrorModal] = useState(false); // Отображение модального окна 
    const [errorTitle, setErrorTitle] = useState(); // Заголовок ошибки
    const [errorMessages, setErrorMessages] = useState([]); // Сообщение ошибки

    // Формат данных (Для инициализации страницы без ошибок
    const dataFormat = {
        zones: [], // Массив зон доставки
        defaultPrice: '', // Стандартная стоимость
        isFreeDelivery: null, // Бесплатная доставка
        freeDeliveryThreshold: '', // Сумма для бесплатной доставки
        deliveryInterval: '' // Интервал в минутах
    };

    const [isDirty, setIsDirty] = useState(false); // Для отслеживания изменений в полях
    const [draftZones, setDraftZones] = useState([]); // Отображение полигонов
    const [formData, setFormData] = useState(dataFormat);
    const [initialData, setInitialData] = useState(dataFormat); // Исходные данные, которые были получены при загрузке страницы (Если таковые имеются)

    const [isLoading, setIsLoading] = useState(true); // Анимация загрузки данных
    const timeOut = 500; // Задержка перед отключением анимации загрузки данных
    const location = useLocation();

    // Стили

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

    /* 
    ===========================
     Управление данными
    ===========================
    */

    // Функция загрузки данных из БД
    const fetchData = useCallback(async () => {
        try {
            const response = await api.getSettings();
            const sortedData = response.data;

            if (sortedData) {
                // Обрабатываем полученные данные
                const serverDataSettings = {
                    zones: sortedData.zones, // Массив зон доставки
                    defaultPrice: sortedData.defaultPrice, // Стандартная стоимость
                    isFreeDelivery: sortedData.isFreeDelivery, // Бесплатная доставка
                    freeDeliveryThreshold: sortedData.freeDeliveryThreshold, // Сумма для бесплатной доставки
                    deliveryInterval: sortedData.deliveryInterval // Интервал в минутах
                }

                setFormData(serverDataSettings);
                setInitialData(serverDataSettings);

                // Устанавливаем список зон
                setDraftZones(sortedData.zones.map(zone => {
                    if (!ymaps) return zone; // Защита от отсутствия API
                    return {
                        ...zone,
                        completed: true, // Помечаем зоны как завершенные
                        points: zone.coordinates.map(coord =>
                            new ymaps.Placemark(coord, {}, POINT_STYLE)
                        )
                    };
                }));
            }
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            setErrorTitle('Ошибка загрузки');
            setErrorMessages(['Не удалось получить данные']);
            setShowErrorModal(true);
        } finally { // Выключаем анимацию загрузки данных
            setIsLoading(false); // Задержка недопустима, иначе карта не прогрузится
        }
    }, [POINT_STYLE, ymaps]);

    /* 
    ===========================
     Управление картой
    ===========================
    */

    // Экспорт всех полигонов в JSON
    const handleExportZones = async () => {
        try {
            const features = draftZones.map((zone, index) => ({
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
                        zone.coordinates.map(coord => [coord[1], coord[0]]) // Конвертация координат обратно
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

            // Запрос на выбор места сохранения
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] },
                    }],
                    suggestedName: 'delivery_zones.json'
                });

                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                // Фоллбек вариант для старых браузеров
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'delivery_zones.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                setErrorTitle('Ошибка экспорта');
                setErrorMessages([err.message]);
                setShowErrorModal(true);
            }
        }
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
                    throw new Error('Некорректный формат JSON или GEOJSON');
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
                                .map(coord => [coord[1], coord[0]]); // Конвертация координат. Меняем местами широту и долготу. Под формат Яндекс Конструктор
                        } else {
                            coordinates = feature.geometry.coordinates
                                .map(coord => [coord[1], coord[0]]);
                        }

                        return {
                            name: feature.properties?.name || `Зона ${draftZones?.length + index + 1}` || `Зона ${index + 1}`,
                            coordinates: coordinates,
                            price: feature.properties?.price || formData.defaultPrice,
                            completed: true,
                            points: coordinates.map(coord =>
                                new ymaps.Placemark(coord, {}, POINT_STYLE)
                            )
                        };
                    });

                if (convertedZones.length === 0) {
                    throw new Error('Файл не содержит подходящих объектов');
                }

                // Обновляем draftZones
                setDraftZones(prev => {
                    const updatedZones = [
                        ...prev,
                        ...convertedZones.map(zone => ({
                            ...zone,
                            completed: true
                        }))
                    ];

                    // Синхронизируем formData с новыми зонами
                    setFormData(formPrev => ({
                        ...formPrev,
                        zones: updatedZones.map(zone => ({
                            name: zone.name,
                            coordinates: zone.coordinates,
                            price: zone.price
                        }))
                    }));

                    return updatedZones;
                });

                // TODO в будущем можно цвет, описание и другие характеристики зоны установить
            } catch (error) {
                setErrorTitle('Ошибка импорта');
                setErrorMessages(['Ошибка загрузки: ' + error.message]);
                setShowErrorModal(true);
            }
        };
        reader.readAsText(file);
    };

    // Валидация зоны
    const validateZone = useCallback((zone) => {
        const errors = [];
        if (!zone) { // Если нет маркеров
            errors.push('Для сохранения зоны необходимо минимум 3 точки');
            return errors;
        }
        if (zone.coordinates.length < 3) {
            errors.push('Для сохранения зоны необходимо минимум 3 точки');
        }
        if (!zone.name?.trim()) {
            errors.push('Название зоны не может быть пустым');
        }
        if (isNaN(zone.price) || zone.price <= 0) {
            errors.push('Стоимость доставки некорректна');
        }

        return errors;
    }, []);

    // Завершение создания полигона
    const finishZone = useCallback(() => {
        setDraftZones(prev => {
            const lastZone = prev[prev.length - 1]; // Получаем последнюю зону из массива
            if (!lastZone) return prev; // Если последняя зона не существует, возвращаем состояние prev без изменений

            // Валидация зоны перед создаением полигона 
            const errors = validateZone(lastZone);
            if (errors.length > 0) {
                setErrorTitle('Ошибка создания зоны');
                setErrorMessages(errors);
                setShowErrorModal(true);
                return prev;
            }

            // Возвращаем карту в исходное положение
            mapRef.current?.setCenter([56.129057, 40.406635]);
            mapRef.current?.setZoom(12);

            return prev.map((zone, index) =>
                index === prev.length - 1
                    ? { ...zone, completed: true }
                    : zone // Если это последняя зона - помечаем как завершенную и создаем полигон, инчае зона возвращается без изменений
            );
        });

        // Выключаем режим редактирования и создания
        setIsCreatingZone(false);
        isCreatingRef.current = false;
        setEditingZoneIndex(-1);
    }, [validateZone]);

    // Инициализация карты
    useEffect(() => {
        if (!ymaps || isMountedRef.current || !mapContainerRef.current) return; // Проверка API, повторного рендера
        isMountedRef.current = true; // Устанавливаем флаг, что компонент cмонтирован и повторный рендер запрещен

        ymaps.ready(() => {
            // Уничтожаем предыдущую карту, если она существует
            if (mapInstanceRef.current) mapInstanceRef.current.destroy();

            // Создаем новую карту
            mapInstanceRef.current = new ymaps.Map(mapContainerRef.current, {
                center: [56.129057, 40.406635],
                zoom: 12,
                behaviors: ['default', 'scrollZoom']
            })

            // Обработчик клика для добавления меток
            mapInstanceRef.current.events.add('click', (e) => {
                // Разрешить клики только в режиме создания
                if (!isCreatingRef.current) return; // Если режим создания полигона выключен, то функция дальше не выполняется

                const coords = e.get('coords'); // Получаем координаты после клика по карте
                // Сохраняем метку на для дальнейшего отображения на карте
                setDraftZones(prev => {
                    const lastZone = prev[prev.length - 1]; // Получаем последнюю зону из массива
                    let newZones = [...prev]; // Создаём копию массива зон

                    if (!lastZone || lastZone.completed) { // Если нет последней зоны (undefined) или последняя зона завершена, то создается новая зона
                        newZones.push({
                            coordinates: [coords], // Координаты
                            price: formData.defaultPrice, // Стоимость доставки
                            completed: false, // Зона не завершена
                            points: [new ymaps.Placemark(coords, {})], // Массив с новым маркером, который представляет первую точку новой зоны
                            name: `Зона ${newZones.length + 1}` // Название зоны исходя из количества зон в массиве (с учетом новой добавленной зоны)
                        });
                    } else { // Если есть последняя зона и она не завершена, то в нее добавляется новый маркер с координатами
                        const updatedZone = {
                            ...lastZone,
                            coordinates: [...lastZone.coordinates, coords], // Координаты нового маркера добавляются в конец
                            points: [...lastZone.points, new ymaps.Placemark(coords, {})] // Новый маркер добавляется в конец
                        };
                        newZones[newZones.length - 1] = updatedZone; // Обновляем последнюю зону массива зон
                    }

                    return newZones; // Возврат нового массива newZones
                });
            });

            mapRef.current = mapInstanceRef.current; // Сохраняем экземпляр карты
        });
    }, [ymaps, formData.defaultPrice, finishZone]); // Зависимости только от неизменяемых значений

    // Отрисовка зон с возможностью редактирования
    useEffect(() => {
        if (
            !mapRef.current || // Проверка на наличие карты
            !ymaps || //  Существует ли объект ymaps
            !mapRef.current.geoObjects ||  // Проверка на наличие geoObjects в текущем объекте карты (является коллекцией всех геообъектов на карте)
            typeof mapRef.current.geoObjects.removeAll !== 'function' // Проверка метода removeAll для объекта geoObjects 
        ) return;

        const map = mapRef.current; // Получаем объект карты
        map.geoObjects.removeAll(); // Удаление всех геообъектов из коллекции

        draftZones.forEach((zone, index) => {

            // Создание массива маркеров для предоставленных координат
            const points = zone.coordinates.map(coord =>
                new ymaps.Placemark(coord, {}, POINT_STYLE) // Placemark - маркер
            );

            // Прохождение всех маркеров по циклу
            points?.forEach((point, pointIndex) => {

                // Устанавливаем метки только при редактировании или создании полигона
                if (editingZoneIndex === index || (isCreatingZone && index === draftZones.length - 1 && !zone.completed)) {
                    map.geoObjects.add(point);
                } else { // В пассивном режиме отключаем маркеры
                    map.geoObjects.remove(point);
                }

                // Устанавливаем линии между маркерами
                if (zone.coordinates.length > 1 && !zone.completed) { // Координат больше 1, и зона не завершена
                    const polyline = new ymaps.Polyline( // Polyline - линия. 
                        zone.coordinates
                    );
                    map.geoObjects.add(polyline);
                }

                // Перетаскивание маркера в режиме редактирования и добавления зоны
                point.options.set('draggable',
                    editingZoneIndex === index // Индекс текущей зоны в цикле совпадает с редактируемой
                    || (isCreatingZone && index === draftZones.length - 1)); // Режим создания зоны и индекс последней зоны совпадают с текущей в цикле

                // Удаляем старые обработчики перед новым использованием
                point.events.remove('dragend');
                point.events.remove('contextmenu');
                point.events.remove('dblclick');

                // Режим перетаскивания. Обновляем координаты существующей метки
                point.events.add('dragend', (e) => {
                    const newCoords = e.get('target').geometry.getCoordinates();
                    setDraftZones(prev =>
                        prev.map(z =>
                            z === zone ? { // Проверяем, является ли текущая зона той, что нужно обновить
                                ...z, // Распаковываем старую зону
                                coordinates: z.coordinates.map((c, i) => // Обновляем координаты
                                    i === pointIndex ? newCoords : c // Заменяем только нужную координату
                                ),
                                points: z.points.map((point, i) => // Обновляем метку
                                    i === pointIndex ? new ymaps.Placemark(newCoords, {}) : point // Заменяем только метку, соответствующую обновляемой координате
                                )
                            } : z // Если не совпадает, возвращаем старую зону 
                        )
                    );

                });

                // Режим удаления метки нажатием на правую кнопку мыши
                point.events.add('contextmenu', (e) => {
                    e.preventDefault();
                    setDraftZones(prev =>
                        prev.map(z =>
                            z === zone ? {
                                ...z,
                                coordinates: z.coordinates.filter((_, i) => i !== pointIndex), // Удаляем координату по индексу
                                points: z.points.filter((_, i) => i !== pointIndex) // Удаляем маркер по индексу
                            } : z
                        ).map(z => // Добавляем еще один map для проверки условия
                            z.coordinates.length >= 3 ? z : null // Если в координатах меньше 3, возвращаем null (Все маркеры удалены)
                        ).filter(Boolean) // Фильтруем null значения из результата
                    );

                    setDraftZones(prev => {
                        // Обновляем зоны с фильтрацией координат и проверкой количества точек
                        const updatedZones = prev.map(z => {
                            if (z === zone) {
                                const newCoordinates = zone.coordinates.filter((_, i) => i !== pointIndex);  // Удаляем координату по индексу
                                const newPoints = zone.points.filter((_, i) => i !== pointIndex); // Удаляем маркер по индексу

                                // Если осталось меньше 3 точек - помечаем зону к удалению
                                return newCoordinates.length >= 3
                                    ? { ...z, coordinates: newCoordinates, points: newPoints }
                                    : null;
                            }
                            return z; // Обновленная зона
                        }).filter(Boolean); // Фильтруем null значения из результата. Удаляются null элементы

                        // Если текущая редактируемая зона была удалена - сбрасываем индекс (выключаем режим редактирования)
                        if (!updatedZones.some(z => z !== zone)) { // Истина, если z === null
                            // Обновляем данные в formData
                            setFormData(prev => ({
                                ...prev,
                                zones: prev.zones.filter((_, i) => i !== index)
                            }));
                            setEditingZoneIndex(-1);
                        }

                        return updatedZones;
                    });

                });

                // Режим добавления маркера при двойном клике
                point.events.add('dblclick', (e) => {
                    if (editingZoneIndex !== index) return; // Разрешаем только в режиме редактирования. В режиме редактирования будет приклеиваться последняя точка
                    e.preventDefault(); // Блокируем стандартное поведение (зум карты)

                    const coords = e.get('target').geometry.getCoordinates();

                    setDraftZones(prev =>
                        prev.map(zone =>
                            zone === draftZones[index]
                                ? {
                                    ...zone,
                                    coordinates: [...zone.coordinates, coords],
                                    points: [...zone.points, new ymaps.Placemark(coords, {}, POINT_STYLE)]
                                }
                                : zone
                        )
                    );
                });

                // Проверяем завершение зоны и создаем полигон
                if (zone.completed && zone.coordinates.length >= 3) { // Текущая зона завершена и имеет более 2 маркеров
                    // Создается новый экземпляр полигона с использованием конструктора ymaps.Polygon
                    const polygon = new ymaps.Polygon(
                        [zone.coordinates], // Массив координат для полигона
                        {
                            hintContent: `${zone.name} (${zone.price} руб)`
                        },
                        {
                            ...POLYGON_STYLE,
                            editorMaxPoints: Infinity, // Max количество точек в полигоне не ограничено
                            editorDrawOver: false, // Отключаем возможность рисовать поверх данного полигона в режиме редактирования
                            open: true, // Полигон открыт по умолчанию
                            useMapMargin: false, //  Полигон не должен использовать границы карты
                            editorMenuManager: () => [] // Отключаем контекстное меню редактирования для этого полигона
                        }
                    );

                    map.geoObjects.add(polygon); // Добавление полигона на карту
                }
            });
        });
    }, [draftZones, editingZoneIndex, POINT_STYLE, POLYGON_STYLE, isCreatingZone, ymaps]);

    // Создание новой зоны
    const toggleCreationMode = () => {
        setIsCreatingZone(prev => {
            if (!prev) { // Если режим создания выключен
                // Открываем новую зону и активируем редактирование
                const newIndex = draftZones.length;
                setOpenZone(newIndex);

                // Прокрутка к новой зоне
                const zoneList = document.querySelector('.delivery-zones-accordion');
                if (zoneList) setTimeout(() => zoneList.scrollTop = zoneList.scrollHeight, 100);

                // Режим создания полигона включен 
                isCreatingRef.current = true;
                return true;
            } else {
                // Валидация новой зоны перед выключением режима и завершения создания зоны
                const lastZoneIndex = draftZones.length - 1;
                const errors = validateZone(draftZones[lastZoneIndex]);
                if (errors.length > 0) {
                    setErrorTitle('Ошибка создания зоны');
                    setErrorMessages(errors);
                    setShowErrorModal(true);
                    return true; // Есть ошибки в новой зоне, режим создания зоны все еще активен
                }
                else { // Ошибок в новой  зоне нет, режим создания полигона выключен
                    finishZone(); // Завершение зоны

                    // Сохраняем данные в formData
                    setFormData(prev => ({
                        ...prev, // Сохраняем остальные поля формы
                        zones: draftZones.map(zone => ({
                            name: zone.name,
                            coordinates: zone.coordinates,
                            price: zone.price
                        }))
                    }));

                    return false;
                }
            }
        });
    };

    // Удаление полигона
    const handleDeleteZone = (index) => {
        setDraftZones(prev =>
            prev.filter((_, i) => i !== index)
        );
        setFormData(prev => ({
            ...prev,
            zones: prev.zones.filter((_, i) => i !== index)
        }));
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

    // Обработчик изменений в полях
    const handleFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Обработчик режима редактирования зоны
    const toggleEditZone = (index) => {
        setEditingZoneIndex(prev => {
            if (prev === index) return -1; // Если выбранная зона не соответствует изменяемой, режим редактирования выключен
            // Центрируем зону на карте
            const coords = draftZones[index].coordinates; // Получаем координаты выбранной зоны
            mapRef.current.setBounds(ymaps.util.bounds.fromPoints(coords)); // Приближаем зум и положение к выбранному полигону
            return index; // Возврат редактируемой зоны
        });
    };

    // Обработчик сохранения изменений в зоне
    const handleSaveZoneChanges = (index) => {

        // Проверка валидности индекса
        if (index < 0 || index >= draftZones.length) {
            setErrorTitle('Ошибка сохранения');
            setErrorMessages(['Некорректная зона для сохранения']);
            setShowErrorModal(true);
            return;
        }

        // Получаем текущую редактируемую зону
        const editedZone = draftZones[index];

        // Валидация зоны перед сохранением изменений
        const errors = validateZone(editedZone);

        if (errors.length > 0) {
            setErrorTitle('Ошибка сохранения зоны');
            setErrorMessages(errors);
            setShowErrorModal(true);
            return;
        }

        // Сохраняем данные в formData
        setFormData(prev => ({
            ...prev, // Сохраняем остальные поля формы
            zones: draftZones.map(zone => ({
                name: zone.name,
                coordinates: zone.coordinates,
                price: zone.price
            }))
        }));

        // Сбрасываем редактирование
        setEditingZoneIndex(-1);

        // Возвращаем карту в исходное положение
        mapRef.current?.setCenter([56.129057, 40.406635]);
        mapRef.current?.setZoom(12);
    };

    // Обновление названия зоны
    const handleZoneNameChange = (index, value) => {
        setDraftZones(prev =>
            prev.map((zone, i) =>
                i === index ? { ...zone, name: value } : zone
            )
        );
    };

    // Обновление цены зоны
    const handleZonePriceChange = (index, value) => {
        const numericValue = Number(value);
        setDraftZones(prev =>
            prev.map((zone, i) =>
                i === index ? { ...zone, price: numericValue } : zone
            )
        );
    };

    // Валидация настроек
    const validateSettings = () => {
        const errors = [];
        if (isNaN(formData.defaultPrice) || formData.defaultPrice <= 0) {
            errors.push('Стандартная стоимость доставки некорректна');
        }
        if (formData.isFreeDelivery && (isNaN(formData.freeDeliveryThreshold) || formData.freeDeliveryThreshold <= 0)) {
            errors.push('Сумма покупки для предоставления бесплатной доставки некорректна');
        }

        return errors;
    };

    // Сохранение всех настроек в БД
    const handleSaveSettings = async () => {
        if (!isDirty) return;

        // Валидация основных полей
        const errors = validateSettings();
        if (errors.length > 0) {
            setErrorTitle('Ошибка');
            setErrorMessages(errors);
            setShowErrorModal(true);
            return;
        }

        try {
            // Отправка данных на сервер
            const response = await api.saveSettings({
                zones: formData.zones,
                defaultPrice: formData.defaultPrice,
                isFreeDelivery: formData.isFreeDelivery,
                freeDeliveryThreshold: formData.freeDeliveryThreshold,
                deliveryInterval: formData.deliveryInterval
            });

            if (response.data.success) {
                // Обновляем исходные данные
                setInitialData(formData);
                setIsDirty(false);

                // Показать уведомление об успехе
                setErrorTitle('Успешно');
                setErrorMessages(['Настройки успешно сохранены']);
                setShowErrorModal(true);
            }
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            setErrorTitle('Ошибка сохранения');
            setErrorMessages([error.response?.data?.error || 'Неизвестная ошибка сервера']);
            setShowErrorModal(true);
        }
    };

    /* 
    ===========================
     Эффекты для работы с данными
    ===========================
    */

    // Загрузка данных в таблицу при монтировании текущей страницы
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Хук useEffect для обработки переходов на текущую страницу.
    // Этот эффект срабатывает каждый раз, когда меняется ключ местоположения (location.key), 
    // что происходит при переходах внутри навигационного меню, даже если пользователь остается на том же URL.
    // Это особенно важно при удалении сотрудника, так как данные на странице будут корректно обновляться
    useEffect(() => {
        // Обновляем данные на странице
        fetchData();
    }, [location.key, fetchData]); // location.key меняется при каждом переходе (даже на тот же URL)

    // Проверка изменений в полях
    useEffect(() => {
        const formDirty = !isEqual(formData, initialData);
        setIsDirty(formDirty);
    }, [formData, initialData]); // Вызов при наличии изменений в полях или начальных данных

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="delivery-page">
            <div className="control-components">
                <div className="page-name">Доставка</div>
            </div>

            {isLoading ? <Loader isWorking={isLoading} /> : <div className="delivery-column-group">
                {/* Левая колонка с картой */}
                <div className="delivery-map-section">
                    <div className="delivery-settings-header">Зоны доставки</div>
                    {/* Загрузка API карты */}
                    {!ymaps ? (<div>Загрузка карты...</div>) : (<div ref={mapContainerRef} className="delivery-map-container" />)}
                </div>

                {/* Правая колонка с настройками */}
                <div className="delivery-settings-section">
                    <div className="delivery-settings-header">Настройка доставки</div>

                    {/* Кнопка сохранения */}
                    <button
                        className={`delivery-save-btn ${isDirty ? 'active' : ''}`}
                        onClick={handleSaveSettings}
                        disabled={!isDirty}
                        style={{ marginBottom: '1.5rem' }}
                    >
                        {isDirty ? 'Сохранить изменения' : 'Все изменения сохранены'}
                    </button>

                    <div className="delivery-settings-header-wrapper" style={{ marginBottom: ymaps ? '' : '0rem' }}>
                        {/* Группа кнопок управления */}
                        {ymaps && <div className="delivery-control-buttons" style={{ justifyContent: isCreatingZone ? 'space-between' : '' }}>
                            <button
                                className={`delivery-icon-btn ${isCreatingZone ? 'creating' : ''} ${editingZoneIndex !== -1 ? 'blocking' : ''}`}
                                onClick={toggleCreationMode}
                                style={{ fontWeight: isCreatingZone ? '500' : '' }}
                                disabled={editingZoneIndex !== -1}
                            >
                                <img src={isCreatingZone ? checkedIcon : addIcon} alt="Создать" />
                                {isCreatingZone ? 'Завершить создание' : 'Новая зона'}
                            </button>

                            <label className="delivery-icon-btn">
                                <input type="file" onChange={handleFileUpload} hidden accept=".json,.geojson" />
                                <img src={importIcon} alt="Импорт" />
                                Импорт
                            </label>

                            <button className="delivery-icon-btn" onClick={() => handleExportZones()}>
                                <img src={exportIcon} alt="Экспорт" />
                                Экспорт
                            </button>
                        </div>}
                    </div>

                    {/* Секция со списком зон */}
                    {ymaps && <div className="delivery-zones-section" style={{ display: draftZones.length < 1 ? 'none' : '' }}>
                        {/* Список зон с аккордеоном */}
                        <div className="delivery-zones-accordion">
                            {draftZones.map((zone, index) => (
                                <div key={index} className="delivery-zone-item">
                                    <div className="delivery-zone-header" onClick={() => toggleZone(index)}>
                                        <div className="delivery-zone-title">
                                            {zone.name?.slice(0, 20)}{zone.name?.length > 20 && '...'}
                                        </div>

                                        <div className="delivery-zone-actions">
                                            <button
                                                className="delivery-action-btn edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (editingZoneIndex === index) {
                                                        handleSaveZoneChanges(index);
                                                    } else {
                                                        toggleEditZone(index);
                                                    }
                                                }}
                                                // Кнопка не работает в другой зоне при редактировании или создании зоны
                                                disabled={isCreatingZone ||
                                                    (editingZoneIndex !== -1 && editingZoneIndex !== index)}
                                            >
                                                {editingZoneIndex === index ? 'Сохранить' : 'Изменить'}
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
                                                {(openZone === index) ? '▼' : '▶'}
                                            </span>
                                        </div>
                                    </div>

                                    {(openZone === index) && (
                                        <div className="delivery-zone-content">
                                            <div className="delivery-input-group">
                                                <label>Стоимость доставки</label>
                                                <input
                                                    type="number"
                                                    value={
                                                        zone.price || ''
                                                    }
                                                    onChange={(e) => handleZonePriceChange(index, e.target.value)}
                                                    disabled={!(
                                                        (isCreatingZone && index === draftZones.length - 1) ||
                                                        (editingZoneIndex === index)
                                                    )}
                                                />
                                            </div>

                                            <div className="delivery-input-group">
                                                <label>Название зоны</label>
                                                <input
                                                    type="text"
                                                    value={draftZones[index]?.name ?? zone.name}
                                                    onChange={(e) => handleZoneNameChange(index, e.target.value)}
                                                    disabled={!(
                                                        // Разрешаем редактирование только последней зоне в режиме создания
                                                        (isCreatingZone && index === draftZones.length - 1) ||
                                                        // Разрешаем редактирование только выбранной зоне
                                                        (editingZoneIndex === index)
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>}

                    {/* Секция настройки доставки */}
                    <div className="delivery-global-settings">
                        {/* Стандартная стоимость */}
                        <div className="delivery-input-group">
                            <label>Стандартная стоимость доставки</label>
                            <input
                                type="number"
                                value={formData.defaultPrice || ''}
                                onChange={(e) => handleFieldChange('defaultPrice', Number(e.target.value))}
                            />
                        </div>

                        {/* Чекбокс бесплатной доставки */}
                        <div className="delivery-checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.isFreeDelivery}
                                    onChange={(e) => handleFieldChange('isFreeDelivery', e.target.checked)}
                                />
                                Бесплатная доставка
                            </label>
                        </div>

                        {/* Условие бесплатной доставки */}
                        {formData.isFreeDelivery && (
                            <div className="delivery-input-group">
                                <label>Сумма покупки от</label>
                                <input
                                    type="number"
                                    value={formData.freeDeliveryThreshold || ''}
                                    onChange={(e) => handleFieldChange('freeDeliveryThreshold', Number(e.target.value))}
                                />
                            </div>
                        )}

                        {/* Выбор интервала доставки */}
                        <div className="delivery-input-group">
                            <label>Стандартный интервал доставки</label>
                            <select
                                value={formData.deliveryInterval}
                                onChange={(e) => handleFieldChange('deliveryInterval', Number(e.target.value))}
                            >
                                {[...Array(30)].map((_, i) => (
                                    <option key={i} value={(i + 1) * 10}>
                                        {(i + 1) * 10} минут
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>}

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