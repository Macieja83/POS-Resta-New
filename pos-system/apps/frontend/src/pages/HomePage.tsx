import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { employee, isAuthenticated, logout } = useAuth();

  return (
    <div className="home-page">
      {isAuthenticated && employee && (
        <div className="user-info-header">
          <div className="user-details">
            <span className="user-name">👤 {employee.name}</span>
          </div>
          <button onClick={logout} className="logout-btn-header">
            🚪 Wyloguj
          </button>
        </div>
      )} 

      <div className="main-actions">
        <Link to="/orders" className="action-card orders-card">
          <div className="card-icon">📋</div>
          <h2>Lista zamówień</h2>
          <p>Zamówienia na miejscu i na wynos</p>
        </Link>

        <Link to="/orders-map" className="action-card map-card">
          <div className="card-icon">🗺️</div>
          <h2>Mapa zamówień</h2>
          <p>Lista zamówień z mapą lokalizacji</p>
        </Link>

        <Link to="/orders-summary" className="action-card summary-card">
          <div className="card-icon">📊</div>
          <h2>Podsumowanie</h2>
          <p>Statystyki zamówień i pracowników</p>
        </Link>

        <Link to="/menu-management" className="action-card menu-management-card">
          <div className="card-icon">🍕</div>
          <h2>Zarządzanie Menu</h2>
          <p>Twórz kategorie, pozycje i zarządzaj menu restauracji</p>
        </Link>

        <Link to="/users" className="action-card users-card">
          <div className="card-icon">👥</div>
          <h2>Zarządzanie użytkownikami</h2>
          <p>Dodawaj i edytuj użytkowników systemu</p>
        </Link>

        <Link to="/login" className="action-card login-card">
          <div className="card-icon">🔐</div>
          <h2>Ekran logowania</h2>
          <p>Zaloguj się kodem pracownika</p>
        </Link>

        <Link to="/settings" className="action-card settings-card">
          <div className="card-icon">⚙️</div>
          <h2>Ustawienia</h2>
          <p>Konfiguracja systemu</p>
        </Link>

        <div className="action-card office-card inactive">
          <div className="card-icon">🏢</div>
          <h2>Biuro</h2>
          <p>Narzędzia administracyjne</p>
          <div className="coming-soon">Dostępne wkrótce</div>
        </div>
      </div>

    </div>
  );
};
