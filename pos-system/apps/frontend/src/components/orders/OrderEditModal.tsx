import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '../../types/shared';
import { ordersApi } from '../../api/orders';
import './OrderEditModal.css';

interface OrderEditModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

const ORDER_STATUSES = [
  { value: 'OPEN', label: 'Otwarte', color: '#3b82f6', icon: '📋' },
  { value: 'IN_PROGRESS', label: 'W realizacji', color: '#f59e0b', icon: '⏳' },
  { value: 'READY', label: 'Gotowe', color: '#10b981', icon: '✅' },
  { value: 'COMPLETED', label: 'Zakończone', color: '#6b7280', icon: '🏁' },
  { value: 'CANCELLED', label: 'Anulowane', color: '#ef4444', icon: '❌' }
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Gotówka', icon: '💵' },
  { value: 'CARD', label: 'Karta', icon: '💳' },
  { value: 'PAID', label: 'Zapłacone', icon: '✅' }
];

export const OrderEditModal: React.FC<OrderEditModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const queryClient = useQueryClient();

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      ordersApi.updateOrderStatus(orderId, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-geo'] });
      if (onOrderUpdated && data.data) {
        onOrderUpdated(data.data);
      }
      alert('Status zamówienia został zaktualizowany');
      onClose();
    },
    onError: (error) => {
      console.error('Update status error:', error);
      alert('Błąd podczas aktualizacji statusu');
    }
  });

  // Initialize form when order changes
  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
      setSelectedPayment('CASH'); // Default payment method
    }
  }, [order]);

  const handleConfirm = () => {
    if (!order || !selectedStatus) return;

    updateStatusMutation.mutate({
      orderId: order.id,
      status: selectedStatus
    });
  };

  const handleCancel = () => {
    setSelectedStatus('');
    setSelectedPayment('');
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="order-edit-modal-overlay">
      <div className="order-edit-modal">
        <div className="modal-header">
          <h2>Zmień status zamówienia: {order.orderNumber}</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Order Info */}
          <div className="order-info">
            <div className="order-header">
              <span className="order-number">{order.orderNumber}</span>
              <span className="order-type-badge">
                {order.type === 'DELIVERY' ? '🚚 Dowóz' : 
                 order.type === 'TAKEAWAY' ? '📦 Wynos' : '🍽️ Na miejscu'}
              </span>
            </div>
            
            <div className="customer-info">
              <p><strong>Klient:</strong> {order.customer?.name || 'Brak danych'}</p>
              <p><strong>Telefon:</strong> {order.customer?.phone || 'Brak danych'}</p>
              {order.delivery?.address && (
                <p><strong>Adres:</strong> {order.delivery.address.street}, {order.delivery.address.city}</p>
              )}
              <p><strong>Wartość:</strong> {order.total.toFixed(2)} zł</p>
            </div>
          </div>

          {/* Status Selection */}
          <div className="status-section">
            <h3>Zakończ zamówienie</h3>
            <div className="status-buttons">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status.value}
                  className={`status-btn ${selectedStatus === status.value ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: selectedStatus === status.value ? status.color : '#f3f4f6',
                    color: selectedStatus === status.value ? 'white' : '#374151'
                  }}
                  onClick={() => setSelectedStatus(status.value)}
                >
                  <span className="status-icon">{status.icon}</span>
                  <span className="status-label">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection - ukryj dla zamówień anulowanych */}
          {order?.status !== 'CANCELLED' && (
            <div className="payment-section">
              <h3>Wybierz formę płatności</h3>
              <div className="payment-buttons">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    className={`payment-btn ${selectedPayment === method.value ? 'selected' : ''}`}
                    onClick={() => setSelectedPayment(method.value)}
                  >
                    <span className="payment-icon">{method.icon}</span>
                    <span className="payment-label">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedStatus || updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Aktualizowanie...' : 'Potwierdź'}
          </button>
        </div>
      </div>
    </div>
  );
};


