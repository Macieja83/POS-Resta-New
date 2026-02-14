import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { Order, OrderStatus } from '../../types/shared';
import { handleError } from '../../lib/errorHandler';

interface OrderTrackingProps {
  orderId: string;
  onOrderUpdate?: (order: Order) => void;
  className?: string;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({
  orderId,
  onOrderUpdate,
  className = ''
}) => {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: () => ordersApi.getOrderById(orderId),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!orderId
  });

  useEffect(() => {
    if (data?.data) {
      setCurrentStatus(data.data.status);
      if (onOrderUpdate) {
        onOrderUpdate(data.data);
      }
    }
  }, [data, onOrderUpdate]);

  const getStatusInfo = (status: OrderStatus) => {
    const statusMap = {
      [OrderStatus.OPEN]: {
        label: 'Nowe zamówienie',
        description: 'Zamówienie zostało złożone i oczekuje na realizację',
        icon: '📝',
        color: 'bg-blue-100 text-blue-800',
        progress: 20
      },
      [OrderStatus.IN_PROGRESS]: {
        label: 'W realizacji',
        description: 'Zamówienie jest przygotowywane',
        icon: '👨‍🍳',
        color: 'bg-yellow-100 text-yellow-800',
        progress: 40
      },
      [OrderStatus.READY]: {
        label: 'Gotowe',
        description: 'Zamówienie jest gotowe do odbioru',
        icon: '✅',
        color: 'bg-green-100 text-green-800',
        progress: 60
      },
      [OrderStatus.ASSIGNED]: {
        label: 'Przypisane',
        description: 'Zamówienie zostało przypisane do pracownika',
        icon: '👤',
        color: 'bg-purple-100 text-purple-800',
        progress: 80
      },
      [OrderStatus.ON_THE_WAY]: {
        label: 'W drodze',
        description: 'Zamówienie jest w drodze do klienta',
        icon: '🚚',
        color: 'bg-orange-100 text-orange-800',
        progress: 90
      },
      [OrderStatus.DELIVERED]: {
        label: 'Dostarczone',
        description: 'Zamówienie zostało dostarczone',
        icon: '🎉',
        color: 'bg-green-100 text-green-800',
        progress: 100
      },
      [OrderStatus.COMPLETED]: {
        label: 'Zakończone',
        description: 'Zamówienie zostało zakończone',
        icon: '🏁',
        color: 'bg-gray-100 text-gray-800',
        progress: 100
      },
      [OrderStatus.CANCELLED]: {
        label: 'Anulowane',
        description: 'Zamówienie zostało anulowane',
        icon: '❌',
        color: 'bg-red-100 text-red-800',
        progress: 0
      },
      [OrderStatus.HISTORICAL]: {
        label: 'Historyczne',
        description: 'Zamówienie zostało przeniesione do historii',
        icon: '📚',
        color: 'bg-gray-100 text-gray-800',
        progress: 100
      }
    };

    return statusMap[status] || statusMap[OrderStatus.OPEN];
  };

  const getEstimatedTime = (order: Order) => {
    if (!order.promisedTime) return null;
    
    const createdAt = new Date(order.createdAt);
    const estimatedTime = new Date(createdAt.getTime() + order.promisedTime * 60000);
    const now = new Date();
    
    if (estimatedTime > now) {
      const diff = estimatedTime.getTime() - now.getTime();
      const minutes = Math.ceil(diff / 60000);
      return `${minutes} minut`;
    } else {
      return 'Przekroczono czas';
    }
  };

  if (isLoading) {
    return (
      <div className={`order-tracking ${className}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Ładowanie statusu zamówienia...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorDetails = handleError(error, false);
    return (
      <div className={`order-tracking ${className}`}>
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Błąd podczas ładowania</h3>
          <p>{errorDetails.message}</p>
          <button onClick={() => refetch()} className="btn btn-primary">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className={`order-tracking ${className}`}>
        <div className="error-container">
          <div className="error-icon">❓</div>
          <h3>Zamówienie nie znalezione</h3>
          <p>Nie można znaleźć zamówienia o podanym ID</p>
        </div>
      </div>
    );
  }

  const order = data.data;
  const statusInfo = getStatusInfo(order.status);
  const estimatedTime = getEstimatedTime(order);

  return (
    <div className={`order-tracking ${className}`}>
      <div className="order-header">
        <h2>Śledzenie zamówienia</h2>
        <div className="order-number">#{order.orderNumber}</div>
      </div>

      <div className="order-info">
        <div className="info-row">
          <span className="label">Typ:</span>
          <span className="value">
            {order.type === 'DELIVERY' && '🚚 Dowóz'}
            {order.type === 'TAKEAWAY' && '📦 Wynos'}
            {order.type === 'DINE_IN' && '🍽️ Na miejscu'}
          </span>
        </div>
        
        <div className="info-row">
          <span className="label">Klient:</span>
          <span className="value">{order.customer.name}</span>
        </div>
        
        <div className="info-row">
          <span className="label">Telefon:</span>
          <span className="value">{order.customer.phone}</span>
        </div>
        
        <div className="info-row">
          <span className="label">Wartość:</span>
          <span className="value">{order.total.toFixed(2)} zł</span>
        </div>
        
        {estimatedTime && (
          <div className="info-row">
            <span className="label">Szacowany czas:</span>
            <span className="value">{estimatedTime}</span>
          </div>
        )}
      </div>

      <div className="status-section">
        <div className="status-header">
          <div className={`status-badge ${statusInfo.color}`}>
            <span className="status-icon">{statusInfo.icon}</span>
            <span className="status-label">{statusInfo.label}</span>
          </div>
        </div>
        
        <p className="status-description">{statusInfo.description}</p>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${statusInfo.progress}%` }}
          ></div>
        </div>
      </div>

      {order.assignedEmployee && (
        <div className="employee-info">
          <h3>Przypisany pracownik</h3>
          <div className="employee-card">
            <div className="employee-avatar">
              {order.assignedEmployee.name.charAt(0).toUpperCase()}
            </div>
            <div className="employee-details">
              <div className="employee-name">{order.assignedEmployee.name}</div>
              <div className="employee-role">{order.assignedEmployee.role}</div>
            </div>
          </div>
        </div>
      )}

      <div className="order-items">
        <h3>Zamówione pozycje</h3>
        <div className="items-list">
          {order.items.map((item, index) => (
            <div key={index} className="item-row">
              <span className="item-quantity">{item.quantity}x</span>
              <span className="item-name">{item.name}</span>
              <span className="item-price">{item.total.toFixed(2)} zł</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tracking-actions">
        <button onClick={() => refetch()} className="btn btn-secondary">
          Odśwież status
        </button>
      </div>
    </div>
  );
};

export default OrderTracking;
