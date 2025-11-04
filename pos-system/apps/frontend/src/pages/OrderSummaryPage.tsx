import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { employeesApi } from '../api/employees';
import { OrderSummaryFilters, OrderSummaryResponse } from '../types/shared';
import './OrderSummaryPage.css';

export const OrderSummaryPage: React.FC = () => {
  const [employees, setEmployees] = useState<Array<{id: string, name: string}>>([]);
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<OrderSummaryFilters>({
    dateFrom: new Date().toISOString().slice(0, 10) + 'T00:00', // Today from 00:00
    dateTo: new Date().toISOString().slice(0, 10) + 'T23:59',   // Today until 23:59
  });

  // Use React Query for summary data with auto-refresh
  const { data: summaryData, isLoading: loading, error: summaryError } = useQuery({
    queryKey: ['order-summary', filters],
    queryFn: async () => {
      const response = await ordersApi.getOrderSummary(filters);
      return response.data;
    },
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    retry: 3,
  });

  // Fetch employees for filtering
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await employeesApi.getEmployees();
        setEmployees(response.data || []);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };
    fetchEmployees();
  }, []);

  const handleFilterChange = (key: keyof OrderSummaryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    setFilters({
      dateFrom: today + 'T00:00',
      dateTo: today + 'T23:59',
    });
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['order-summary'] });
  };

  if (loading) {
    return (
      <div className="order-summary-page">
        <div className="loading">Ładowanie podsumowania...</div>
      </div>
    );
  }

  if (summaryError) {
    return (
      <div className="order-summary-page">
        <div className="error">
          Błąd podczas ładowania podsumowania: {summaryError.message}
        </div>
      </div>
    );
  }

  const summary: OrderSummaryResponse = summaryData || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersByStatus: {},
    ordersByType: {},
    ordersByPaymentMethod: {},
    topEmployees: [],
    completedOrders: {
      all: { count: 0, total: 0 },
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      paid: { count: 0, total: 0 },
      discounts: { count: 0, total: 0 },
      deliveries: { count: 0, total: 0 },
      serviceFees: { count: 0, total: 0 },
      tips: { count: 0, total: 0 },
    },
    uncompletedOrders: {
      inProgress: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
    },
    employeeData: [],
  };
  const employeeStats = summary.topEmployees || [];
  const employeeData = summary.employeeData || [];

  return (
    <div className="order-summary-page">
      <div className="page-header">
        <h1>Podsumowanie zamówień</h1>
        <p className="subtitle">Przegląd statystyk i wydajności</p>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Data od:</label>
            <input
              type="datetime-local"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Data do:</label>
            <input
              type="datetime-local"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Pracownik:</label>
            <select
              value={filters.employeeId || ''}
              onChange={(e) => handleFilterChange('employeeId', e.target.value)}
            >
              <option value="">Wszyscy pracownicy</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <button onClick={resetFilters} className="reset-btn">
            <span className="reset-icon">↻</span>
            Resetuj
          </button>

          <button onClick={refreshData} className="refresh-btn">
            <span className="refresh-icon">🔄</span>
            Odśwież
          </button>
        </div>
      </div>


      {/* Main Summary Table */}
      <div className="summary-table-container">
        <table className="summary-main-table">
          <thead>
            <tr>
              <th rowSpan={2} className="name-col">Imię i nazwisko</th>
              <th rowSpan={2} className="role-col">Rola</th>
              <th colSpan={9} className="completed-header">Zrealizowane zamówienia</th>
              <th colSpan={2} className="uncompleted-header">Niezrealizowane</th>
            </tr>
            <tr>
              <th>Wszystkie</th>
              <th>Płatne gotówką</th>
              <th>Płatne kartą</th>
              <th>Zapłacone</th>
              <th>Z podziałem płatności</th>
              <th>Rabaty</th>
              <th>Za dostawy</th>
              <th>Opłata serwisowa integracji</th>
              <th>Napiwki</th>
              <th>W trakcie</th>
              <th>Anulowane</th>
            </tr>
          </thead>
          <tbody>
            {/* Rows for each employee and unassigned orders */}
            {employeeData.map((employee) => (
              <tr key={employee.id}>
                <td className={`name-col ${employee.id === 'unassigned' ? '' : 'manager-email'}`}>
                  {employee.name}
                </td>
                <td className="role-col">{employee.role}</td>
                <td>{employee.completedOrders.all.count} ({employee.completedOrders.all.total.toFixed(2)} zł)</td>
                <td>{employee.completedOrders.cash.count} ({employee.completedOrders.cash.total.toFixed(2)} zł)</td>
                <td>{employee.completedOrders.card.count} ({employee.completedOrders.card.total.toFixed(2)} zł)</td>
                <td>{employee.completedOrders.paid.count} ({employee.completedOrders.paid.total.toFixed(2)} zł)</td>
                <td>0 (0.00 zł)</td>
                <td>{employee.completedOrders.discounts.count} ({employee.completedOrders.discounts.total.toFixed(2)} zł)</td>
                <td>{employee.completedOrders.deliveries.count} ({employee.completedOrders.deliveries.total.toFixed(2)} zł)</td>
                <td>{employee.completedOrders.serviceFees.count} ({employee.completedOrders.serviceFees.total.toFixed(2)} zł)</td>
                <td>{employee.completedOrders.tips.count} ({employee.completedOrders.tips.total.toFixed(2)} zł)</td>
                <td>{employee.uncompletedOrders.inProgress.count} ({employee.uncompletedOrders.inProgress.total.toFixed(2)} zł)</td>
                <td>{employee.uncompletedOrders.cancelled.count} ({employee.uncompletedOrders.cancelled.total.toFixed(2)} zł)</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className="total-row">
              <td className="name-col">Razem</td>
              <td className="role-col"></td>
              <td>{summary.completedOrders.all.count} ({summary.completedOrders.all.total.toFixed(2)} zł)</td>
              <td>{summary.completedOrders.cash.count} ({summary.completedOrders.cash.total.toFixed(2)} zł)</td>
              <td>{summary.completedOrders.card.count} ({summary.completedOrders.card.total.toFixed(2)} zł)</td>
              <td>{summary.completedOrders.paid.count} ({summary.completedOrders.paid.total.toFixed(2)} zł)</td>
              <td>0 (0.00 zł)</td>
              <td>{summary.completedOrders.discounts.count} ({summary.completedOrders.discounts.total.toFixed(2)} zł)</td>
              <td>{summary.completedOrders.deliveries.count} ({summary.completedOrders.deliveries.total.toFixed(2)} zł)</td>
              <td>{summary.completedOrders.serviceFees.count} ({summary.completedOrders.serviceFees.total.toFixed(2)} zł)</td>
              <td>{summary.completedOrders.tips.count} ({summary.completedOrders.tips.total.toFixed(2)} zł)</td>
              <td>{summary.uncompletedOrders.inProgress.count} ({summary.uncompletedOrders.inProgress.total.toFixed(2)} zł)</td>
              <td>{summary.uncompletedOrders.cancelled.count} ({summary.uncompletedOrders.cancelled.total.toFixed(2)} zł)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
