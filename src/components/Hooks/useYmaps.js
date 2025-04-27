// Кастомный хук для использования Яндекс карты

import { useState, useEffect } from 'react';

export const useYmaps = () => {
    const [ymaps, setYmaps] = useState(null);

    useEffect(() => {
        const API_KEY = process.env.REACT_APP_YANDEX_MAPS_API_KEY;

        // Если скрипт уже загружен, возвращаем ymaps
        if (window.ymaps) {
            setYmaps(window.ymaps);
            return;
        }

        // Проверка на уже запущенный процесс загрузки
        if (window.ymapsScriptLoading) return;
        window.ymapsScriptLoading = true;

        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU`;
        script.async = true; // Асинхронная загрузка

        // Обработка успешной загрузки
        script.onload = () => {
            window.ymapsScriptLoading = false;
            window.ymaps.ready(() => setYmaps(window.ymaps));
        };

        // Обработка ошибок
        script.onerror = () => {
            console.error('Не удалось загрузить Яндекс.Карты');
        };

        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return ymaps;
};