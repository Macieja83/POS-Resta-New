import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../api/orders';
import { handleError } from '../lib/errorHandler';
import './EmployeeLoginPage.css';

export const EmployeeLoginPage: React.FC = () => {
  const [loginCode, setLoginCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginCode || !/^\d{4}$/.test(loginCode)) {
      setError('Kod logowania musi składać się z 4 cyfr');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await ordersApi.mobileLogin(loginCode);
      
      if (response.success && response.data) {
        // Store token and user data
        localStorage.setItem('employeeToken', response.data.token);
        localStorage.setItem('employeeUser', JSON.stringify(response.data.user));
        
        // Navigate to employee dashboard
        navigate('/employee/dashboard');
      } else {
        setError('Nieprawidłowy kod logowania');
      }
    } catch (err) {
      const errorDetails = handleError(err, false);
      setError(errorDetails.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await ordersApi.testLogin('1234');
      
      if (response.success && response.data) {
        // Store token and user data
        localStorage.setItem('employeeToken', response.data.token);
        localStorage.setItem('employeeUser', JSON.stringify(response.data.user));
        
        // Navigate to employee dashboard
        navigate('/employee/dashboard');
      } else {
        setError('Błąd podczas logowania testowego');
      }
    } catch (err) {
      const errorDetails = handleError(err, false);
      setError(errorDetails.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="employee-login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">🍕</span>
            <h1>POS System</h1>
          </div>
          <p className="login-subtitle">Logowanie pracownika</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="loginCode" className="form-label">
              Kod logowania
            </label>
            <input
              type="text"
              id="loginCode"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              placeholder="Wprowadź 4-cyfrowy kod"
              className="form-input"
              maxLength={4}
              pattern="[0-9]{4}"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !loginCode}
            className="login-button"
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <div className="test-login">
          <p className="test-label">Testowanie:</p>
          <button
            onClick={handleTestLogin}
            disabled={isLoading}
            className="test-button"
          >
            Logowanie testowe (1234)
          </button>
        </div>

        <div className="login-info">
          <h3>Dostępne kody testowe:</h3>
          <div className="test-codes">
            <div className="test-code">
              <span className="code">1234</span>
              <span className="description">Ihor Nazarenko (Driver)</span>
            </div>
            <div className="test-code">
              <span className="code">5678</span>
              <span className="description">Jan Kowalski (Driver)</span>
            </div>
          </div>
        </div>

        <div className="back-to-home">
          <button
            onClick={() => navigate('/')}
            className="back-button"
          >
            ← Powrót do strony głównej
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLoginPage;
