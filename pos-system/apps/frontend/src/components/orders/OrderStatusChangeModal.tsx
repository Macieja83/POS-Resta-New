import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '../../types/shared';
import { ordersApi } from '../../api/orders';
import { useAuth } from '../../contexts/AuthContext';
import './OrderStatusChangeModal.css';

interface OrderStatusChangeModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

const COMPLETION_STATUSES = [
  { 
    value: 'CANCELLED', 
    label: 'Anulowane', 
    color: '#ef4444', 
    icon: '🚫',
    borderColor: '#ef4444'
  },
  { 
    value: 'COMPLETED', 
    label: 'Odebrane', 
    color: '#10b981', 
    icon: '✅',
    borderColor: '#10b981'
  }
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Gotówka', icon: '💵' },
  { value: 'PAID', label: 'Zapłacone', icon: '✅' },
  { value: 'CARD', label: 'Karta', icon: '💳' }
];

export const OrderStatusChangeModal: React.FC<OrderStatusChangeModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated
}) => {
  const [selectedCompletionStatus, setSelectedCompletionStatus] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const queryClient = useQueryClient();
  const { employee } = useAuth();

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, paymentMethod, completedBy }: { 
      orderId: string; 
      status: string; 
      paymentMethod?: string; 
      completedBy?: any; 
    }) =>
      ordersApi.updateOrderStatus(orderId, {
        status,
        paymentMethod,
        completedBy
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-geo'] });
      queryClient.invalidateQueries({ queryKey: ['order-summary'] });
      
      // Dispatch custom event for OrderSummaryPage
      if (data.data) {
        window.dispatchEvent(new CustomEvent('orderStatusChanged', { 
          detail: { orderId: data.data.id, status: data.data.status } 
        }));
        
        if (onOrderUpdated) {
          onOrderUpdated(data.data);
        }
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
      // Set default completion status based on current order status
      if (order.status === 'CANCELLED') {
        setSelectedCompletionStatus('CANCELLED');
      } else if (order.status === 'COMPLETED') {
        setSelectedCompletionStatus('COMPLETED');
      } else {
        // For other statuses, default to COMPLETED
        setSelectedCompletionStatus('COMPLETED');
      }
      setSelectedPaymentMethod('CASH'); // Default payment method
    }
  }, [order]);

  const handleConfirm = () => {
    if (!order || !selectedCompletionStatus) return;

    // Use logged in employee data
    if (!employee) {
      alert('Błąd: Brak danych zalogowanego pracownika');
      return;
    }

    const employeeData = {
      id: employee.id,
      name: employee.name,
      role: employee.role
    };

    updateStatusMutation.mutate({
      orderId: order.id,
      status: selectedCompletionStatus,
      paymentMethod: selectedPaymentMethod || undefined, // Convert empty string to undefined
      completedBy: employeeData
    });
  };

  const handleCancel = () => {
    setSelectedCompletionStatus('');
    setSelectedPaymentMethod('');
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="order-status-change-modal-overlay">
      <div className="order-status-change-modal">
        <div className="modal-header">
          <h2>Zmień status zamówienia: {order.orderNumber}</h2>
          <button className="close-btn" onClick={handleCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Order Completion Status Section */}
          <div className="completion-section">
            <h3>Zakończ zamówienie</h3>
            <div className="completion-buttons">
              {COMPLETION_STATUSES.map((status) => (
                <button
                  key={status.value}
                  className={`completion-btn ${selectedCompletionStatus === status.value ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: selectedCompletionStatus === status.value ? status.color : 'white',
                    color: selectedCompletionStatus === status.value ? 'white' : '#374151',
                    borderColor: status.borderColor
                  }}
                  onClick={() => setSelectedCompletionStatus(status.value)}
                >
                  <span className="completion-icon">{status.icon}</span>
                  <span className="completion-label">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Selection Section */}
          <div className="payment-section">
            <h3>Wybierz formę płatności</h3>
            <div className="payment-method-label">Forma płatności</div>
            <div className="payment-buttons">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  className={`payment-btn ${selectedPaymentMethod === method.value ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentMethod(method.value)}
                >
                  <span className="payment-label">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="confirm-btn"
            onClick={handleConfirm}
            disabled={!selectedCompletionStatus || updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? 'Aktualizowanie...' : 'Potwierdź'}
          </button>
        </div>
      </div>
    </div>
  );
};
