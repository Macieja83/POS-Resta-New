import React, { useState } from 'react';
import { Order } from '../../types/shared';
import { ordersApi } from '../../api/orders';
import { ReceiptPrinter } from './ReceiptPrinter';
import { OrderItem, CustomerData } from '../../types/order';
import './OrderDetailView.css';

interface OrderDetailViewProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onChangeStatus: (order: Order) => void;
  onOrderUpdated?: (order: Order) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  isOpen,
  onClose,
  onEdit,
  onChangeStatus,
  onOrderUpdated
}) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  if (!isOpen || !order) return null;
  

  const formatPrice = (price: number) => {
    return `${(price || 0).toFixed(2)} zł`;
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'DELIVERY': return 'Dowóz';
      case 'TAKEAWAY': return 'Wynos';
      case 'DINE_IN': return 'Na miejscu';
      default: return 'Nieznany';
    }
  };

  const getPaymentText = (paymentMethod: string) => {
    const method = paymentMethod?.toLowerCase();
    switch (method) {
      case 'cash': return 'Gotówka';
      case 'card': return 'Karta';
      case 'paid': return 'Zapłacone';
      default: return 'Nie wybrano';
    }
  };

  const handlePaymentChange = async (newPaymentMethod: string) => {
    // Nie aktualizuj paymentMethod dla zamówień anulowanych
    if (order.status === 'CANCELLED') {
      alert('Nie można zmieniać formy płatności dla zamówień anulowanych');
      return;
    }
    
    try {
      setSelectedPaymentMethod(newPaymentMethod);
      setShowPaymentModal(false);
      
      // Convert lowercase payment method to uppercase for backend
      const backendPaymentMethod = newPaymentMethod ? newPaymentMethod.toUpperCase() : undefined;
      
      const response = await ordersApi.updatePaymentMethod(order.id, backendPaymentMethod);
      
      if (response.success && onOrderUpdated && response.data) {
        onOrderUpdated(response.data);
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert('Wystąpił błąd podczas aktualizacji formy płatności');
    }
  };

  const openPaymentModal = () => {
    // Convert uppercase payment method to lowercase for UI consistency
    const paymentMethod = order.paymentMethod?.toLowerCase() || '';
    setSelectedPaymentMethod(paymentMethod);
    setShowPaymentModal(true);
  };

  const isHistoricalOrder = order.status === 'COMPLETED' || order.status === 'CANCELLED';

  const convertOrderToOrderItems = (order: Order): OrderItem[] => {
    return order.items?.map(item => ({
      id: `item-${Math.random()}`,
      name: item.name || 'Brak nazwy',
      quantity: item.quantity || 0,
      price: item.price || 0,
      total: (item.price || 0) * (item.quantity || 0),
      addons: item.addons || [],
      ingredients: item.ingredients || [],
      addedIngredients: item.addedIngredients || [],
      removedIngredients: item.removedIngredients || [],
      isHalfHalf: item.isHalfHalf || false,
      selectedSize: item.selectedSize || undefined,
      leftHalf: item.leftHalf || undefined,
      rightHalf: item.rightHalf || undefined,
      notes: item.notes || undefined
    })) || [];
  };

  const convertOrderToCustomerData = (order: Order): any => {
    return {
      name: order.customer?.name || 'Brak nazwiska',
      phone: order.customer?.phone || 'Brak numeru telefonu',
      email: order.customer?.email || 'Brak emaila',
      pickupType: order.type === 'DELIVERY' ? 'delivery' : order.type === 'TAKEAWAY' ? 'takeaway' : 'dine_in',
      address: order.delivery?.address ? {
        id: order.delivery.address.id || '',
        street: order.delivery.address.street,
        city: order.delivery.address.city,
        postalCode: order.delivery.address.postalCode || '',
        latitude: order.delivery.address.latitude ? Number(order.delivery.address.latitude) : undefined,
        longitude: order.delivery.address.longitude ? Number(order.delivery.address.longitude) : undefined
      } : {
        id: '',
        street: '',
        city: '',
        postalCode: ''
      },
      nip: '',
      orderSource: 'pos',
      tableNumber: order.tableNumber,
      notes: order.notes,
      paymentMethod: 'cash',
      printReceipt: true,
      deliveryType: 'asap',
      promisedTime: order.promisedTime || 30,
      customTime: undefined,
      scheduledDateTime: new Date().toISOString()
    };
  };

  return (
    <div className="order-detail-overlay order-detail-view">
      <div className="order-detail-container">
        {/* Header */}
        <div className="order-detail-header">
          <div className="header-left">
            <button className="close-btn" onClick={onClose}>×</button>
            <div className="order-info">
              <div className="order-info-row">
                <span className="order-number">Numer: {order.orderNumber}</span>
                <span className="order-status">{order.status}</span>
              </div>
              <div className="order-info-row">
                <span className="order-type">{getTypeText(order.type)}</span>
                <span className="order-total">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
          <div className="header-right">
            <button 
              className="edit-order-btn"
              onClick={() => onEdit(order)}
              title="Edytuj zamówienie"
            >
              ✏️ Edytuj
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="order-detail-content">
          {/* Left Panel - Order Details */}
          <div className="order-detail-left">
            <div className="order-section">
              <h3>Zawartość zamówienia</h3>
              <div className="order-items-table">
                <div className="table-header">
                  <span>Nazwa</span>
                  <span>Ilość</span>
                </div>
                {order.items?.map((item, index) => (
                  <div key={index} className="table-row">
                    <div className="item-details">
                      <div className="item-name-row">
                        <div className="item-name-container">
                          <span className="item-name">
                            {item.name || 'Brak nazwy'}
                            {item.selectedSize && (
                              <span style={{ 
                                color: '#6b7280',
                                fontSize: '0.75rem',
                                marginLeft: '0.25rem'
                              }}>
                                - {item.selectedSize.name}
                              </span>
                            )}
                          </span>
                        </div>
                        {/* Wyświetl dodatki jeśli istnieją */}
                        {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                          <div className="item-addons">
                            {item.addons.map((addon: any, addonIndex: number) => (
                              <div key={addonIndex} className="addon-item">
                                <span className="addon-name">+ {addon.name}</span>
                                {addon.quantity > 1 && (
                                  <span className="addon-quantity">x{addon.quantity}</span>
                                )}
                                <span className="addon-price">+{formatPrice(addon.price * (addon.quantity || 1))}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Wyświetl rozmiar jeśli istnieje */}
                      {item.selectedSize && (
                        <div className="item-size">
                          <span className="size-name">Rozmiar: {item.selectedSize.name}</span>
                          {item.selectedSize.price && (
                            <span className="size-price"> (+{formatPrice(item.selectedSize.price)})</span>
                          )}
                        </div>
                      )}
                      {/* Wyświetl usunięte składniki jeśli istnieją */}
                      {item.removedIngredients && Array.isArray(item.removedIngredients) && item.removedIngredients.length > 0 && (
                        <div className="item-removed-ingredients">
                          {item.removedIngredients.map((ingredient: any, ingredientIndex: number) => (
                            <span key={ingredientIndex} className="removed-ingredient">- {ingredient.name}</span>
                          ))}
                        </div>
                      )}
                      {/* Wyświetl pół na pół jeśli istnieje */}
                      {item.isHalfHalf && (
                        <div className="item-half-half">
                          {item.leftHalf && (
                            <div className="half-detail">
                              <span className="half-label">Lewa: {item.leftHalf.dishName}</span>
                              {item.leftHalf.addons && item.leftHalf.addons.length > 0 && (
                                <div className="half-addons">
                                  {item.leftHalf.addons.map((addon: any, addonIndex: number) => (
                                    <span key={addonIndex} className="half-addon">+ {addon.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          {item.rightHalf && (
                            <div className="half-detail">
                              <span className="half-label">Prawa: {item.rightHalf.dishName}</span>
                              {item.rightHalf.addons && item.rightHalf.addons.length > 0 && (
                                <div className="half-addons">
                                  {item.rightHalf.addons.map((addon: any, addonIndex: number) => (
                                    <span key={addonIndex} className="half-addon">+ {addon.name}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {/* Wyświetl notatki jeśli istnieją */}
                      {item.notes && (
                        <div className="item-notes">
                          <span className="notes-text">Notatka: {item.notes}</span>
                        </div>
                      )}
                    </div>
                    <div className="item-right-column">
                      <span className="item-total">{formatPrice(item.total || 0)}</span>
                      <span className="item-quantity">{(item.quantity || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-section">
              <div className="summary-row">
                <span>Łączna cena</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Client and Order Information */}
          <div className="order-detail-right">
            <div className="order-section">
              <h3>Informacje o kliencie</h3>
              <div className="client-info">
                <div className="info-row">
                  <span className="info-icon">📞</span>
                  <span>{order.customer?.phone || 'Brak numeru telefonu'}</span>
                </div>
                <div className="info-row">
                  <span className="info-icon">📍</span>
                  <span>
                    {order.delivery?.address 
                      ? `${order.delivery.address.street}, ${order.delivery.address.city}`
                      : 'Brak adresu'
                    }
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">👤</span>
                  <span>{order.customer?.name || 'Brak nazwiska'}</span>
                </div>
              </div>
            </div>

            <div className="order-section">
              <h3>Informacje o zamówieniu</h3>
              <div className="order-info-details">
                {/* Ukryj formę płatności dla zamówień anulowanych */}
                {order.status !== 'CANCELLED' && (
                  <div className="info-row">
                    <span className="info-icon">💳</span>
                    <span>{order.paymentMethod ? getPaymentText(order.paymentMethod) : 'Nie wybrano'}</span>
                    <button 
                      className={`edit-info-btn ${isHistoricalOrder ? 'disabled' : ''}`}
                      onClick={() => !isHistoricalOrder && openPaymentModal()}
                      disabled={isHistoricalOrder}
                    >
                      ✏️
                    </button>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-icon">🚗</span>
                  <span>
                    {order.assignedEmployee?.name || 'Brak przypisanego kierowcy'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-icon">🕐</span>
                  <span>Ostatnia aktualizacja: {new Date(order.updatedAt).toLocaleString('pl-PL')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="order-detail-footer">
          <button 
            className={`change-status-btn ${isHistoricalOrder ? 'disabled' : ''}`}
            onClick={() => !isHistoricalOrder && onChangeStatus(order)}
            disabled={isHistoricalOrder}
          >
            ✅ ZMIEŃ STATUS
          </button>
          <button 
            className="voucher-btn"
            onClick={() => setShowReceiptModal(true)}
          >
            🧾 BON
          </button>
          <button className="receipt-btn">🧾 PARAGON</button>
          <button className="invoice-btn">💰 FV</button>
          <button className="split-btn">✂️ PODZIEL</button>
          <div className="keyboard-shortcuts">ESC OK</div>
        </div>

        {/* Payment Method Selection Modal */}
        {showPaymentModal && (
          <div className="payment-modal-overlay">
            <div className="payment-modal">
              <div className="payment-modal-header">
                <h3>Wybierz formę płatności</h3>
                <button 
                  className="close-btn" 
                  onClick={() => setShowPaymentModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="payment-options">
                <button
                  className={`payment-option ${selectedPaymentMethod?.toLowerCase() === 'cash' ? 'selected' : ''}`}
                  onClick={() => handlePaymentChange('cash')}
                >
                  <span className="payment-icon">💰</span>
                  <span>Gotówka</span>
                </button>
                <button
                  className={`payment-option ${selectedPaymentMethod?.toLowerCase() === 'card' ? 'selected' : ''}`}
                  onClick={() => handlePaymentChange('card')}
                >
                  <span className="payment-icon">💳</span>
                  <span>Karta</span>
                </button>
                <button
                  className={`payment-option ${selectedPaymentMethod?.toLowerCase() === 'paid' ? 'selected' : ''}`}
                  onClick={() => handlePaymentChange('paid')}
                >
                  <span className="payment-icon">✅</span>
                  <span>Zapłacone</span>
                </button>
                <button
                  className={`payment-option remove-payment ${selectedPaymentMethod === '' ? 'selected' : ''}`}
                  onClick={() => handlePaymentChange('')}
                >
                  <span className="payment-icon">❌</span>
                  <span>Usuń płatność</span>
                </button>
              </div>
              <div className="payment-modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal bonu */}
        <ReceiptPrinter
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          orderItems={convertOrderToOrderItems(order)}
          customerData={convertOrderToCustomerData(order)}
          totalPrice={order.total || 0}
        />
      </div>
    </div>
  );
};
