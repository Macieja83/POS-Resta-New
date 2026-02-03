import React from 'react';
import { Order, PaymentMethod } from '../../types/shared';
import DriverSelector from './DriverSelector';
import { CountdownTimer } from './CountdownTimer';

interface OrderItemRowProps {
  order: Order;
  isSelected: boolean;
  onEdit?: (order: Order) => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
  onCancel?: (order: Order) => void;
  onRestore?: (order: Order) => void;
  onChangeStatus?: (order: Order) => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'OPEN':
      return '#3b82f6'; // blue
    case 'IN_PROGRESS':
      return '#f59e0b'; // amber
    case 'READY':
      return '#10b981'; // emerald
    case 'COMPLETED':
      return '#059669'; // green
    case 'CANCELLED':
      return '#ef4444'; // red
    case 'HISTORICAL':
      return '#6b7280'; // gray
    case 'PENDING':
    case 'PENDING_ACCEPTANCE':
      return '#f97316'; // orange
    default:
      return '#6b7280'; // gray
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'OPEN':
      return 'Otwarte';
    case 'IN_PROGRESS':
      return 'W realizacji';
    case 'READY':
      return 'Gotowe';
    case 'COMPLETED':
      return 'Zrealizowane';
    case 'CANCELLED':
      return 'Anulowane';
    case 'HISTORICAL':
      return 'Historyczne';
    case 'PENDING':
    case 'PENDING_ACCEPTANCE':
      return 'Do zaakceptowania';
    default:
      return status;
  }
};

const getTypeText = (type: string, tableNumber?: string): string => {
  switch (type) {
    case 'DELIVERY':
      return 'Dostawa';
    case 'TAKEAWAY':
      return 'Odbiór';
    case 'DINE_IN':
      return tableNumber ? `Stolik ${tableNumber}` : 'Na miejscu';
    default:
      return type;
  }
};

const getPaymentText = (paymentMethod: string | PaymentMethod | undefined | null): string => {
  if (!paymentMethod) return 'Nieznana';
  
  switch (paymentMethod) {
    case PaymentMethod.CASH:
    case 'CASH':
    case 'cash':
      return 'Gotówka';
    case PaymentMethod.CARD:
    case 'CARD':
    case 'card':
      return 'Karta';
    case PaymentMethod.PAID:
    case 'PAID':
    case 'paid':
      return 'Zapłacone';
    default:
      return 'Nieznana';
  }
};

const getPaymentIcon = (paymentMethod: string | PaymentMethod | undefined | null): string => {
  if (!paymentMethod) return '❓';
  
  switch (paymentMethod) {
    case PaymentMethod.CASH:
    case 'CASH':
    case 'cash':
      return '💰';
    case PaymentMethod.CARD:
    case 'CARD':
    case 'card':
      return '💳';
    case PaymentMethod.PAID:
    case 'PAID':
    case 'paid':
      return '✅';
    default:
      return '❓';
  }
};

const formatPrice = (priceInGrosz: number | undefined): string => {
  if (priceInGrosz === undefined || priceInGrosz === null) {
    return '0.00 zł';
  }
  return `${priceInGrosz.toFixed(2)} zł`;
};

