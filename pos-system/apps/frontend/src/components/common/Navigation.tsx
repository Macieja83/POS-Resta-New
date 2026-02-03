import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { useOrderCounts } from '../../hooks/useOrderStats';
import './Navigation.css';
import { useAuth } from '../../contexts/AuthContext';

const ORDER_TYPES = [
  { key: 'all', label: 'Wszystkie', icon: '📋' },
  { key: 'DELIVERY', label: 'Dowóz', icon: '🚚' },
  { key: 'TAKEAWAY', label: 'Wynos', icon: '📦' },
  { key: 'DINE_IN', label: 'Na miejscu', icon: '🍽️' },
  { key: 'in_progress', label: 'W realizacji', icon: '🚗' },
  { key: 'pending_acceptance', label: 'Do zaakceptowania', icon: '⏳' }
];

interface NavigationProps {
  showHistorical?: boolean;
  onHistoricalToggle?: () => void;
  onNewOrder?: () => void;
  onResetFilters?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  showHistorical = false,
  onHistoricalToggle,
  onNewOrder,
  onResetFilters
}) => {
  const location = useLocation();
  const { employee, isAuthenticated, logout } = useAuth();
  const [selectedType, setSelectedType] = useState('all');
  const [pendingAlert, setPendingAlert] = useState(false);
  const queryClient = useQueryClient();
  
  // Get order counts for filter buttons
  const { counts, isLoading: countsLoading } = useOrderCounts();

  // Preload orders data when hovering over orders link
  const handleOrdersHover = () => {
    queryClient.prefetchQuery({
      queryKey: ['orders', { status: undefined, type: undefined, search: '', page: 1, limit: 20, showHistorical: false, selectedDate: undefined }],
      queryFn: () => ordersApi.getOrders({ page: 1, limit: 20 }),
      staleTime: 30 * 1000, // Cache for 30 seconds
    });
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return parts[0][0]?.toUpperCase() ?? '?';
  };

  const LogoutIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );

  useEffect(() => {
    if (counts.pending_acceptance > 0 && selectedType !== 'pending_acceptance') {
      setPendingAlert(true);
    }

    if (counts.pending_acceptance === 0) {
      setPendingAlert(false);
    }
  }, [counts.pending_acceptance, selectedType]);

  useEffect(() => {
    const handleExternalFilter = (event: CustomEvent<{ type?: string; source?: string }>) => {
      const { type, source } = event.detail || {};
      if (!type || source === 'navigation') {
        return;
      }
      setSelectedType(type);
      if (type === 'pending_acceptance') {
        setPendingAlert(false);
      }
    };

    window.addEventListener('filterChanged', handleExternalFilter as EventListener);
    return () => window.removeEventListener('filterChanged', handleExternalFilter as EventListener);
  }, []);

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    if (type === 'pending_acceptance') {
      setPendingAlert(false);
    }
    // Emit custom event for OrdersMapPage to listen to
    window.dispatchEvent(new CustomEvent('filterChanged', { detail: { type, source: 'navigation' } }));
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-links">
          <Link 
            to="/orders-map" 
            className={`nav-link ${isActive('/orders-map') ? 'active' : ''}`}
          >
            🗺️ Mapa zamówień
          </Link>
          <Link 
            to="/orders" 
            className={`nav-link ${isActive('/orders') ? 'active' : ''}`}
            onMouseEnter={handleOrdersHover}
          >
            📋 Lista zamówień
          </Link>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            🏠 Strona główna
          </Link>
        </div>

        {/* Filtry w środku nawigacji - tylko na stronie mapy zamówień */}
        {isActive('/orders-map') && (
          <div className="nav-filters">
            {ORDER_TYPES.map((type) => {
              const count = counts[type.key as keyof typeof counts] || 0;
              const isPendingButton = type.key === 'pending_acceptance';
              const shouldAlert = isPendingButton && pendingAlert && count > 0;
              return (
                <button
                  key={type.key}
                  className={`nav-filter-btn ${selectedType === type.key ? 'active' : ''} ${shouldAlert ? 'pending-alert' : ''}`}
                  onClick={() => handleTypeFilter(type.key)}
                >
                  <span className="filter-icon">{type.icon}</span>
                  <span className="filter-label-text">{type.label}</span>
                  {!countsLoading && count > 0 && (
                    <span className="filter-count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Elementy specyficzne dla strony listy zamówień */}
        {isActive('/orders') && (
          <div className="nav-orders-controls">
            {/* Toggle Aktywne/Historyczne zamówienia */}
            <div className="nav-historical-toggle">
              <label className="nav-toggle-label">
                <input
                  type="checkbox"
                  checked={showHistorical}
                  onChange={onHistoricalToggle || (() => {})}
                  className="nav-toggle-input"
                />
                <span className="nav-toggle-slider"></span>
                <span className="nav-toggle-text">
                  {showHistorical ? '📚 Zamówienia historyczne' : '📋 Aktywne zamówienia'}
                </span>
              </label>
            </div>

            {/* Przyciski akcji */}
            <div className="nav-orders-actions">
              <button 
                onClick={onNewOrder}
                className="nav-new-order-btn"
              >
                ➕ Nowe zamówienie
              </button>
              <button 
                onClick={onResetFilters}
                className="nav-reset-filters-btn"
              >
                🔄 Resetuj filtry
              </button>
            </div>
          </div>
        )}

        {isAuthenticated && employee && (
          <div className="nav-user">
            <div className="user-initials" title={employee.name}>
              {getInitials(employee.name)}
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Wyloguj">
              <LogoutIcon />
              <span>Wyloguj</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;



