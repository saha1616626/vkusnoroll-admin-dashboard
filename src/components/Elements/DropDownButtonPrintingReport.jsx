// Кнопка с выпадающим меню для печати отчета по продажам

import React, { useState, useRef, useEffect } from "react";

// Импорт компонентов
import api from '../../utils/api'; // API сервера

// Импорт стилей
import "./../../styles/elements/dropDownButtonPrintingReport.css";

// Импорт иконок
import fileIcon from './../../assets/icons/file.png';

const DropDownButtonPrintingReport = ({ reportMode, activeFilters, selectedColumns }) => {

    /* 
    ===============================
     Состояния, константы и ссылки
    ===============================
    */

    const [isOpen, setIsOpen] = useState(false); // Состояние для управления закрытия/открытия списка
    const dropdownRef = useRef(null); // Ссылка на элемент выпадающего списка кнопки "Изменить". Для получения доступа к DOM-элементу и проверки, был ли клик вне него

    /* 
    ===========================
     Обработчики событий
    ===========================
    */

    // Кнопка "изменить" с выпадающим списком функций
    const toggleDropdown = (option) => {
        setIsOpen(prev => !prev); // Переключение состояния
    };

    // Форматирование даты и времени генерации отчета
    const formatDateTime = (datetime) => {
        if (!datetime) return '—';

        const date = new Date(datetime);

        const datePart = date.toLocaleDateString('ru-RU', {
            timeZone: 'Europe/Moscow',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });

        const hours = date.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit' });
        const minutes = date.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', minute: '2-digit' });

        // Формируем строку времени
        const timePart = `${hours}-${minutes}`;

        return `${datePart} ${timePart}`;
    };

    // Обработчик генерации отчета по выбранной функции в раскрывающемся списке кнопки
    const handleExport = async (format) => {
        try {
            const params = {
                ...activeFilters,
                columns: selectedColumns,
                format
            };

            const response = await api.generateReport(reportMode, params);

            // Тип отчета
            const reportType = reportMode === 'orders' ? 'по заказам' : 'по товарам';

            // Диалог сохранения файла
            const filename = `Отчет ${reportType} ${formatDateTime(new Date().toISOString())}.${format}`;
            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setIsOpen(false); // Закрыть выпадающий список после выбора
        } catch (error) {
            console.error('Export error:', error);
        }
    };

    /* 
    ===========================
     Эффекты
    ===========================
    */

    // Хук для обработки кликов вне компонента
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) { // Если клик произошел вне элемента
                setIsOpen(false); // Закрыть выпадающий список
            }
        };

        // Обработчик события клика
        document.addEventListener('mousedown', handleClickOutside);

        // Удаление обработчика при размонтировании компонента
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };

    }, []);

    /* 
    ===========================
     Рендер
    ===========================
    */

    return (
        <div className="drop-down-button-printing-report" ref={dropdownRef}>
            <button className="button-control" onClick={toggleDropdown}>
                Экспорт
                <img src={fileIcon} alt="File" className="" />
            </button>
            {isOpen && (
                <div className="drop-down-button-printing-report-menu">
                    <div className="drop-down-button-printing-report-option" onClick={() => handleExport('pdf')}>
                        PDF
                    </div>
                    <div className="drop-down-button-printing-report-option" onClick={() => handleExport('xlsx')}>
                        Excel
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropDownButtonPrintingReport;