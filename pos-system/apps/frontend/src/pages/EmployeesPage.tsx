import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Employee } from '../types/shared';

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = (await apiClient.get('/employees')) as unknown;
        const employeesData = (data as { data?: Employee[] }).data;
        setEmployees(employeesData || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  if (loading) return <div>Loading employees...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Employees</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {employees.map((employee) => (
          <div key={employee.id} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <h3>{employee.name}</h3>
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Role:</strong> {employee.role}</p>
            <p><strong>Phone:</strong> {employee.phone}</p>
            <p><strong>Login Code:</strong> {employee.loginCode}</p>
            <p><strong>Active:</strong> {employee.isActive ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
