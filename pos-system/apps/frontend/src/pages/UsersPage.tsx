import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import './UsersPage.css';
import { employeesApi } from '../api/employees';
import { Employee, EmployeeRole } from '../types/shared';

// Use Employee type from shared package instead of local User interface

// Function to generate a random 4-digit login code
const generateLoginCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<Employee | null>(null);
  const [editingCode, setEditingCode] = useState<Employee | null>(null);
  const [editCodeValue, setEditCodeValue] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Fetch employees from API
  const { data: employeesData, isLoading, error } = useQuery({
    queryKey: ['employees', showInactive],
    queryFn: showInactive ? employeesApi.getAllEmployees : employeesApi.getEmployees,
  });

  const employees = employeesData?.data || [];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CASHIER' as EmployeeRole,
    loginCode: '',
    password: ''
  });

  // Mutations
  const createEmployeeMutation = useMutation({
    mutationFn: employeesApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowAddUser(false);
      resetForm();
      alert('Pracownik został dodany');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : undefined;
      alert(message || 'Błąd podczas dodawania pracownika');
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) => employeesApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditingUser(null);
      resetForm();
      alert('Pracownik został zaktualizowany');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : undefined;
      alert(message || 'Błąd podczas aktualizacji pracownika');
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: employeesApi.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      alert('Pracownik został usunięty');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : undefined;
      alert(message || 'Błąd podczas usuwania pracownika');
    }
  });

  const handleAddUser = () => {
    if (formData.name && formData.email) {
      createEmployeeMutation.mutate({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        loginCode: formData.loginCode || generateLoginCode(),
      });
    }
  };

  const handleEditUser = (user: Employee) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      loginCode: user.loginCode || '',
      password: ''
    });
  };

  const handleUpdateUser = () => {
    if (editingUser && formData.name && formData.email) {
      updateEmployeeMutation.mutate({
        id: editingUser.id,
        data: {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          loginCode: formData.loginCode || generateLoginCode(),
        }
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      deleteEmployeeMutation.mutate(userId);
    }
  };

  const handleGenerateNewLoginCode = (_userId: string) => {
    // This would need to be implemented in the backend
    alert('Funkcja generowania nowego kodu nie jest jeszcze zaimplementowana');
  };

  const handleEditCode = (user: Employee) => {
    setEditingCode(user);
    setEditCodeValue(user.loginCode || '');
  };

  const handleSaveCode = async () => {
    if (editingCode && editCodeValue) {
      // Validate 4-digit code
      if (!/^\d{4}$/.test(editCodeValue)) {
        alert('Kod logowania musi składać się z dokładnie 4 cyfr');
        return;
      }

      try {
        // Update code via API
        const response = await employeesApi.updateLoginCode(editingCode.id, editCodeValue);
        
        if (response.data) {
          queryClient.invalidateQueries({ queryKey: ['employees'] });
          setEditingCode(null);
          setEditCodeValue('');
          alert('Kod logowania został zaktualizowany');
        }
      } catch (error: unknown) {
        console.error('Error updating login code:', error);

        const message =
          error && typeof error === 'object' && 'response' in error
            ? // axios-like
              ((error as { response?: { data?: { error?: string } } }).response?.data?.error ?? undefined)
            : undefined;

        alert(message || 'Wystąpił błąd podczas aktualizacji kodu logowania');
      }
    }
  };

  const handleCancelEditCode = () => {
    setEditingCode(null);
    setEditCodeValue('');
  };

  const toggleUserStatus = (userId: string) => {
    const user = employees.find(emp => emp.id === userId);
    if (user) {
      updateEmployeeMutation.mutate({
        id: userId,
        data: { isActive: !user.isActive }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: EmployeeRole.CASHIER,
      loginCode: '',
      password: ''
    });
  };

  const getRoleLabel = (role: EmployeeRole) => {
    switch (role) {
      case 'MANAGER': return '👑 Manager';
      case 'CASHIER': return '💰 Kasjer';
      case 'COOK': return '🍽️ Kucharz';
      case 'DRIVER': return '🚚 Kierowca';
      default: return role;
    }
  };

  const getRoleColor = (role: EmployeeRole) => {
    switch (role) {
      case 'MANAGER': return '#dc2626';
      case 'CASHIER': return '#2563eb';
      case 'COOK': return '#059669';
      case 'DRIVER': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div className="header-content">
          <h1>👥 Zarządzanie użytkownikami</h1>
          <p>Dodawaj, edytuj i zarządzaj użytkownikami systemu POS</p>
        </div>
        <div className="header-actions">
          <div className="toggle-container">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              <span className="toggle-text">Pokaż nieaktywnych</span>
            </label>
          </div>
          <button 
            onClick={() => setShowAddUser(true)}
            className="add-user-btn"
          >
            ➕ Dodaj użytkownika
          </button>
        </div>
      </div>

      <div className="users-container">
        {isLoading ? (
          <div className="loading">Ładowanie pracowników...</div>
        ) : error ? (
          <div className="error">Błąd podczas ładowania pracowników</div>
        ) : (
          <div className="users-grid">
            {employees.map(user => (
            <div key={user.id} className={`user-card ${!user.isActive ? 'inactive' : ''}`}>
              <div className="user-header">
                <div className="user-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3>{user.name}</h3>
                  <p className="user-email">{user.email}</p>
                </div>
                <div className="user-status">
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? '✅ Aktywny' : '❌ Nieaktywny'}
                  </span>
                </div>
              </div>
              
              <div className="user-details">
                <div className="role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
                  {getRoleLabel(user.role)}
                </div>
                <div className="login-code-section">
                  <p className="login-code-label">Kod logowania:</p>
                  <div className="login-code-display">
                    <span className="login-code">{user.loginCode || 'Brak'}</span>
                    <button 
                      onClick={() => handleEditCode(user)}
                      className="edit-code-btn"
                      title="Edytuj kod"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleGenerateNewLoginCode(user.id)}
                      className="generate-code-btn"
                      title="Wygeneruj nowy kod"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                <p className="user-date">Dodano: {user.createdAt instanceof Date ? user.createdAt.toLocaleDateString() : user.createdAt}</p>
              </div>

              <div className="user-actions">
                <button 
                  onClick={() => handleEditUser(user)}
                  className="edit-btn"
                >
                  ✏️ Edytuj
                </button>
                <button 
                  onClick={() => toggleUserStatus(user.id)}
                  className={`toggle-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                >
                  {user.isActive ? '❌ Dezaktywuj' : '✅ Aktywuj'}
                </button>
                {user.role !== EmployeeRole.MANAGER && (
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="delete-btn"
                  >
                    🗑️ Usuń
                  </button>
                )}
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal dodawania użytkownika */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>➕ Dodaj nowego użytkownika</h2>
              <button onClick={() => setShowAddUser(false)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Imię i nazwisko *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                  placeholder="Wprowadź imię i nazwisko"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                  placeholder="Wprowadź email"
                />
              </div>
              <div className="form-group">
                <label>Rola *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as EmployeeRole})}
                  className="form-select"
                >
                  <option value="CASHIER">💰 Kasjer</option>
                  <option value="COOK">🍽️ Kucharz</option>
                  <option value="DRIVER">🚚 Kierowca</option>
                  <option value="MANAGER">👑 Manager</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kod logowania (4 cyfry)</label>
                <input
                  type="text"
                  value={formData.loginCode}
                  onChange={(e) => setFormData({...formData, loginCode: e.target.value})}
                  className="form-input"
                  placeholder="Wprowadź 4-cyfrowy kod (opcjonalne)"
                  maxLength={4}
                  pattern="[0-9]{4}"
                />
                <small className="form-hint">Pozostaw puste, aby wygenerować automatycznie</small>
              </div>
              <div className="form-group">
                <label>Hasło *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="form-input"
                  placeholder="Wprowadź hasło"
                />
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowAddUser(false)} className="cancel-btn">
                ❌ Anuluj
              </button>
              <button onClick={handleAddUser} className="submit-btn">
                ✅ Dodaj użytkownika
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edycji użytkownika */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>✏️ Edytuj użytkownika</h2>
              <button onClick={() => setEditingUser(null)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Imię i nazwisko *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Rola *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as EmployeeRole})}
                  className="form-select"
                >
                  <option value="CASHIER">💰 Kasjer</option>
                  <option value="COOK">🍽️ Kucharz</option>
                  <option value="DRIVER">🚚 Kierowca</option>
                  <option value="MANAGER">👑 Manager</option>
                </select>
              </div>
              <div className="form-group">
                <label>Kod logowania (4 cyfry)</label>
                <input
                  type="text"
                  value={formData.loginCode}
                  onChange={(e) => setFormData({...formData, loginCode: e.target.value})}
                  className="form-input"
                  placeholder="Wprowadź 4-cyfrowy kod"
                  maxLength={4}
                  pattern="[0-9]{4}"
                />
                <small className="form-hint">Pozostaw puste, aby wygenerować automatycznie</small>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setEditingUser(null)} className="cancel-btn">
                ❌ Anuluj
              </button>
              <button onClick={handleUpdateUser} className="submit-btn">
                ✅ Zaktualizuj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edycji kodu logowania */}
      {editingCode && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>✏️ Edytuj kod logowania</h2>
              <button onClick={handleCancelEditCode} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>Użytkownik:</label>
                <p className="user-info">{editingCode.name} ({editingCode.email})</p>
              </div>
              <div className="form-group">
                <label>Kod logowania (4 cyfry) *</label>
                <input
                  type="text"
                  value={editCodeValue}
                  onChange={(e) => setEditCodeValue(e.target.value)}
                  className="form-input"
                  placeholder="Wprowadź 4-cyfrowy kod"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  style={{ fontFamily: 'Courier New, monospace', fontSize: '1.2rem', letterSpacing: '2px', textAlign: 'center' }}
                />
                <small className="form-hint">Kod musi składać się z dokładnie 4 cyfr (0-9)</small>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={handleCancelEditCode} className="cancel-btn">
                ❌ Anuluj
              </button>
              <button onClick={handleSaveCode} className="submit-btn">
                ✅ Zapisz kod
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

