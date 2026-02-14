import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { employeesApi } from '../../api/employees';
import { ordersApi } from '../../api/orders';
import { Order } from '../../types/shared';
import './DriverSelector.css';

interface DriverSelectorProps {
  order: Order;
  onDriverAssigned?: (updatedOrder: Order) => void;
}

export const DriverSelector: React.FC<DriverSelectorProps> = ({ order, onDriverAssigned }) => {
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zoptymalizowane - używa React Query dla cache'owania kierowców
  const { data: driversData, isLoading: loading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => employeesApi.getDrivers(),
    staleTime: 5 * 60 * 1000, // Cache przez 5 minut
    gcTime: 10 * 60 * 1000, // Keep in cache przez 10 minut
    retry: 1,
    retryDelay: 200
  });

  const drivers = driversData?.data || [];

  // Zoptymalizowane - używa React Query mutation
  const assignDriverMutation = useMutation({
    mutationFn: (driverId: string) => ordersApi.assignEmployee(order.id, { employeeId: driverId }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        onDriverAssigned?.(response.data);
      } else {
        setError('Nie udało się przypisać kierowcy');
      }
    },
    onError: (err) => {
      setError('Wystąpił błąd podczas przypisywania kierowcy');
      console.error('Error assigning driver:', err);
    },
    onSettled: () => {
      setAssigning(false);
    }
  });

  const handleAssignDriver = async (driverId: string) => {
    setAssigning(true);
    setError(null);
    assignDriverMutation.mutate(driverId);
  };

  const handleUnassignDriver = async () => {
    setAssigning(true);
    setError(null);
    try {
      const response = await ordersApi.unassignEmployee(order.id);
      if (response.success && response.data) {
        onDriverAssigned?.(response.data);
      } else {
        setError('Nie udało się odpiąć kierowcy');
      }
    } catch (err) {
      setError('Wystąpił błąd podczas odpinania kierowcy');
      console.error('Error unassigning driver:', err);
    } finally {
      setAssigning(false);
    }
  };

  // Only show for delivery orders
  if (order.type !== 'DELIVERY') {
    return null;
  }

  if (loading) {
    return (
      <div className="driver-selector">
        <div className="loading">Ładowanie kierowców...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="driver-selector">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div 
      className="driver-selector"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="driver-info">
        <span className="label">Kierowca:</span>
        {order.assignedEmployee ? (
          <div className="assigned-driver">
            <span className="driver-name">{order.assignedEmployee.name}</span>
            <button 
              className="unassign-btn"
              onClick={handleUnassignDriver}
              disabled={assigning}
              title="Odpiąć kierowcę"
            >
              ✕
            </button>
          </div>
        ) : (
          <span className="no-driver">Nieprzypisany</span>
        )}
      </div>
      
      {!order.assignedEmployee && (
        <div className="driver-options">
          <select 
            className="driver-select"
            onChange={(e) => {
              if (e.target.value) {
                handleAssignDriver(e.target.value);
              }
            }}
            disabled={assigning}
            defaultValue=""
          >
            <option value="">Wybierz kierowcę...</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {assigning && (
        <div className="assigning">Przypisywanie...</div>
      )}
    </div>
  );
};

export default DriverSelector;
