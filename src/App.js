import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Header from './components/Header/Header'; // Глпавное меню
import MainLayout from './components/UnderHeader/MainLayout'; // Подменю
import Dishes from './components/Pages/Dishes'; // Список блюд
import AddEditDishPage from './components/Pages/AddEditDishPage'; // Управление блюдом. Добавление или редактирование
import Categories from './components/Pages/Categories'; // Список категорий
import './styles/app.css';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/menu" element={<MainLayout />}>
          {/* Дочерние маршруты для menu */}
          <Route path="dishes" element={<Dishes />} />
          <Route path="dishes/new" element={<AddEditDishPage mode="add" />} />
          <Route path="dishes/edit/:id" element={<AddEditDishPage mode="edit" />} />
          <Route path="categories" element={<Categories />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
