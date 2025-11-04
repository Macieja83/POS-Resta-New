import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DeliveryZoneManager from '../components/delivery/DeliveryZoneManager';
import { QRCodeGenerator } from '../components/common/QRCodeGenerator';
import { CompanySettingsForm } from '../components/settings/CompanySettingsForm';
import './SettingsPage.css';

type SettingsTab = 'delivery-zone' | 'general' | 'notifications' | 'qr-menu';

export const SettingsPage: React.FC = () => {
  const { employee, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('delivery-zone');
  const [qrSize, setQrSize] = useState(200);

  if (!isAuthenticated || !employee) {
    return (
      <div className="settings-page">
        <div className="settings-error">
          <h2>❌ Brak dostępu</h2>
          <p>Musisz być zalogowany, aby zobaczyć ustawienia.</p>
          <Link to="/login" className="btn-primary">
            Zaloguj się
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'delivery-zone' as SettingsTab, label: 'Strefa dostaw', icon: '🚚' },
    { id: 'general' as SettingsTab, label: 'Ogólne', icon: '⚙️' },
    { id: 'notifications' as SettingsTab, label: 'Powiadomienia', icon: '🔔' },
    { id: 'qr-menu' as SettingsTab, label: 'Menu QR', icon: '📱' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'delivery-zone':
        return (
          <div className="tab-content">
            <DeliveryZoneManager />
          </div>
        );
      case 'general':
        return (
          <div className="tab-content">
            <h3>⚙️ Ustawienia ogólne</h3>
            <p>Podstawowe ustawienia aplikacji.</p>
            
            <div className="settings-section">
              <h4>Informacje o użytkowniku</h4>
              <div className="user-info">
                <p><strong>Imię:</strong> {employee.name}</p>
                <p><strong>Rola:</strong> {employee.role}</p>
              </div>
            </div>

            <div className="settings-section">
              <CompanySettingsForm />
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="tab-content">
            <h3>🔔 Powiadomienia</h3>
            <p>Zarządzaj powiadomieniami systemu.</p>
            
            <div className="settings-section">
              <h4>Ustawienia powiadomień</h4>
              <p>Funkcjonalność w trakcie rozwoju...</p>
            </div>
          </div>
        );
      case 'qr-menu':
        return (
          <div className="tab-content">
            <h3>📱 Menu QR</h3>
            <p>Zarządzaj publicznym menu dostępnym przez kod QR.</p>
            
            <div className="settings-section">
              <h4>Kod QR Menu</h4>
              <p>Ten kod QR prowadzi do publicznej strony z menu, gdzie klienci mogą składać zamówienia na miejscu.</p>
              
              <div className="qr-section">
                <div className="qr-code-container">
                  <div className="qr-code-placeholder">
                    <QRCodeGenerator 
                      url={`${window.location.origin}/public-menu`}
                      size={qrSize}
                      className="qr-generator"
                    />
                    <p className="qr-label">Kod QR Menu</p>
                  </div>
                </div>
                
                <div className="qr-info">
                  <h5>Informacje o kodzie QR:</h5>
                  <ul>
                    <li><strong>URL:</strong> <code>{window.location.origin}/public-menu</code></li>
                    <li><strong>Typ:</strong> Menu publiczne</li>
                    <li><strong>Funkcje:</strong> Przeglądanie menu, składanie zamówień na miejscu</li>
                    <li><strong>Status:</strong> <span className="status-active">Aktywny</span></li>
                  </ul>
                  
                  <div className="qr-size-controls">
                    <label htmlFor="qr-size">Rozmiar kodu QR:</label>
                    <input
                      id="qr-size"
                      type="range"
                      min="150"
                      max="400"
                      step="50"
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="qr-size-slider"
                    />
                    <span className="qr-size-value">{qrSize}px</span>
                  </div>
                  
                  <div className="qr-actions">
                    <button className="btn-primary" onClick={() => window.open('/public-menu', '_blank')}>
                      🔗 Otwórz menu
                    </button>
                    <button className="btn-secondary" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/public-menu`);
                      alert('URL skopiowany do schowka!');
                    }}>
                      📋 Kopiuj URL
                    </button>
                    <button className="btn-secondary" onClick={() => {
                      const canvas = document.querySelector('.qr-canvas') as HTMLCanvasElement;
                      if (canvas) {
                        const link = document.createElement('a');
                        link.download = 'menu-qr-code.png';
                        link.href = canvas.toDataURL();
                        link.click();
                      }
                    }}>
                      💾 Pobierz QR
                    </button>
                    <button className="btn-secondary" onClick={() => {
                      // Test QR code by opening the menu URL
                      window.open('/public-menu', '_blank');
                    }}>
                      📱 Testuj QR
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="settings-section">
              <h4>Instrukcje użycia</h4>
              <ol>
                <li>Wydrukuj kod QR i umieść go na stolikach</li>
                <li>Klienci skanują kod telefonem</li>
                <li>Automatycznie otwiera się strona z menu</li>
                <li>Klienci dodają produkty do koszyka i składają zamówienie</li>
                <li>Zamówienie trafia do systemu POS jako "Na miejscu"</li>
              </ol>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="settings-title">
          <h1>⚙️ Ustawienia</h1>
          <p>Zarządzaj ustawieniami aplikacji</p>
        </div>
        <div className="settings-actions">
          <Link to="/" className="back-btn">
            ← Powrót do głównej
          </Link>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span className="nav-label">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-main">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
