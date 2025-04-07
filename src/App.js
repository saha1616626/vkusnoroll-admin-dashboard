import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from 'react-router-dom';

import Header from './components/Header/Header'; // Главное меню
import MainLayout from './components/UnderHeader/MainLayout'; // Подменю
import Dishes from './components/Pages/Dishes'; // Список блюд
import AddEditDishPage from './components/Pages/AddEditDishPage'; // Управление блюдом. Добавление или редактирование
import Categories from './components/Pages/Categories'; // Список категорий
import AddEditCategoryPage from './components/Pages/AddEditCategoryPage'; // Управление категорией. Добавление или редактирование
import News from './components/Pages/News'; // Список новостей
import AddEditNews from './components/Pages/AddEditNews'; // Управление новостями. Добавление или редактирование
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
          <Route path="categories/new" element={<AddEditCategoryPage mode="add" />} />
          <Route path="categories/edit/:id" element={<AddEditCategoryPage mode="edit" />} />
        </Route>
        <Route path="news" element={<News />} />
        <Route path="news/new" element={<AddEditNews mode="add" />} />
        <Route path="news/edit/:id" element={<AddEditNews mode="edit" />} />
      </Routes>
    </Router>
  );
}

export default App;
