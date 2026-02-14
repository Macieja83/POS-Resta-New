import React, { useState, useEffect } from 'react';
import { healthApi } from '../api/client';
import './HealthCheck.css';

export const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const data = await healthApi.getHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="health-check">
      <div className="health-header">
        <h1>🏥 System Health</h1>
        <p>Status systemu i połączenia z bazą danych</p>
      </div>
      
      <div className="health-content">
        {loading && (
          <div className="health-loading">
            <div className="loading-spinner"></div>
            <p>Sprawdzanie statusu systemu...</p>
          </div>
        )}
        
        {error && (
          <div className="health-error">
            <h2>❌ Błąd</h2>
            <p>{error}</p>
          </div>
        )}
        
        {health && (
          <div className="health-status">
            <div className="status-card">
              <h2>📊 Status Systemu</h2>
              <div className="status-grid">
                <div className="status-item">
                  <span className="status-label">Status:</span>
                  <span className={`status-value ${health.status === 'ok' ? 'success' : 'error'}`}>
                    {health.status}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Baza danych:</span>
                  <span className={`status-value ${health.db === 'connected' ? 'success' : 'error'}`}>
                    {health.db}
                  </span>
                </div>
                <div className="status-item">
                  <span className="status-label">Środowisko:</span>
                  <span className="status-value">{health.environment}</span>
                </div>
                <div className="status-item">
                  <span className="status-label">Czas:</span>
                  <span className="status-value">{new Date(health.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
