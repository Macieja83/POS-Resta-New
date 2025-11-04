import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Order } from '../../types/shared';
import { ordersApi } from '../../api/orders';
import './PendingOrderModal.css';

interface PendingOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onAccepted?: (updatedOrder: Order) => void;
}

const QUICK_TIME_OPTIONS = [15, 30, 45, 60, 75, 90, 120];

const formatDisplayDate = (iso: string) => {
  try {
    const date = new Date(iso);
    return date.toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return iso;
  }
};

export const PendingOrderModal: React.FC<PendingOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  onAccepted
}) => {
  const queryClient = useQueryClient();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMinutes(30);
      setCustomMinutes('');
      setError(null);
    }
  }, [isOpen, order?.id]);

  const effectiveMinutes = useMemo(() => {
    const parsedCustom = parseInt(customMinutes, 10);
    if (!Number.isNaN(parsedCustom) && parsedCustom > 0) {
      return parsedCustom;
    }
    return selectedMinutes;
  }, [customMinutes, selectedMinutes]);

  const previewDate = useMemo(() => {
    if (!effectiveMinutes || Number.isNaN(effectiveMinutes)) {
      return null;
    }
    const now = new Date();
    return new Date(now.getTime() + effectiveMinutes * 60 * 1000);
  }, [effectiveMinutes]);

  const acceptOrderMutation = useMutation({
    mutationFn: async () => {
      if (!order) {
        throw new Error('Brak wymaganych danych zamówienia');
      }

      const minutesUntil = effectiveMinutes;
      if (!minutesUntil || Number.isNaN(minutesUntil) || minutesUntil <= 0) {
        throw new Error('Wybierz prawidłowy obiecany czas.');
      }

      const now = new Date();
      const targetDate = new Date(now.getTime() + minutesUntil * 60 * 1000);

      const payload: Record<string, any> = {
        status: 'OPEN',
        promisedTime: minutesUntil,
      };

      const sanitizedNotes = (order.notes || '')
        .split('\n')
        .filter((line) => line && !line.startsWith('⏰ Termin realizacji'))
        .join('\n');

      const scheduledLine = `⏰ Termin realizacji: ${formatDisplayDate(targetDate.toISOString())}`;

      payload.notes = sanitizedNotes
        ? `${sanitizedNotes}\n${scheduledLine}`
        : scheduledLine;

      return ordersApi.updateOrderStatus(order.id, payload);
    },
    onSuccess: (response) => {
      if (response?.data) {
        const updatedOrder = response.data;

        queryClient.invalidateQueries({ queryKey: ['orders-map'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['order-stats'] });
        queryClient.invalidateQueries({ queryKey: ['order-summary'] });

        window.dispatchEvent(new CustomEvent('orderUpdated', { detail: updatedOrder }));

        if (onAccepted) {
          onAccepted(updatedOrder);
        }
      }
    },
    onError: (err: any) => {
      const message = err?.message || 'Błąd podczas akceptacji zamówienia';
      setError(message);
    }
  });

  const handleConfirm = () => {
    if (!order) return;

    const minutesUntil = effectiveMinutes;
    if (!minutesUntil || Number.isNaN(minutesUntil) || minutesUntil <= 0) {
      setError('Podaj prawidłowy obiecany czas w minutach.');
      return;
    }

    setError(null);
    acceptOrderMutation.mutate();
  };

  const handleClose = () => {
    if (acceptOrderMutation.isPending) return;
    onClose();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="pending-order-modal-overlay">
      <div className="pending-order-modal">
        <div className="modal-header">
          <h2>Akceptuj zamówienie #{order.orderNumber || order.id?.slice(-4)}</h2>
          <button className="close-btn" onClick={handleClose} aria-label="Zamknij">×</button>
        </div>

        <div className="modal-body">
          <div className="order-summary">
            <div className="summary-row">
              <span className="summary-label">Typ:</span>
              <span className="summary-value">{order.type === 'DELIVERY' ? 'Dostawa' : order.type === 'TAKEAWAY' ? 'Odbiór osobisty' : 'Na miejscu'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Klient:</span>
              <span className="summary-value">{order.customer?.name || 'Anonimowy klient'}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Wartość zamówienia:</span>
              <span className="summary-value">{(order.total || 0).toFixed(2)} zł</span>
            </div>
            {order.delivery?.address && (
              <div className="summary-row">
                <span className="summary-label">Adres dostawy:</span>
                <span className="summary-value">{order.delivery.address.street}, {order.delivery.address.city}</span>
              </div>
            )}
          </div>

          <div className="time-section">
            <h3>Obiecany czas</h3>
            <div className="time-options">
              {QUICK_TIME_OPTIONS.map((option) => {
                const isActive = customMinutes === '' && selectedMinutes === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`time-btn ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedMinutes(option);
                      setCustomMinutes('');
                    }}
                  >
                    {option}
                  </button>
                );
              })}
              <div className="custom-time">
                <input
                  type="text"
                  value={customMinutes}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9]/g, '');
                    setCustomMinutes(sanitized);
                  }}
                  placeholder="Własny"
                  className="custom-input"
                />
                <span>min</span>
              </div>
            </div>
            <p className="time-hint">
              Wybierz obiecany czas realizacji. Zamówienie trafi do odpowiedniej sekcji po akceptacji.
            </p>
            {previewDate && (
              <div className="time-preview">
                Planowana realizacja: <strong>{formatDisplayDate(previewDate.toISOString())}</strong>
              </div>
            )}
          </div>

          {error && <div className="modal-error">{error}</div>}
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={handleClose} disabled={acceptOrderMutation.isPending}>
            Anuluj
          </button>
          <button
            className="primary-btn"
            onClick={handleConfirm}
            disabled={acceptOrderMutation.isPending}
          >
            {acceptOrderMutation.isPending ? 'Akceptowanie...' : 'Akceptuj zamówienie'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingOrderModal;

