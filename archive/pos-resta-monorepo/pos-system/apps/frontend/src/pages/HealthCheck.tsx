import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { healthApi } from '../api/client';
import './HealthCheck.css';

export default function HealthCheck() {
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.getHealth,
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (data) {
      setLastCheck(new Date());
    }
  }, [data]);

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="health-check">
      <header className="health-header">
        <h1>🏥 POS System Health Check</h1>
        <p>System status and API connectivity</p>
      </header>

      <main className="health-main">
        <div className="status-card">
          <h2>API Status</h2>
          
          {isLoading && (
            <div className="status loading">
              <span className="status-indicator loading">⏳</span>
              Checking API...
            </div>
          )}

          {error && (
            <div className="status error">
              <span className="status-indicator error">❌</span>
              API Unavailable
              <button onClick={handleRefresh} className="refresh-btn">
                Retry
              </button>
            </div>
          )}

          {data && (
            <div className="status success">
              <span className="status-indicator success">✅</span>
              API OK
              <div className="status-details">
                <p><strong>Database:</strong> {data.db}</p>
                <p><strong>Environment:</strong> {data.environment}</p>
                <p><strong>Last Check:</strong> {lastCheck?.toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="info-card">
          <h3>System Information</h3>
          <ul>
            <li><strong>Frontend:</strong> http://localhost:5173</li>
            <li><strong>Backend:</strong> http://localhost:4000</li>
            <li><strong>Database:</strong> PostgreSQL (Docker)</li>
            <li><strong>Status:</strong> {data?.status || 'Unknown'}</li>
          </ul>
        </div>

        <div className="actions">
          <button onClick={handleRefresh} className="primary-btn">
            🔄 Refresh Status
          </button>
        </div>
      </main>
    </div>
  );
}

