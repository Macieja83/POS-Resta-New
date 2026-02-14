import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, Order, OrderStatus, PaymentMethod } from '../../types/shared';
import { ordersApi } from '../../api/orders';
import { useAuth } from '../../contexts/AuthContext';
import './OrderStatusChangeModal.css';

interface OrderStatusChangeModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

const ORDER_STATUSES: Array<{ value: OrderStatus; label: string; color: string; icon: string; borderColor: string }> = [
  { value: OrderStatus.OPEN, label: 'Otwarte', color: '#3b82f6', icon: '📋', borderColor: '#3b82f6' },
  { value: OrderStatus.IN_PROGRESS, label: 'W realizacji', color: '#f59e0b', icon: '⏳', borderColor: '#f59e0b' },
  { value: OrderStatus.READY, label: 'Gotowe', color: '#10b981', icon: '✅', borderColor: '#10b981' },
  { value: OrderStatus.COMPLETED, label: 'Odebrane / Zapłacone', color: '#059669', icon: '🏁', borderColor: '#059669' },
  { value: OrderStatus.CANCELLED, label: 'Anulowane', color: '#ef4444', icon: '🚫', borderColor: '#ef4444' }
];

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; icon: string }> = [
  { value: PaymentMethod.CASH, label: 'Gotówka', icon: '💵' },
  { value: PaymentMethod.PAID, label: 'Zapłacone', icon: '✅' },
  { value: PaymentMethod.CARD, label: 'Karta', icon: '💳' }
];

export const OrderStatusChangeModal: React.FC<OrderStatusChangeModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('');
  const queryClient = useQueryClient();
  const { employee } = useAuth();

  const isCompletionStatus = selectedStatus === OrderStatus.COMPLETED || selectedStatus === OrderStatus.CANCELLED;

  // Update order status mutation – optimistic update + cache update without refetch
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, paymentMethod, completedBy }: {
      orderId: string;
      status: OrderStatus;
      paymentMethod?: PaymentMethod;
      completedBy?: Pick<Employee, 'id' | 'name' | 'role'>;
    }) =>
      ordersApi.updateOrderStatus(orderId, {
        status,
        ...(paymentMethod && { paymentMethod }),
        ...(completedBy && { completedBy })
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      const previous = queryClient.getQueriesData({ queryKey: ['orders'] });
      const optimisticOrder = order
        ? { ...order, status: variables.status, paymentMethod: variables.paymentMethod ?? order.paymentMethod }
        : null;
      if (optimisticOrder) {
        queryClient.setQueriesData(
          { queryKey: ['orders'] },
          (old: unknown) => {
            const typedOld = old as { data?: { orders?: Order[] } } | undefined;
            if (!typedOld?.data?.orders) return old;
            return {
              ...typedOld,
              data: {
                ...typedOld.data,
                orders: typedOld.data.orders.map((o: Order) =>
                  o.id === variables.orderId ? optimisticOrder : o
                )
              }
            };
          }
        );
      }
      return { previous };
    },
    onSuccess: (data) => {
      const updated = data.data;
      if (updated) {
        queryClient.setQueriesData(
          { queryKey: ['orders'] },
          (old: unknown) => {
            const typedOld = old as { data?: { orders?: Order[] } } | undefined;
            if (!typedOld?.data?.orders) return old;
            return {
              ...typedOld,
              data: {
                ...typedOld.data,
                orders: typedOld.data.orders.map((o: Order) => (o.id === updated.id ? updated : o))
              }
            };
          }
        );
        window.dispatchEvent(new CustomEvent('orderStatusChanged', { 
          detail: { orderId: updated.id, status: updated.status } 
        }));
        if (onOrderUpdated) onOrderUpdated(updated);
      }
      queryClient.invalidateQueries({ queryKey: ['orders-geo'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['order-summary'], refetchType: 'none' });
    },
    onError: (error, _variables, context) => {
      console.error('Update status error:', error);
      if (context?.previous) {
        context.previous.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      alert('Błąd podczas aktualizacji statusu');
    }
  });

  // Initialize form when order changes
  React.useEffect(() => {
    if (order) {
      setSelectedStatus(order.status || OrderStatus.OPEN);
      setSelectedPaymentMethod(PaymentMethod.CASH);
    }
  }, [order]);

  const handleConfirm = () => {
    if (!order || !selectedStatus) return;

    if (isCompletionStatus && !employee) {
      alert('Błąd: Brak danych zalogowanego pracownika');
      return;
    }

    const employeeData = employee ? {
      id: employee.id,
      name: employee.name,
      role: employee.role
    } : undefined;

    onClose();
    updateStatusMutation.mutate({
      orderId: order.id,
      status: selectedStatus,
      paymentMethod: isCompletionStatus ? (selectedPaymentMethod || undefined) : undefined,
      completedBy: isCompletionStatus ? employeeData : undefined
    });
  };

  const handleCancel = () => {
    setSelectedStatus('');
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
          <div className="completion-section">
            <h3>Status zamówienia</h3>
            <div className="completion-buttons">
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status.value}
                  className={`completion-btn ${selectedStatus === status.value ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: selectedStatus === status.value ? status.color : 'white',
                    color: selectedStatus === status.value ? 'white' : '#374151',
                    borderColor: status.borderColor
                  }}
                  onClick={() => setSelectedStatus(status.value)}
                >
                  <span className="completion-icon">{status.icon}</span>
                  <span className="completion-label">{status.label}</span>
                </button>
              ))}
            </div>
          </div>

          {isCompletionStatus && (
            <div className="payment-section">
              <h3>Forma płatności</h3>
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
