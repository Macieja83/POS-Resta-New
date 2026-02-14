import React, { useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navigation } from './components/common/Navigation';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { EmployeeLoginPage } from './pages/EmployeeLoginPage';
import { OrdersListPage } from './pages/OrdersListPage';
import { OrdersMapPage } from './pages/OrdersMapPage';
import { OrderSummaryPage } from './pages/OrderSummaryPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { MenuManagementPage } from './pages/MenuManagementPage';
import PublicMenuPage from './pages/PublicMenuPage';
import { HealthPage } from './pages/HealthPage';
import DriverLocationPage from './pages/DriverLocationPage';
import './App.css';

// Komponent do ochrony tras
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading">Ładowanie...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Strony które nie potrzebują nawigacji
  const noNavigationPaths = ['/', '/login', '/public-menu', '/employee/login', '/driver/location'];
  const showNavigation = !noNavigationPaths.includes(location.pathname) && isAuthenticated;

  // Globalny stan dla OrderCreator
  const [showOrderCreator, setShowOrderCreator] = useState(false);
  const [showHistorical, setShowHistorical] = useState(false);

  const handleNewOrder = () => {
    setShowOrderCreator(true);
  };

  const handleHistoricalToggle = () => {
    setShowHistorical(!showHistorical);
  };

  const handleResetFilters = () => {
    // Emit custom event for pages to listen to
    window.dispatchEvent(new CustomEvent('resetFilters'));
  };

  return (
    <div className="App">
      {showNavigation && (
        <Navigation 
          showHistorical={showHistorical}
          onHistoricalToggle={handleHistoricalToggle}
          onNewOrder={handleNewOrder}
          onResetFilters={handleResetFilters}
        />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/employee/login" element={<EmployeeLoginPage />} />
        <Route path="/driver/location" element={<DriverLocationPage />} />
        <Route path="/public-menu" element={<PublicMenuPage />} />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <OrdersListPage 
                showHistorical={showHistorical}
                showOrderCreator={showOrderCreator}
                setShowOrderCreator={setShowOrderCreator}
              />
            </ProtectedRoute>
          } 
        />
        <Route path="/orders-map" element={<ProtectedRoute><OrdersMapPage /></ProtectedRoute>} />
        <Route path="/orders-summary" element={<ProtectedRoute><OrderSummaryPage /></ProtectedRoute>} />
        <Route path="/menu-management" element={<ProtectedRoute><MenuManagementPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
