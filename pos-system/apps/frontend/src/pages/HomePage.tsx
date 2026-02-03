import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './HomePage.css';

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? '?';
};

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const HomePage: React.FC = () => {
  const { employee, isAuthenticated, logout } = useAuth();

  return (
    <div className="home-page">
      {isAuthenticated && employee && (
        <div className="user-info-header">
          <div className="user-initials-header" title={employee.name}>
            {getInitials(employee.name)}
          </div>
          <button onClick={logout} className="logout-btn-header" title="Wyloguj">
            <LogoutIcon />
            <span>Wyloguj</span>
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
