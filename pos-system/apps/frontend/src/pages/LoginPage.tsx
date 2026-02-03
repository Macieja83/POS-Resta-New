import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import { employeesApi } from '../api/employees';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const handleNumberClick = (number: string) => {
    if (code.length < 4) {
      setCode(prev => prev + number);
      setError('');
    }
  };

  const handleClear = () => {
    setCode('');
    setError('');
  };

  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1));
    setError('');
  };

  const handleLogin = async () => {
    if (code.length !== 4) {
      setError('Kod musi składać się z 4 cyfr');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Login using the new endpoint
      const response = await employeesApi.loginWithCode(code);
      const employee = response.data;
      const token = response.token;

      if (employee && token) {
        // Store JWT token
        localStorage.setItem('authToken', token);
        console.log('Token saved to localStorage:', token);
        // Login using AuthContext
        login(employee);
        // Navigate to home page
        navigate('/');
      } else {
        console.error('Missing employee or token:', { employee, token });
        setError('Nieprawidłowy kod logowania');
      }
    } catch (error) {
      console.error('Login error:', error);
      const msg = error instanceof Error ? error.message : 'Nieprawidłowy kod logowania';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Auto-submit when 4 digits are entered
  useEffect(() => {
    if (code.length === 4) {
      handleLogin();
    }
  }, [code]);

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🔐 Logowanie</h1>
          <p>Wprowadź swój 4-cyfrowy kod pracownika</p>
        </div>

        <div className="code-display">
          <div className="code-dots">
            {[0, 1, 2, 3].map((index) => (
              <div 
                key={index} 
                className={`code-dot ${index < code.length ? 'filled' : ''}`}
              />
            ))}
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="keypad">
          <div className="keypad-row">
            <button className="keypad-btn" onClick={() => handleNumberClick('1')}>1</button>
            <button className="keypad-btn" onClick={() => handleNumberClick('2')}>2</button>
            <button className="keypad-btn" onClick={() => handleNumberClick('3')}>3</button>
          </div>
          <div className="keypad-row">
            <button className="keypad-btn" onClick={() => handleNumberClick('4')}>4</button>
            <button className="keypad-btn" onClick={() => handleNumberClick('5')}>5</button>
            <button className="keypad-btn" onClick={() => handleNumberClick('6')}>6</button>
          </div>
          <div className="keypad-row">
            <button className="keypad-btn" onClick={() => handleNumberClick('7')}>7</button>
            <button className="keypad-btn" onClick={() => handleNumberClick('8')}>8</button>
            <button className="keypad-btn" onClick={() => handleNumberClick('9')}>9</button>
          </div>
          <div className="keypad-row">
            <button className="keypad-btn clear-btn" onClick={handleClear}>C</button>
            <button className="keypad-btn" onClick={() => handleNumberClick('0')}>0</button>
            <button className="keypad-btn backspace-btn" onClick={handleBackspace}>⌫</button>
          </div>
        </div>

        <div className="login-actions">
          <button 
            className="login-btn" 
            onClick={handleLogin}
            disabled={code.length !== 4 || isLoading}
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
          <button 
            className="back-btn" 
            onClick={() => navigate('/')}
          >
            ← Powrót do strony głównej
          </button>
        </div>
      </div>
    </div>
  );
};
