import React from 'react';
import { OrderItem } from '../../types/order';
import './ReceiptPrinter.css';

interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    comment?: string;
    deliveryPrice?: number;
    latitude?: number;
    longitude?: number;
  };
  nip?: string;
  orderSource?: string;
  pickupType: 'dine_in' | 'takeaway' | 'delivery';
  paymentMethod?: 'cash' | 'paid' | 'card';
  printReceipt?: boolean;
  deliveryType: 'asap' | 'scheduled';
  promisedTime?: number;
  customTime?: string;
  scheduledDateTime?: string;
  tableNumber?: string;
  notes?: string;
}

interface ReceiptPrinterProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  customerData: CustomerFormData;
  totalPrice: number;
}

export const ReceiptPrinter: React.FC<ReceiptPrinterProps> = ({
  isOpen,
  onClose,
  orderItems,
  customerData,
  totalPrice
}) => {
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const handlePrint = () => {
    window.print();
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getOrderTypeText = (type: string) => {
    switch (type) {
      case 'delivery': return 'Dostawa';
      case 'takeaway': return 'Na wynos';
      case 'dine_in': return 'Na miejscu';
      default: return type;
    }
  };

  const getDeliveryTimeText = () => {
    if (customerData.deliveryType === 'scheduled' && customerData.scheduledDateTime) {
      const scheduledDate = new Date(customerData.scheduledDateTime);
      return scheduledDate.toLocaleString('pl-PL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="receipt-printer-overlay">
      <div className="receipt-printer-modal">
        <div className="receipt-header">
          <h2>🧾 Bon zamówienia</h2>
          <div className="receipt-header-actions">
            <button onClick={handlePrint} className="print-btn-header">
              🖨️ Drukuj
            </button>
            <button onClick={onClose} className="close-btn">×</button>
          </div>
        </div>

        <div className="receipt-content">
          <div className="receipt-paper" id="receipt-content">
            {/* Nagłówek bonu */}
            <div className="receipt-header-content">
              <h1>🍕 RESTAURACJA POS</h1>
              <p>ul. Przykładowa 123, 00-000 Warszawa</p>
              <p>Tel: +48 123 456 789</p>
              <p>NIP: 123-456-78-90</p>
              <hr />
              <p>Data: {getCurrentDateTime()}</p>
              <p>Typ: {getOrderTypeText(customerData.pickupType)}</p>
              {customerData.deliveryType === 'scheduled' && getDeliveryTimeText() && (
                <p>🕐 Planowana godzina: {getDeliveryTimeText()}</p>
              )}
              {customerData.tableNumber && (
                <p>Stolik: {customerData.tableNumber}</p>
              )}
              <hr />
            </div>

            {/* Dane klienta */}
            <div className="receipt-customer">
              <h3>DANE KLIENTA</h3>
              <p><strong>Imię:</strong> {customerData.name || 'Brak'}</p>
              <p><strong>Telefon:</strong> {customerData.phone || 'Brak'}</p>
              {customerData.email && (
                <p><strong>Email:</strong> {customerData.email}</p>
              )}
              {customerData.address && (
                <p><strong>Adres:</strong> {customerData.address.street}, {customerData.address.city} {customerData.address.postalCode}</p>
              )}
              {customerData.notes && (
                <p><strong>Uwagi:</strong> {customerData.notes}</p>
              )}
              <hr />
            </div>

            {/* Pozycje zamówienia */}
            <div className="receipt-items">
              <h3>ZAMÓWIENIE</h3>
              {orderItems.map((item, index) => (
                <div key={item.id} className="receipt-item">
                  <div className="item-header">
                    <span className="item-name">
                      {item.name}
                      {item.selectedSize && (
                        <span style={{ 
                          color: '#666',
                          fontSize: '11px',
                          marginLeft: '0.25rem'
                        }}>
                          - {item.selectedSize.name}
                        </span>
                      )}
                    </span>
                    <span className="item-quantity">x{item.quantity}</span>
                    <span className="item-total">{formatPrice(item.total)} zł</span>
                  </div>
                  
                  {/* Rozmiar */}
                  {item.selectedSize && (
                    <div className="item-detail">
                      <span className="detail-label">Rozmiar:</span>
                      <span className="detail-value">{item.selectedSize.name}</span>
                    </div>
                  )}

                  {/* Pozycja pół na pół */}
                  {item.isHalfHalf && (
                    <div className="half-half-details">
                      {item.leftHalf && (
                        <div className="half-detail">
                          <span className="half-label">Lewa połowa:</span>
                          <span className="half-dish">{item.leftHalf.dishName}</span>
                        </div>
                      )}
                      {item.rightHalf && (
                        <div className="half-detail">
                          <span className="half-label">Prawa połowa:</span>
                          <span className="half-dish">{item.rightHalf.dishName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dodatki */}
                  {item.addons && item.addons.length > 0 && (
                    <div className="item-addons">
                      {item.addons.map((addon) => (
                        <div key={addon.id} className="addon-item">
                          <span className="addon-name">+ {addon.name}</span>
                          {addon.quantity > 1 && (
                            <span className="addon-quantity">x{addon.quantity}</span>
                          )}
                          {addon.price > 0 && (
                            <span className="addon-price">+{formatPrice(addon.price * addon.quantity)} zł</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dodatkowe składniki */}
                  {item.addedIngredients && item.addedIngredients.length > 0 && (
                    <div className="item-ingredients">
                      <span className="ingredients-label">Dodatkowe składniki:</span>
                      {item.addedIngredients.map((ingredient) => (
                        <span key={ingredient.id} className="ingredient-item">
                          + {ingredient.name}
                          {ingredient.quantity && ingredient.quantity > 1 && ` x${ingredient.quantity}`}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Usunięte składniki */}
                  {item.removedIngredients && item.removedIngredients.length > 0 && (
                    <div className="item-ingredients">
                      <span className="ingredients-label">Bez:</span>
                      {item.removedIngredients.map((ingredient) => (
                        <span key={ingredient.id} className="ingredient-item removed">
                          - {ingredient.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Komentarz do dania */}
                  {item.notes && (
                    <div className="item-notes">
                      <span className="notes-label">Komentarz:</span>
                      <span className="notes-text">"{item.notes}"</span>
                    </div>
                  )}

                  {/* Dodatki dla pół na pół */}
                  {item.isHalfHalf && (
                    <>
                      {item.leftHalf?.addons && item.leftHalf.addons.length > 0 && (
                        <div className="half-addons">
                          <span className="half-addons-label">Lewa połowa - dodatki:</span>
                          {item.leftHalf.addons.map((addon) => (
                            <div key={addon.id} className="addon-item">
                              <span className="addon-name">+ {addon.name}</span>
                              {addon.quantity > 1 && (
                                <span className="addon-quantity">x{addon.quantity}</span>
                              )}
                              {addon.price > 0 && (
                                <span className="addon-price">+{formatPrice(addon.price * addon.quantity)} zł</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.rightHalf?.addons && item.rightHalf.addons.length > 0 && (
                        <div className="half-addons">
                          <span className="half-addons-label">Prawa połowa - dodatki:</span>
                          {item.rightHalf.addons.map((addon) => (
                            <div key={addon.id} className="addon-item">
                              <span className="addon-name">+ {addon.name}</span>
                              {addon.quantity > 1 && (
                                <span className="addon-quantity">x{addon.quantity}</span>
                              )}
                              {addon.price > 0 && (
                                <span className="addon-price">+{formatPrice(addon.price * addon.quantity)} zł</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {index < orderItems.length - 1 && <hr className="item-separator" />}
                </div>
              ))}
            </div>

            {/* Podsumowanie */}
            <div className="receipt-summary">
              <hr />
              <div className="total-line">
                <span className="total-label">RAZEM:</span>
                <span className="total-amount">{formatPrice(totalPrice)} zł</span>
              </div>
              <hr />
            </div>

            {/* Stopka */}
            <div className="receipt-footer">
              <p>Dziękujemy za zamówienie!</p>
              <p>Miłego dnia! 😊</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
