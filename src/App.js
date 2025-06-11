import { useState, useCallback, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from 'react-router-dom';

import api from './utils/api';  // API сервера
import Login from './components/Pages/Login'; // Страница авторизации
import PrivateRoute from './components/Elements/PrivateRoute'; // Контент, доступный после авторизации

import HeaderLayout from './components/Header/HeaderLayout'; // Header и весь дочерний контент
import MainLayout from './components/UnderHeader/MainLayout'; // Подменю (Блюда, категории)
import Dishes from './components/Pages/Dishes'; // Список блюд
import AddEditDishPage from './components/Pages/AddEditDishPage'; // Управление блюдом. Добавление или редактирование
import Categories from './components/Pages/Categories'; // Список категорий
import AddEditCategoryPage from './components/Pages/AddEditCategoryPage'; // Управление категорией. Добавление или редактирование
import News from './components/Pages/News'; // Список новостей
import AddEditNews from './components/Pages/AddEditNews'; // Управление новостями. Добавление или редактирование
import SalesReport from './components/Pages/SalesReport'; //  Отчет по продажам
import PersonalAccount from './components/Pages/PersonalAccount'; //  Личный кабинет
import SettingsMenuLayout from './components/UnderHeader/SettingsMenuLayout'; // Меню настроек
import Staff from './components/Pages/Staff'; // Список сотрудников
import AddEditStaff from './components/Pages/AddEditStaff'; // Управление сотрудниками. Добавление или редактирование
import Users from './components/Pages/Users'; // Список сотрудников
import AddEditUser from './components/Pages/AddEditUser'; // Управление пользователями. Добавление или редактирование
import OrderStatuses from './components/Pages/OrderStatuses'; // Список статусов заказов
import Schedule from './components/Pages/Schedule'; // График доставки
import Delivery from './components/Pages/Delivery'; // Доставка
import PasswordRecoveryPage from './components/Pages/auth/PasswordRecoveryPage'; // Страница восстановления пароля

import './styles/app.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Состояние авторизации

  // Обновление статуса авторизации
  const updateAuthStatus = useCallback((status) => {
    setIsAuthenticated(status);
  }, []);

  const AppContent = () => {
    const navigate = useNavigate(); // Навигация
    const location = useLocation(); // Получаем текущий путь

    // Проверка срока действия токена из cookies
    useEffect(() => {
      const checkAuth = async () => {
        try {
          await api.checkAuth();
          setIsAuthenticated(true);
        } catch (error) {
          setIsAuthenticated(false);
          if (location.pathname !== '/login' &&
            location.pathname !== '/forgot-password') {
            navigate('/login');
          }
        }
      };

      checkAuth();
    }, [navigate, location.pathname]);

    return (
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/menu" /> : <Login updateAuth={updateAuthStatus} />
        } />

        {/* Страница восстановления пароля */}
        <Route path='/forgot-password' element={isAuthenticated ? <Navigate to="/menu" replace /> : <PasswordRecoveryPage />} />
        <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
          {/* Все защищенные маршруты */}
          <Route path="/" element={<HeaderLayout />}>
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
            <Route path="personal-account" element={<PersonalAccount updateAuth={updateAuthStatus} />} />
            {/* Меню настройки */}
            <Route path="/settings" element={<SettingsMenuLayout />}>
              <Route index element={<Navigate to="employees" replace />} />  {/* Перенаправление по умолчанию на Staff */}
              {/* Сотрудники */}
              <Route path="employees" element={<Staff />} />
              <Route path="employees/new" element={<AddEditStaff mode="add" />} />
              <Route path="employees/edit/:id" element={<AddEditStaff mode="edit" />} />
              {/* Пользователи */}
              <Route path="users" element={<Users />} />
              <Route path="users/edit/:id" element={<AddEditUser mode="edit" />} />
              {/* Статусы заказов */}
              <Route path="order-statuses" element={<OrderStatuses />} />
              {/* График работы */}
              <Route path="schedule" element={<Schedule />} />
              {/* Доставка */}
              <Route path="delivery" element={<Delivery />} />
            </Route>
          </Route>
        </Route>

      </Routes>
    );
  };

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
