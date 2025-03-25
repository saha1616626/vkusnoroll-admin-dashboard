// Компонент кастомной таблицы

import React from "react";

// Импорт стилей
import './../../styles/elements/customTable.css'

const CustomTable = ({ columns, data }) => {
    return (
        <table className="custom-table">
            <thead>
                <tr>
                    {columns.map((column, index) => (
                        <th key={index}>{column}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {columns.map((column, colIndex) => (
                            <td key={colIndex}>{row[column]}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default CustomTable;