import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { Order, PaymentMethod } from '../types/shared';
import { MapView } from '../components/map/MapView';
import { OrderCreator } from '../components/orders/OrderCreator';
import { OrderEditModal } from '../components/orders/OrderEditModal';
import { OrderStatusChangeModal } from '../components/orders/OrderStatusChangeModal';
import { OrderDetailView } from '../components/orders/OrderDetailView';
import DriverSelector from '../components/orders/DriverSelector';
import { CountdownTimer } from '../components/orders/CountdownTimer';
import { PendingOrderModal } from '../components/orders/PendingOrderModal';
import './OrdersMapPage.css';

// const ORDER_TYPES = [
//   { key: 'all', label: 'Wszystkie', icon: '📋' },
//   { key: 'DELIVERY', label: 'Dowóz', icon: '🚚' },
//   { key: 'TAKEAWAY', label: 'Wynos', icon: '📦' },
//   { key: 'DINE_IN', label: 'Na miejscu', icon: '🍽️' },
//   { key: 'in_progress', label: 'W realizacji', icon: '🚗' }
// ];

const getTypeText = (type: string, tableNumber?: string): string => {
  switch (type) {
    case 'DELIVERY':
      return 'Dostawa';
    case 'TAKEAWAY':
      return 'Wynos';
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

const PENDING_STATUSES = new Set<string>(['PENDING', 'PENDING_ACCEPTANCE']);

export const OrdersMapPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderCreator, setShowOrderCreator] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [assigningDriverFor, setAssigningDriverFor] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeOrder, setStatusChangeOrder] = useState<any>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [pendingModalOrder, setPendingModalOrder] = useState<Order | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [_showPendingBadge, setShowPendingBadge] = useState(false);
  const queryClient = useQueryClient();

  const isPendingStatus = (status?: string | null) => {
    if (!status) return false;
    return PENDING_STATUSES.has(status.toUpperCase());
  };

  // Geocoding mutation
  // const geocodeMutation = useMutation({
  //   mutationFn: ordersApi.geocodeOrders,
  //   onSuccess: (data) => {
  //     // Refresh orders and geo data
  //     queryClient.invalidateQueries({ queryKey: ['orders'] });
  //     queryClient.invalidateQueries({ queryKey: ['orders-geo'] });
  //     alert(`Geokodowanie zakończone! Zgeokodowano ${data.data.geocodedCount} adresów.`);
  //   },
  //   onError: (error) => {
  //     console.error('Geocoding error:', error);
  //     alert('Błąd podczas geokodowania adresów.');
  //   }
  // });

  // Sample orders mutation
  // const createSampleMutation = useMutation({
  //   mutationFn: () => fetch('/api/orders/sample', { method: 'POST' }).then(res => res.json()),
  //   onSuccess: (data) => {
  //     // Refresh orders and geo data
  //     queryClient.invalidateQueries({ queryKey: ['orders'] });
  //     queryClient.invalidateQueries({ queryKey: ['orders-geo'] });
  //     alert(`Utworzono ${data.orders.length} przykładowych zamówień z geolokalizacją!`);
  //   },
  //   onError: (error) => {
  //     console.error('Sample orders error:', error);
  //     alert('Błąd podczas tworzenia przykładowych zamówień.');
  //   }
  // });

  // Cancel order mutation - zoptymalizowane
  const cancelOrderMutation = useMutation({
    mutationFn: ordersApi.cancelOrder,
    onSuccess: (response) => {
      // Natychmiastowe usunięcie z listy (zamówienie anulowane)
      if (response.data) {
        setOrders(prevOrders => 
          prevOrders.filter(order => order.id !== response.data.id)
        );
      }
      
      // Cicha aktualizacja cache - usuń anulowane zamówienie
      queryClient.setQueryData(['orders-map'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((order: any) => order.id !== response.data?.id)
        };
      });
      
      // Cichy refetch w tle
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['orders-map'],
          refetchType: 'none'
        });
      }, 1000);
      
      alert('Zamówienie zostało anulowane');
    },
    onError: (error) => {
      console.error('Cancel order error:', error);
      alert('Błąd podczas anulowania zamówienia');
    }
  });


  // Restore order mutation - zoptymalizowane
  const restoreOrderMutation = useMutation({
    mutationFn: ordersApi.restoreOrder,
    onSuccess: (response) => {
      // Natychmiastowe dodanie do listy (zamówienie przywrócone)
      if (response.data) {
        setOrders(prevOrders => [response.data, ...prevOrders]);
      }
      
      // Cicha aktualizacja cache - dodaj przywrócone zamówienie
      queryClient.setQueryData(['orders-map'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: [response.data, ...oldData.data]
        };
      });
      
      // Cichy refetch w tle
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['orders-map'],
          refetchType: 'none'
        });
      }, 1000);
      
      alert('Zamówienie zostało przywrócone');
    },
    onError: (error) => {
      console.error('Restore order error:', error);
      alert('Błąd podczas przywracania zamówienia');
    }
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders-map'], // Simplified key for better caching
    queryFn: () => {
      // Use optimized map endpoint for better performance
      return ordersApi.getOrdersForMap();
    },
    refetchOnWindowFocus: false, // Disable auto-refresh on window focus (smoother UX)
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds (less frequent updates)
    refetchOnMount: true, // Changed to true to ensure data loads on mount
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second before retry
    // Enable silent background refetching
    refetchInterval: 15 * 1000, // Refetch every 15 seconds in background (less frequent)
    refetchIntervalInBackground: true,
    // Add network mode for better performance
    networkMode: 'online',
    // Hide loading indicators for background refetches
    notifyOnChangeProps: ['data', 'error'] // Only notify on data/error changes, not on fetching
  });

  // Log errors for debugging
  React.useEffect(() => {
    if (error) {
      console.error('❌ Error loading orders for map:', error);
    }
  }, [error]);

  // Update local orders state when data changes and apply filtering
  React.useEffect(() => {
    if (data?.success && data?.data && Array.isArray(data.data)) {
      let filteredOrders = data.data;
      
      // Apply "in_progress" filter - show only orders with assigned driver
      if (selectedType === 'in_progress') {
        filteredOrders = filteredOrders.filter((order: any) => 
          order.assignedEmployeeId
        );
      }
      
      // Apply "pending_acceptance" filter - show only orders that need acceptance
      if (selectedType === 'pending_acceptance') {
        filteredOrders = filteredOrders.filter((order: any) => 
          isPendingStatus(order.status)
        );
      }
      
      // Apply type filter
      if (selectedType !== 'all' && selectedType !== 'in_progress' && selectedType !== 'pending_acceptance') {
        filteredOrders = filteredOrders.filter((order: any) => 
          order.type === selectedType
        );
      }
      
      setOrders(filteredOrders);
    } else if (data && !data.success) {
      console.error('❌ API returned error:', data);
      setOrders([]);
    } else if (!isLoading && !data) {
      // No data and not loading - might be an error
      console.warn('⚠️ No data received for orders map');
      setOrders([]);
    }
  }, [data, selectedType, isLoading]);

  // Preload data from cache on component mount
  React.useEffect(() => {
    const cachedData = queryClient.getQueryData(['orders-map']);
    if (cachedData && !data) {
      // Use cached data immediately if available
      const cachedOrders = (cachedData as any)?.data || [];
      let filteredOrders = cachedOrders;
      
      // Apply current filter to cached data
      if (selectedType === 'in_progress') {
        filteredOrders = cachedOrders.filter((order: any) => 
          order.assignedEmployeeId
        );
      } else if (selectedType === 'pending_acceptance') {
        filteredOrders = cachedOrders.filter((order: any) => 
          isPendingStatus(order.status)
        );
      } else if (selectedType !== 'all') {
        filteredOrders = cachedOrders.filter((order: any) => 
          order.type === selectedType
        );
      }
      
      setOrders(filteredOrders);
    }
  }, [queryClient, data, selectedType]);

  // No need to invalidate cache when filtering - we filter on frontend

  // const handleTypeFilter = (type: string) => {
  //   setSelectedType(type);
  // };

  // Listen for filter changes from navigation
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent<{ type?: string; source?: string }>) => {
      const { type, source } = event.detail || {};
      if (!type || source === 'orders-map') {
        return;
      }
      setSelectedType(type);
      if (type === 'pending_acceptance') {
        setShowPendingBadge(false);
        setShowOrderDetail(false);
        setSelectedOrder(null);
        setSelectedOrderDetail(null);
      }
    };

    window.addEventListener('filterChanged', handleFilterChange as EventListener);
    
    return () => {
      window.removeEventListener('filterChanged', handleFilterChange as EventListener);
    };
  }, []);

  // Globalne event listenery dla synchronizacji statusów między stronami
  useEffect(() => {
    const handleGlobalOrderUpdated = (event: CustomEvent) => {
      const updatedOrder = event.detail;
      
      // Natychmiastowa aktualizacja lokalnego stanu z inteligentnym filtrowaniem
      setOrders(prevOrders => {
        // Jeśli zamówienie zostało zakończone lub anulowane, usuń je z listy
        if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
          return prevOrders.filter(order => order.id !== updatedOrder.id);
        }

      if (selectedType === 'pending_acceptance') {
        if (!isPendingStatus(updatedOrder.status)) {
          return prevOrders.filter(order => order.id !== updatedOrder.id);
        }

        const exists = prevOrders.find(order => order.id === updatedOrder.id);
        if (!exists) {
          return [updatedOrder, ...prevOrders];
        }
        }
        
        // Jeśli zamówienie zostało przywrócone, dodaj je do listy
        if (updatedOrder.status === 'OPEN' || updatedOrder.status === 'IN_PROGRESS' || updatedOrder.status === 'READY') {
          const exists = prevOrders.find(order => order.id === updatedOrder.id);
          if (!exists) {
            return [updatedOrder, ...prevOrders];
          }
        }
        
        // W przeciwnym razie zaktualizuj istniejące zamówienie
        return prevOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });
      
      // Cicha aktualizacja cache
      queryClient.setQueryData(['orders-map'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        let updatedData = oldData.data;
        
        // Jeśli zamówienie zostało zakończone lub anulowane, usuń je
        if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
          updatedData = oldData.data.filter((order: any) => order.id !== updatedOrder.id);
        } else {
          // W przeciwnym razie zaktualizuj lub dodaj
          const exists = oldData.data.find((order: any) => order.id === updatedOrder.id);
          if (exists) {
            updatedData = oldData.data.map((order: any) => 
              order.id === updatedOrder.id ? updatedOrder : order
            );
          } else {
            updatedData = [updatedOrder, ...oldData.data];
          }
        }
        
        return {
          ...oldData,
          data: updatedData
        };
      });
    };

    const handleGlobalOrderCreated = (event: CustomEvent) => {
      const newOrder = event.detail;
      
      // Sprawdź czy zamówienie powinno być wyświetlane na mapie
      const shouldShow = newOrder.status !== 'COMPLETED' && newOrder.status !== 'CANCELLED';
      
      if (shouldShow) {
        setOrders(prevOrders => [newOrder, ...prevOrders]);
        
        queryClient.setQueryData(['orders-map'], (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: [newOrder, ...oldData.data]
          };
        });

        if (isPendingStatus(newOrder.status) && selectedType !== 'pending_acceptance') {
          setShowPendingBadge(true);
        }
      }
    };

    window.addEventListener('orderUpdated', handleGlobalOrderUpdated as EventListener);
    window.addEventListener('orderCreated', handleGlobalOrderCreated as EventListener);

    return () => {
      window.removeEventListener('orderUpdated', handleGlobalOrderUpdated as EventListener);
      window.removeEventListener('orderCreated', handleGlobalOrderCreated as EventListener);
    };
  }, [queryClient]);

  // const handleOrderSelect = (order: any) => {
  //   setSelectedOrder(order);
  //   setSelectedOrderDetail(order);
  //   setShowOrderDetail(true);
  // };

  const handleNewOrder = () => {
    setEditOrder(null);
    setShowOrderCreator(true);
  };

  const handleCloseOrderCreator = () => {
    setShowOrderCreator(false);
    setEditOrder(null);
  };

  const handleOrderUpdated = (updatedOrder: any) => {
    // Natychmiastowa aktualizacja lokalnego stanu z inteligentnym filtrowaniem
    setOrders(prevOrders => {
      // Jeśli zamówienie zostało zakończone lub anulowane, usuń je z listy
      if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        return prevOrders.filter(order => order.id !== updatedOrder.id);
      }

      if (selectedType === 'pending_acceptance' && !isPendingStatus(updatedOrder.status)) {
        return prevOrders.filter(order => order.id !== updatedOrder.id);
      }

      if (selectedType === 'pending_acceptance' && isPendingStatus(updatedOrder.status)) {
        const exists = prevOrders.find(order => order.id === updatedOrder.id);
        if (!exists) {
          return [updatedOrder, ...prevOrders];
        }
      }
      
      // Jeśli zamówienie zostało przywrócone, dodaj je do listy
      if (updatedOrder.status === 'OPEN' || updatedOrder.status === 'IN_PROGRESS' || updatedOrder.status === 'READY') {
        const exists = prevOrders.find(order => order.id === updatedOrder.id);
        if (!exists) {
          return [updatedOrder, ...prevOrders];
        }
      }
      
      // W przeciwnym razie zaktualizuj istniejące zamówienie
      return prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      );
    });
    
    // Update selected order detail if it's the same order
    if (selectedOrderDetail && selectedOrderDetail.id === updatedOrder.id) {
      setSelectedOrderDetail(updatedOrder);
    }
    
    // Cicha aktualizacja cache z inteligentnym filtrowaniem
    queryClient.setQueryData(['orders-map'], (oldData: any) => {
      if (!oldData?.data) return oldData;
      
      let updatedData = oldData.data;
      
      // Jeśli zamówienie zostało zakończone lub anulowane, usuń je
      if (updatedOrder.status === 'COMPLETED' || updatedOrder.status === 'CANCELLED') {
        updatedData = oldData.data.filter((order: any) => order.id !== updatedOrder.id);
      } else {
        // W przeciwnym razie zaktualizuj lub dodaj
        const exists = oldData.data.find((order: any) => order.id === updatedOrder.id);
        if (exists) {
          updatedData = oldData.data.map((order: any) => 
            order.id === updatedOrder.id ? updatedOrder : order
          );
        } else {
          updatedData = [updatedOrder, ...oldData.data];
        }
      }
      
      return {
        ...oldData,
        data: updatedData
      };
    });
    
    // Cichy refetch w tle
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['orders-map'],
        refetchType: 'none'
      });
    }, 1000);
    
    // Wyślij globalny event dla synchronizacji między stronami
    window.dispatchEvent(new CustomEvent('orderUpdated', { 
      detail: updatedOrder 
    }));
  };

  // Usunięto handleOrderCreated - używamy tylko globalnego event listenera

  const handleCancelOrder = (order: any) => {
    if (window.confirm(`Czy na pewno chcesz anulować zamówienie ${order.orderNumber}?`)) {
      cancelOrderMutation.mutate(order.id);
    }
  };


  const handleRestoreOrder = (order: any) => {
    if (window.confirm(`Czy na pewno chcesz przywrócić zamówienie ${order.orderNumber}? Zamówienie wróci na listę aktywnych zamówień.`)) {
      restoreOrderMutation.mutate(order.id);
    }
  };

  const handleEditOrder = (order: any) => {
    if (isPendingStatus(order.status)) {
      setPendingModalOrder(order);
      setShowPendingModal(true);
      setSelectedOrder(order);
      setSelectedOrderDetail(null);
      setShowOrderDetail(false);
      return;
    }

    setSelectedOrder(order);
    setSelectedOrderDetail(order);
    setShowOrderDetail(true);
  };

  // Funkcje obsługi checkboxów
  const handleToggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };


  const handleBulkAssignDriver = () => {
    if (selectedOrders.size === 0) {
      alert('Wybierz zamówienia do przypisania kierowcy');
      return;
    }
    setAssigningDriverFor('bulk'); // Specjalna wartość dla bulk assign
  };

  const handleEditFromDetail = (order: any) => {
    // Sprawdź czy zamówienie jest historyczne
    const isHistoricalOrder = order.status === 'COMPLETED' || order.status === 'CANCELLED';
    
    if (isHistoricalOrder) {
      alert('Nie można edytować zamówień historycznych (zakończonych lub anulowanych)');
      return;
    }

    if (isPendingStatus(order.status)) {
      setPendingModalOrder(order);
      setShowPendingModal(true);
      setShowOrderDetail(false);
      return;
    }
    
    setEditOrder(order);
    setShowOrderCreator(true);
    setShowOrderDetail(false); // Zamknij szczegóły zamówienia
  };

  const handleChangeStatusFromDetail = (order: any) => {
    // Sprawdź czy zamówienie jest historyczne
    const isHistoricalOrder = order.status === 'COMPLETED' || order.status === 'CANCELLED';
    
    if (isHistoricalOrder) {
      alert('Nie można zmieniać statusu zamówień historycznych (zakończonych lub anulowanych)');
      return;
    }
    
    setStatusChangeOrder(order);
    setShowStatusChangeModal(true);
    setShowOrderDetail(false);
  };

  const handleCloseEditModal = () => {
    setEditingOrder(null);
  };

  // Funkcje pomocnicze dla nowego designu

  const getOrderItems = (order: any) => {
    if (order.items && order.items.length > 0) {
      const items = order.items.slice(0, 2);
      return items.map((item: any) => {
        let itemText = item.name || 'Produkt';
        
        // Dodaj dodatki jeśli istnieją
        if (item.addons && Array.isArray(item.addons) && item.addons.length > 0) {
          const addonsText = item.addons.map((addon: any) => 
            `+ ${addon.name}${addon.quantity > 1 ? ` x${addon.quantity}` : ''}`
          ).join(', ');
          itemText += ` (${addonsText})`;
        }
        
        // Dodaj rozmiar jeśli istnieje
        if (item.selectedSize) {
          itemText += ` [${item.selectedSize.name}]`;
        }
        
        // Dodaj pół na pół jeśli istnieje
        if (item.isHalfHalf) {
          itemText += ' (pół na pół)';
        }
        
        return itemText;
      }).join(' / ');
    }
    return 'Brak szczegółów';
  };

  const getStatusButton = (order: any) => {
    const status = order.status || 'NEW';
    if (status === 'COMPLETED' || status === 'PAID') {
      return (
        <button className="status-btn paid">
          Zapłacone
        </button>
      );
    }
    if (isPendingStatus(status)) {
      return (
        <button className="status-btn pending">
          Do akceptacji
        </button>
      );
    }
    // Usunięto przycisk "NOWE" - zwracamy null
    return null;
  };

  const getActionButtons = (order: any) => {
    return (
      <div className="action-buttons">
        {order.type === 'DELIVERY' && (
          <button 
            className={`action-btn assign-driver ${order.assignedEmployee ? 'assigned' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setAssigningDriverFor(order.id);
            }}
            title={order.assignedEmployee ? `Kierowca: ${order.assignedEmployee.name}` : "Przypisz kierowcę"}
          >
            🚗 {order.assignedEmployee ? 'Przypisany' : 'Kierowca'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="orders-map-layout">
      {/* Lewa kolumna - Lista zamówień */}
      <div className="orders-panel">
        <div className="panel-header">
          <div className="header-top">
            <button 
              onClick={handleNewOrder}
              className="new-order-btn"
            >
              ➕ Nowe zamówienie
            </button>
          </div>
          {/* Przycisk do przypisania zaznaczonych zamówień do kierowcy */}
          {orders.length > 0 && selectedOrders.size > 0 && (
            <div className="bulk-actions">
              <button 
                onClick={handleBulkAssignDriver}
                className="bulk-btn assign-driver"
                title={`Przypisz ${selectedOrders.size} zamówień do kierowcy`}
              >
                🚗 Przypisz do kierowcy ({selectedOrders.size})
              </button>
            </div>
          )}
        </div>


        {/* Lista zamówień */}
        <div className="orders-list">
          <div className="orders-content">
            {isLoading && orders.length === 0 ? (
              <div className="loading">Ładowanie...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">Brak zamówień</div>
            ) : (
              <>
                {orders.map((order: any) => (
                <div
                  key={order.id}
                  className={`order-row ${selectedOrder?.id === order.id ? 'selected' : ''} ${selectedOrders.has(order.id) ? 'checkbox-selected' : ''}`}
                  onClick={() => handleEditOrder(order)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Checkbox do zaznaczania zamówienia */}
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleOrderSelection(order.id);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="order-checkbox-input"
                  />

                  <div className="order-col id-type">
                    <div className="order-id">
                      #{order.orderNumber?.slice(-4) || order.id?.slice(-4) || 'N/A'}
                    </div>
                    <div className="order-type">
                      <span className="order-items-icon">📄</span>
                      {getOrderItems(order)}
                    </div>
                  </div>
                  
                  <div className="order-col client">
                    {(((order.promisedTime ?? 0) > 0) || ['OPEN', 'IN_PROGRESS', 'ASSIGNED', 'ON_THE_WAY', 'READY', 'PENDING', 'PENDING_ACCEPTANCE'].includes(order.status)) && (
                      <div>
                        <CountdownTimer 
                          createdAt={order.createdAt}
                          promisedTime={order.promisedTime ?? 30}
                          status={order.status}
                        />
                      </div>
                    )}
                    <div className="order-type-tag">
                      <span className={`order-tag ${order.type === 'TAKEAWAY' ? 'orange' : order.type === 'DELIVERY' ? 'blue' : 'green'}`}>
                        {getTypeText(order.type, order.tableNumber)}
                      </span>
                    </div>
                    {order.delivery?.address && (
                      <div className="order-items">
                        <span className="order-items-icon">🏠</span>
                        {order.delivery.address.street}, {order.delivery.address.city}
                      </div>
                    )}
                    {order.assignedEmployee && order.paymentMethod && (
                      <div className="order-items driver-with-payment">
                        <span className="order-items-icon">{getPaymentIcon(order.paymentMethod)}</span>
                        {getPaymentText(order.paymentMethod)}
                      </div>
                    )}
                    {!order.assignedEmployee && order.paymentMethod && (
                      <div className="order-items">
                        <span className="order-items-icon">{getPaymentIcon(order.paymentMethod)}</span>
                        {getPaymentText(order.paymentMethod)}
                      </div>
                    )}
                  </div>
                  
                  <div className="order-col total">
                    <div className="total-amount">
                      {(order.total || 0).toFixed(2)} zł
                    </div>
                    <div className="order-actions">
                      {getStatusButton(order) && getStatusButton(order)}
                      {getActionButtons(order)}
                      {order.type === 'DELIVERY' && order.assignedEmployee && (
                        <div className="assigned-driver-name">
                          <span className="assigned-driver-icon">🚗</span>
                          <span className="assigned-driver-text">{order.assignedEmployee.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              </>
            )}
          </div>
        </div>
      </div>      {/* Prawa kolumna - Mapa */}
      <div className="map-panel">
        
        <div className="map-container">
          <MapView 
            selectedOrder={selectedOrder}
            filterType={selectedType}
            onCancelOrder={handleCancelOrder}
            onEditOrder={handleEditOrder}
            onRestoreOrder={handleRestoreOrder}
          />
        </div>
      </div>

      {/* Kreator zamówień */}
      <OrderCreator 
        isOpen={showOrderCreator}
        onClose={handleCloseOrderCreator}
        editOrder={editOrder}
        onOrderUpdated={handleOrderUpdated}
      />

      <PendingOrderModal
        order={pendingModalOrder}
        isOpen={showPendingModal && !!pendingModalOrder}
        onClose={() => {
          setShowPendingModal(false);
          setPendingModalOrder(null);
          setSelectedOrder(null);
          setSelectedOrderDetail(null);
        }}
        onAccepted={(updatedOrder) => {
          setShowPendingModal(false);
          setPendingModalOrder(null);
           setSelectedOrder(null);
           setSelectedOrderDetail(null);
          handleOrderUpdated(updatedOrder);
        }}
      />

      {/* Driver Assignment Modal */}
      {assigningDriverFor && (
        <div className="driver-assignment-modal">
          <div className="modal-overlay" onClick={() => setAssigningDriverFor(null)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Przypisz kierowcę</h3>
              <button 
                className="close-btn"
                onClick={() => setAssigningDriverFor(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {(() => {
                if (assigningDriverFor === 'bulk') {
                  // Bulk assign - przypisz zaznaczone zamówienia do kierowcy
                  const selectedOrdersList = orders.filter(order => selectedOrders.has(order.id));
                  return (
                    <div className="bulk-assign-info">
                      <div className="bulk-header">
                        <strong>Przypisz {selectedOrdersList.length} zamówień do kierowcy</strong>
                      </div>
                      <div className="selected-orders-list">
                        {selectedOrdersList.map(order => (
                          <div key={order.id} className="selected-order-item">
                            <strong>#{order.orderNumber}</strong> - {order.customer?.name}
                            {order.delivery?.address && (
                              <div className="delivery-address">
                                {order.delivery.address.street}, {order.delivery.address.city}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="bulk-driver-selector">
                        <DriverSelector 
                          order={selectedOrdersList[0]} // Użyj pierwszego zamówienia jako template
                          onDriverAssigned={(updatedOrder) => {
                            // Przypisz wszystkie zaznaczone zamówienia do tego samego kierowcy
                            selectedOrdersList.forEach(order => {
                              if (order.id !== updatedOrder.id) {
                                // Tutaj można dodać logikę do przypisania pozostałych zamówień
                                // Na razie tylko zaktualizujemy pierwsze
                              }
                            });
                            handleOrderUpdated(updatedOrder);
                            setAssigningDriverFor(null);
                            setSelectedOrders(new Set()); // Wyczyść zaznaczenia
                          }}
                        />
                      </div>
                    </div>
                  );
                } else {
                  // Single order assign
                  const order = orders.find(o => o.id === assigningDriverFor);
                  if (!order) return <div>Zamówienie nie zostało znalezione</div>;
                  
                  return (
                    <div className="order-info">
                      <div className="order-header">
                        <strong>Zamówienie #{order.orderNumber}</strong>
                        <span className="order-type-badge">{order.type === 'DELIVERY' ? 'Dostawa' : order.type}</span>
                      </div>
                      <div className="customer-info">
                        <strong>Klient:</strong> {order.customer?.name}
                        {order.delivery?.address && (
                          <div className="delivery-address">
                            <strong>Adres:</strong> {order.delivery.address.street}, {order.delivery.address.city}
                          </div>
                        )}
                      </div>
                      <DriverSelector 
                        order={order} 
                        onDriverAssigned={(updatedOrder) => {
                          handleOrderUpdated(updatedOrder);
                          setAssigningDriverFor(null);
                        }}
                      />
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal edycji zamówienia */}
      <OrderEditModal
        order={editingOrder}
        isOpen={!!editingOrder}
        onClose={handleCloseEditModal}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Order Status Change Modal */}
      <OrderStatusChangeModal
        order={statusChangeOrder}
        isOpen={showStatusChangeModal}
        onClose={() => {
          setShowStatusChangeModal(false);
          setStatusChangeOrder(null);
        }}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Order Detail View */}
      <OrderDetailView
        order={selectedOrderDetail}
        isOpen={showOrderDetail}
        onClose={() => {
          setShowOrderDetail(false);
          setSelectedOrderDetail(null);
        }}
        onEdit={handleEditFromDetail}
        onChangeStatus={handleChangeStatusFromDetail}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};

export default OrdersMapPage;
