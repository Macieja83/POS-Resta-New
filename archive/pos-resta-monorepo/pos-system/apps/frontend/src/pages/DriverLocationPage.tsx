import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { employeesApi } from '../api/employees';

export const DriverLocationPage: React.FC = () => {
  const [loginCode, setLoginCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: employeesApi.loginWithCode,
    onSuccess: (data) => {
      if (data.success) {
        setIsLoggedIn(true);
        setDriver(data.data);
        localStorage.setItem('driverToken', data.token);
        localStorage.setItem('driverId', data.data.id);
        setError(null);
      }
    },
    onError: (error: any) => {
      setError('Błąd logowania: ' + (error.response?.data?.error || error.message));
    }
  });

  // Location update mutation
  const locationMutation = useMutation({
    mutationFn: employeesApi.updateDriverLocation,
    onError: (error: any) => {
      setError('Błąd aktualizacji lokalizacji: ' + (error.response?.data?.error || error.message));
    }
  });

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolokalizacja nie jest obsługiwana przez przeglądarkę');
      return;
    }

    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        
        // Automatically update location if logged in
        if (isLoggedIn && driver) {
          updateLocation(latitude, longitude);
        }
      },
      (error) => {
        setError('Błąd pobierania lokalizacji: ' + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Update location in database
  const updateLocation = (latitude: number, longitude: number) => {
    locationMutation.mutate({
      latitude,
      longitude,
      orderId: null
    });
  };

  // Start/stop location tracking
  const toggleTracking = () => {
    if (isTracking) {
      setIsTracking(false);
      setError(null);
    } else {
      setIsTracking(true);
      getCurrentLocation();
    }
  };

  // Auto-update location every 30 seconds when tracking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTracking && isLoggedIn) {
      interval = setInterval(() => {
        getCurrentLocation();
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, isLoggedIn]);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    const driverId = localStorage.getItem('driverId');
    
    if (token && driverId) {
      setIsLoggedIn(true);
      setDriver({ id: driverId });
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginCode.trim()) {
      setError('Wprowadź kod logowania');
      return;
    }
    loginMutation.mutate(loginCode);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setDriver(null);
    setIsTracking(false);
    setLocation(null);
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverId');
    setError(null);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#333',
              margin: '0 0 10px 0'
            }}>
              🚗 Lokalizacja Kierowcy
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Zaloguj się aby śledzić swoją lokalizację
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333'
              }}>
                Kod logowania:
              </label>
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="Wprowadź kod kierowcy"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              />
            </div>

            {error && (
              <div style={{
                background: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              style={{
                width: '100%',
                background: loginMutation.isPending ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: loginMutation.isPending ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loginMutation.isPending ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <div style={{ 
            marginTop: '20px', 
            textAlign: 'center',
            fontSize: '14px',
            color: '#666'
          }}>
            <p>Kod kierowcy: <strong>5678</strong> (Anna Nowak)</p>
            <p>Kod kierowcy: <strong>1234</strong> (Jan Kowalski)</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#333',
            margin: '0 0 10px 0'
          }}>
            🚗 {driver?.name || 'Kierowca'}
          </h1>
          <p style={{ color: '#666', margin: 0 }}>
            Status: {isTracking ? 'Śledzenie aktywne' : 'Śledzenie nieaktywne'}
          </p>
        </div>

        {location && (
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📍 Aktualna lokalizacja</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong>Szerokość:</strong><br />
                {location.latitude.toFixed(6)}
              </div>
              <div>
                <strong>Długość:</strong><br />
                {location.longitude.toFixed(6)}
              </div>
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              Ostatnia aktualizacja: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={getCurrentLocation}
            style={{
              flex: 1,
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#218838'}
            onMouseOut={(e) => e.currentTarget.style.background = '#28a745'}
          >
            📍 Pobierz lokalizację
          </button>
          
          <button
            onClick={toggleTracking}
            style={{
              flex: 1,
              background: isTracking ? '#dc3545' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = isTracking ? '#c82333' : '#0056b3'}
            onMouseOut={(e) => e.currentTarget.style.background = isTracking ? '#dc3545' : '#007bff'}
          >
            {isTracking ? '⏹️ Zatrzymaj' : '▶️ Rozpocznij śledzenie'}
          </button>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '10px',
          borderTop: '1px solid #e1e5e9',
          paddingTop: '20px'
        }}>
          <button
            onClick={handleLogout}
            style={{
              flex: 1,
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#5a6268'}
            onMouseOut={(e) => e.currentTarget.style.background = '#6c757d'}
          >
            🚪 Wyloguj się
          </button>
        </div>

        {isTracking && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#e7f3ff',
            borderRadius: '8px',
            border: '1px solid #b3d9ff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '12px',
                height: '12px',
                background: '#28a745',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ color: '#0066cc', fontWeight: '500' }}>
                Śledzenie aktywne - lokalizacja jest automatycznie aktualizowana co 30 sekund
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DriverLocationPage;