const OrderItemRowComponent: React.FC<OrderItemRowProps> = ({
  order,
  isSelected,
  onEdit,
  onOrderUpdated,
  onCancel,
  onRestore,
  onChangeStatus,
}) => {
  // Validate order data
  if (!order) {
    console.warn('OrderItemRow: order is undefined or null');
    return null;
  }

  const isPending = order.status === 'PENDING' || order.status === 'PENDING_ACCEPTANCE';

  const borderStyle = isSelected
    ? '2px solid #3b82f6'
    : isPending
      ? '2px solid rgba(251, 191, 36, 0.45)'
      : '1px solid #e2e8f0';

  const backgroundStyle = isSelected
    ? '#f0f9ff'
    : isPending
      ? 'rgba(255, 251, 235, 0.95)'
      : '#ffffff';

  const boxShadowStyle = isSelected
    ? '0 6px 20px rgba(59, 130, 246, 0.15), 0 3px 8px rgba(59, 130, 246, 0.1)'
    : isPending
      ? '0 8px 22px rgba(251, 191, 36, 0.25), 0 3px 10px rgba(251, 191, 36, 0.18)'
      : '0 2px 6px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.1)';

  return (
    <div
      className={`order-item ${isSelected ? 'selected' : ''} ${(order.status === 'COMPLETED' || order.status === 'CANCELLED') ? 'historical' : ''} ${isPending ? 'pending' : ''}`}
      onClick={() => {
        if (onEdit) {
          onEdit(order);
        }
      }}
      style={{
        padding: '0.75rem',
        border: borderStyle,
        borderRadius: '10px',
        marginBottom: '0.5rem',
        backgroundColor: backgroundStyle,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: boxShadowStyle,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        opacity: (order.status === 'COMPLETED' || order.status === 'CANCELLED') ? 0.7 : 1
      }}
    >
      {/* Header: Order number, time, total */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '0.75rem',
        paddingBottom: '0.5rem',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontWeight: '800', 
              color: '#0f172a', 
              fontSize: '1rem',
              letterSpacing: '-0.025em'
            }}>
              #{order.orderNumber?.slice(-4) || order.id?.slice(-4) || 'N/A'}
            </span>
            <span style={{ 
              color: '#64748b', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              backgroundColor: '#f8fafc',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              {new Date(order.createdAt).toLocaleTimeString('pl-PL', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          {(order.promisedTime || order.status === 'OPEN' || order.status === 'IN_PROGRESS') && !isPending && (
            <CountdownTimer 
              createdAt={order.createdAt instanceof Date ? order.createdAt.toISOString() : order.createdAt}
              promisedTime={order.promisedTime || 30}
              status={order.status}
            />
          )}
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          gap: '0.125rem'
        }}>
          <span style={{ 
            fontWeight: '800', 
            color: '#0f172a', 
            fontSize: '1.1rem',
            letterSpacing: '-0.025em'
          }}>
            {formatPrice(order.total)}
          </span>
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#64748b',
            fontWeight: '500'
          }}>
            Łączna kwota
          </span>
        </div>
      </div>

      {/* Order items */}
      <div style={{ 
        marginBottom: '0.75rem',
        padding: '0.5rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          fontSize: '0.85rem', 
          fontWeight: '700', 
          color: '#374151',
          marginBottom: '0.375rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem'
        }}>
          <span style={{ fontSize: '0.9rem' }}>🍽️</span>
          Zamówione dania ({order.items?.length || 0})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {(order.items || []).map((item, index) => (
            <div key={item.id || index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.375rem',
              backgroundColor: '#ffffff',
              borderRadius: '6px',
              border: '1px solid #f1f5f9',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '0.25rem',
                flex: 1
              }}>
                {/* Główna nazwa pozycji */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem'
                }}>
                  <span style={{ 
                    color: '#3b82f6',
                    fontWeight: '700',
                    minWidth: '1.25rem',
                    fontSize: '0.85rem',
                    backgroundColor: '#eff6ff',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    {item.quantity}x
                  </span>
                  <span style={{ 
                    color: '#1e293b',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}>
                    {item.name}
                    {item.selectedSize && (
                      <span style={{ 
                        color: '#6b7280',
                        fontSize: '0.75rem',
                        marginLeft: '0.25rem'
                      }}>
                        - {item.selectedSize.name}
                      </span>
                    )}
                    {item.isHalfHalf && (
                      <span style={{ 
                        color: '#f59e0b',
                        fontSize: '0.75rem',
                        marginLeft: '0.25rem'
                      }}>
                        (pół na pół)
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Rozmiar */}
                {item.selectedSize && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    marginLeft: '1.75rem'
                  }}>
                    Rozmiar: {item.selectedSize.name}
                  </div>
                )}
                
                {/* Płatne dodatki */}
                {item.addons && item.addons.length > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: '#059669',
                    marginLeft: '1.75rem'
                  }}>
                    + {item.addons.map(addon => `${addon.name} (${addon.quantity}x)`).join(', ')}
                  </div>
                )}
                
                {/* Dodane składniki */}
                {item.addedIngredients && item.addedIngredients.length > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: '#3b82f6',
                    marginLeft: '1.75rem'
                  }}>
                    + {item.addedIngredients.map(ing => `${ing.name} (${ing.quantity || 1}x)`).join(', ')}
                  </div>
                )}
                
                {/* Usunięte składniki */}
                {item.removedIngredients && item.removedIngredients.length > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: '#ef4444',
                    marginLeft: '1.75rem'
                  }}>
                    - {item.removedIngredients.map(ing => ing.name).join(', ')}
                  </div>
                )}
                
                {/* Pół na pół - szczegóły */}
                {item.isHalfHalf && item.leftHalf && item.rightHalf && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: '#f59e0b',
                    marginLeft: '1.75rem',
                    backgroundColor: '#fef3c7',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #fbbf24'
                  }}>
                    <div>Lewa: {item.leftHalf.dishName}</div>
                    <div>Prawa: {item.rightHalf.dishName}</div>
                  </div>
                )}
                
                {/* Notatki */}
                {item.notes && (
                  <div style={{ 
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic',
                    marginLeft: '1.75rem',
                    backgroundColor: '#f8fafc',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}>
                    💬 {item.notes}
                  </div>
                )}
              </div>
              <span style={{ 
                color: '#059669',
                fontWeight: '700',
                fontSize: '0.7rem',
                backgroundColor: '#f0fdf4',
                padding: '0.125rem 0.375rem',
                borderRadius: '4px'
              }}>
                {formatPrice(item.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Address/Table info */}
      {(order.delivery?.address || (order.type === 'DINE_IN' && order.tableNumber)) && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.375rem',
          padding: '0.375rem',
          backgroundColor: '#f8fafc',
          borderRadius: '6px',
          border: '1px solid #e2e8f0',
          marginBottom: '0.75rem'
        }}>
          <span style={{ 
            color: '#3b82f6', 
            fontSize: '0.9rem'
          }}>
            {order.type === 'DINE_IN' ? '🪑' : '📍'}
          </span>
          <span style={{ 
            color: '#475569', 
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            {order.type === 'DINE_IN' && order.tableNumber 
              ? `Stolik ${order.tableNumber}`
              : order.delivery?.address 
                ? `${order.delivery.address.street}, ${order.delivery.address.city}`
                : ''
            }
          </span>
        </div>
      )}

      {/* Tags and action buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '0.5rem',
        borderTop: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          <span
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '700',
              backgroundColor: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
              letterSpacing: '0.025em',
              textTransform: 'uppercase'
            }}
          >
            {getTypeText(order.type, order.tableNumber)}
          </span>
          <span
            role="button"
            tabIndex={0}
            title={onChangeStatus && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' ? 'Kliknij, aby zmienić status' : undefined}
            onClick={(e) => {
              e.stopPropagation();
              if (onChangeStatus && order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
                onChangeStatus(order);
              }
            }}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onChangeStatus && order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
                e.preventDefault();
                e.stopPropagation();
                onChangeStatus(order);
              }
            }}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '700',
              backgroundColor: getStatusColor(order.status),
              color: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              letterSpacing: '0.025em',
              textTransform: 'uppercase',
              cursor: onChangeStatus && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' ? 'pointer' : 'default',
              transition: 'opacity 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (onChangeStatus && order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {getStatusText(order.status)}
          </span>
          <span style={{ 
            color: '#64748b', 
            fontSize: '0.65rem', 
            fontWeight: '600',
            backgroundColor: '#f8fafc',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            border: '1px solid #e2e8f0'
          }}>
            {(order.items || []).length} {(order.items || []).length === 1 ? 'prod.' : 'prod.'}
          </span>
          {order.paymentMethod && (
            <span
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '700',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0',
                letterSpacing: '0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                textTransform: 'uppercase'
              }}
            >
              {getPaymentIcon(order.paymentMethod)} {getPaymentText(order.paymentMethod)}
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          
          {/* Przycisk anulowania - tylko dla aktywnych zamówień */}
          {order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onCancel) {
                  onCancel(order);
                }
              }}
              style={{
                width: '1.75rem',
                height: '1.75rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.3)';
              }}
              title="Anuluj zamówienie"
            >
              ⏹️
            </button>
          )}
          
          {/* Przycisk przywracania - tylko dla anulowanych/zakończonych zamówień */}
          {(order.status === 'CANCELLED' || order.status === 'COMPLETED') && onRestore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRestore) {
                  onRestore(order);
                }
              }}
              style={{
                width: '1.75rem',
                height: '1.75rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                backgroundColor: '#10b981',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
              }}
              title="Przywróć zamówienie"
            >
              🔄
            </button>
          )}


        </div>
      </div>
      
      {/* Driver Selector for delivery orders */}
      {order.type === 'DELIVERY' && (
        <div style={{ marginTop: '0.75rem' }}>
          <DriverSelector 
            order={order} 
            onDriverAssigned={onOrderUpdated}
          />
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const OrderItemRow = React.memo(OrderItemRowComponent);
