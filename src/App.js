import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Header from './components/Header/Header'; // Главное меню
import MainLayout from './components/UnderHeader/MainLayout'; // Подменю (Блюда, категории)
import Dishes from './components/Pages/Dishes'; // Список блюд
import AddEditDishPage from './components/Pages/AddEditDishPage'; // Управление блюдом. Добавление или редактирование
import Categories from './components/Pages/Categories'; // Список категорий
import AddEditCategoryPage from './components/Pages/AddEditCategoryPage'; // Управление категорией. Добавление или редактирование
import News from './components/Pages/News'; // Список новостей
import AddEditNews from './components/Pages/AddEditNews'; // Управление новостями. Добавление или редактирование
import SalesReport from './components/Pages/SalesReport'; //  Отчет по продажам
import PersonalAccount from './components/Pages/PersonalAccount'; //  Личный кабинет
import SettingsMenuLayout from './components/UnderHeader/SettingsMenuLayout'; // Подменю настроек
import Staff from './components/Pages/Staff'; // Список сотрудников
import AddEditStaff from './components/Pages/AddEditStaff'; // // Управление сотрудниками. Добавление или редактирование
import Users from './components/Pages/Users'; // Список сотрудников
import OrderStatuses from './components/Pages/OrderStatuses'; // Список статусов заказов
import Schedule from './components/Pages/Schedule'; // График доставки
import Delivery from './components/Pages/Delivery'; // Доставка

import './styles/app.css';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        {/* Подменю (Блюда, категории) */}
        <Route path="/menu" element={<MainLayout />}>
          {/* Дочерние маршруты для menu */}
          {/* Блюда */}
          <Route path="dishes" element={<Dishes />} />
          <Route path="dishes/new" element={<AddEditDishPage mode="add" />} />
          <Route path="dishes/edit/:id" element={<AddEditDishPage mode="edit" />} />
          {/* Ктаегории блюд */}
          <Route path="categories" element={<Categories />} />
          <Route path="categories/new" element={<AddEditCategoryPage mode="add" />} />
          <Route path="categories/edit/:id" element={<AddEditCategoryPage mode="edit" />} />
        </Route>
        {/* Новости */}
        <Route path="news" element={<News />} />
        <Route path="news/new" element={<AddEditNews mode="add" />} />
        <Route path="news/edit/:id" element={<AddEditNews mode="edit" />} />
        {/* Отчет по продажам */}
        <Route path="sales-report" element={<SalesReport />} />
        {/* Личный кабинет */}
        <Route path="personal-account" element={<PersonalAccount />} />
        {/* Подменю настройки */}
        <Route path="/settings" element={<SettingsMenuLayout />}>
          {/* Сотрудники */}
          <Route path="employees" element={<Staff />} />
          <Route path="employees/new" element={<AddEditStaff mode="add" />} />
          <Route path="employees/edit/:id" element={<AddEditStaff mode="edit" />} />
          {/* Пользователи */}
          <Route path="users" element={<Users />} />
          {/* Статусы заказов */}
          <Route path="order-statuses" element={<OrderStatuses />} />
          {/* График работы */}
          <Route path="schedule" element={<Schedule />} />
          {/* Доставка */}
          <Route path="delivery" element={<Delivery />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
