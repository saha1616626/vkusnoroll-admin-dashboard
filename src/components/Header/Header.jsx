import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./../../styles/header.css";

// Импорт иконок
import userIcon from './../../assets/icons/user.png';
import settingsIcon from './../../assets/icons/settings.png';

const Header = () => {
    const navigate = useNavigate();

    const [selectedButton, setSelectedButton] = useState(() => {
        const savedIndex = localStorage.getItem('selectedButtonHeaderIndex');
        return savedIndex ? parseInt(savedIndex, 10) : 0;
    });

    const handleButtonClick = (buttonIndex) => {
        setSelectedButton(buttonIndex);
        localStorage.setItem('selectedButtonHeaderIndex', buttonIndex);

        // Здесь добавим навигацию в зависимости от выбранной кнопки
        switch (buttonIndex) {
            case 0:
                navigate('/menu');
                break;
            case 1:
                navigate('/news'); // Указать путь для Новости (если нужен)
                break;
            case 2:
                navigate('/sales-report'); // Указать путь для Отчета по продажам (если нужен)
                break;
            default:
                break;
        }
    };

    const buttonLabels = ['Меню', 'Новости', 'Отчет по продажам'];

    return (
        <div>
            <header className="header">
                <div className="logo">ВкусноРолл.Админ</div>

                <nav style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '0', padding: '0' }}>
                    {buttonLabels.map((label, index) => (
                        <button 
                            className="nav-button"
                            key={index}
                            onClick={() => handleButtonClick(index)}
                            style={{
                                backgroundColor: selectedButton === index ? 'gray' : 'transparent',
                                color: selectedButton === index ? 'white' : 'black'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                <div className="icons">
                    <img src={userIcon} alt="User" />
                    <img src={settingsIcon} alt="Settings" />
                </div>
            </header>
        </div>
    );
};

export default Header;