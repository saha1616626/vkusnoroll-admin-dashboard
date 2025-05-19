// Кнопка с выпадающим меню для печати отчета по продажам

import React, { useState, useRef, useEffect } from "react";

// Импорт стилей
import "./../../styles/elements/dropDownButtonPrintingReport.css";

// Импорт иконок
import fileIcon from './../../assets/icons/file.png';

const DropDownButtonPrintingReport = () => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для управления закрытия/открытия списка
    const dropdownRef = useRef(null); // Ссылка на элемент выпадающего списка кнопки "Изменить". Для получения доступа к DOM-элементу и проверки, был ли клик вне него

    // Кнопка "изменить" с выпадающим списком функций
    const toggleDropdown = (option) => {
        setIsOpen(prev => !prev); // Переключение состояния
    };

    // Выбранная функция в раскрывающемся списке кнопки

    // Формирование отчета в формате PDF
    const handlePrintingReportPDFClick = () => {

        setIsOpen(false); // Закрыть выпадающий список после выбора
    }

    // Формирование отчета в формате Excel
    const handlePrintingReportExcelClick = () => {

        setIsOpen(false); // Закрыть выпадающий список после выбора
    }

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

    return (
        <div className="drop-down-button-printing-report" ref={dropdownRef}>
            <button className="button-control" onClick={toggleDropdown}>
                Экспорт
                <img src={fileIcon} alt="File" className="" />
            </button>
            {isOpen && (
                <div className="drop-down-button-printing-report-menu">
                    <div className="drop-down-button-printing-report-option" onClick={handlePrintingReportPDFClick}>
                        PDF
                    </div>
                    <div className="drop-down-button-printing-report-option" onClick={handlePrintingReportExcelClick}>
                        Excel
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropDownButtonPrintingReport;