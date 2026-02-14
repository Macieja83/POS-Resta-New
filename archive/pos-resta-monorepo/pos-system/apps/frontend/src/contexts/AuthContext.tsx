import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Employee } from '../types/shared';

interface AuthContextType {
  employee: Employee | null;
  isAuthenticated: boolean;
  login: (employee: Employee) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const loggedInEmployee = localStorage.getItem('loggedInEmployee');
    if (loggedInEmployee) {
      try {
        const employeeData = JSON.parse(loggedInEmployee);
        setEmployee(employeeData);
      } catch (error) {
        console.error('Error parsing employee data:', error);
        localStorage.removeItem('loggedInEmployee');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (employeeData: Employee) => {
    setEmployee(employeeData);
    localStorage.setItem('loggedInEmployee', JSON.stringify(employeeData));
  };

  const logout = () => {
    setEmployee(null);
    localStorage.removeItem('loggedInEmployee');
    localStorage.removeItem('authToken');
    localStorage.removeItem('employeeToken');
  };

  const value: AuthContextType = {
    employee,
    isAuthenticated: !!employee,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};



































