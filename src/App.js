import React from 'react';
import Header from './components/Header/Header';
import { BrowserRouter as Router } from 'react-router-dom';
import './styles/app.css';

function App() {
  return (
    <>
      <Router>
        <Header />
      </Router>
    </>
  );
}

export default App;
