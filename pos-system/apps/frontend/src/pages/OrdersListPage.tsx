import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { OrderItemRow } from '../components/orders/OrderItemRow';
import { OrderCreator } from '../components/orders/OrderCreator';
import { OrderStatusChangeModal } from '../components/orders/OrderStatusChangeModal';
import { OrderDetailView } from '../components/orders/OrderDetailView';
import { useOrdersFilters } from '../state/useOrdersFilters';
import { ordersApi } from '../api/orders';
import { Order, OrderType } from '../types/shared';
import { useOrderCounts } from '../hooks/useOrderStats';
import { PendingOrderModal } from '../components/orders/PendingOrderModal';
import './OrdersListPage.css';

const ORDER_TYPES = [
  { key: 'all', label: 'Wszystkie', icon: '📋' },
  { key: OrderType.DELIVERY, label: 'Dowóz', icon: '🚚' },
  { key: OrderType.TAKEAWAY, label: 'Wynos', icon: '📦' },
  { key: OrderType.DINE_IN, label: 'Na miejscu', icon: '🍽️' },
  { key: 'in_progress', label: 'W realizacji', icon: '🚗' },
  { key: 'pending_acceptance', label: 'Do zaakceptowania', icon: '⏳' }
];

const PENDING_STATUSES = new Set<string>(['PENDING', 'PENDING_ACCEPTANCE']);

interface OrdersListPageProps {
  showHistorical?: boolean;
  onHistoricalToggle?: () => void;
  onNewOrder?: () => void;
  onResetFilters?: () => void;
  showOrderCreator?: boolean;
  setShowOrderCreator?: (show: boolean) => void;
}

const OrdersListPageComponent: React.FC<OrdersListPageProps> = ({
  showHistorical: propShowHistorical = false,
  showOrderCreator: propShowOrderCreator = false,
  setShowOrderCreator: propSetShowOrderCreator
}) => {
  const {
    status,
    type,
    page,
    limit,
    selectedOrderId,
    setSelectedOrderId,
    setType,
    setPage,
    resetFilters,
  } = useOrdersFilters();

  // Get order counts for filter buttons
  const { counts, isLoading: countsLoading } = useOrderCounts();

  // Lokalny stan dla wyszukiwania - całkowicie niezależny od globalnego stanu
  const [localSearch, setLocalSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [searchBy, setSearchBy] = useState<'all' | 'address' | 'customer' | 'dish' | 'price' | 'phone'>('all');
  const [sortBy, setSortBy] = useState<'createdAt' | 'total' | 'orderNumber'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pendingModalOrder, setPendingModalOrder] = useState<Order | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);

  const queryClient = useQueryClient();

  const isPendingStatus = useCallback((status?: string | null) => {
    if (!status) return false;
    return PENDING_STATUSES.has(status.toUpperCase());
  }, []);

  // Usunięto handleOrderCreated - używamy tylko globalnego event listenera

  const handleOrderUpdated = (updatedOrder: any) => {
    // Natychmiastowa aktualizacja cache
    queryClient.setQueriesData(
      { queryKey: ['orders'] },
      (oldData: any) => {
        if (!oldData?.data?.orders) return oldData;
        return {
          ...oldData,
          data: {
            ...oldData.data,
            orders: oldData.data.orders.map((order: any) => 
              order.id === updatedOrder.id ? updatedOrder : order
            )
          }
        };
      }
    );
    
    // Cichy refetch w tle
    setTimeout(() => {
      queryClient.invalidateQueries({ 
        queryKey: ['orders'],
        refetchType: 'none'
      });
    }, 1000);
  };

  // Cancel order mutation - zoptymalizowane
  const cancelOrderMutation = useMutation({
    mutationFn: ordersApi.cancelOrder,
    onSuccess: (response) => {
      // Natychmiastowa aktualizacja cache
      if (response.data) {
        queryClient.setQueriesData(
          { queryKey: ['orders'] },
          (oldData: any) => {
            if (!oldData?.data?.orders) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                orders: oldData.data.orders.map((order: any) => 
                  order.id === response.data.id ? response.data : order
                )
              }
            };
          }
        );
      }
      
      // Cichy refetch w tle
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['orders'],
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
      // Natychmiastowa aktualizacja cache
      if (response.data) {
        queryClient.setQueriesData(
          { queryKey: ['orders'] },
          (oldData: any) => {
            if (!oldData?.data?.orders) return oldData;
            return {
              ...oldData,
              data: {
                ...oldData.data,
                orders: oldData.data.orders.map((order: any) => 
                  order.id === response.data.id ? response.data : order
                )
              }
            };
          }
        );
      }
      
      // Cichy refetch w tle
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['orders'],
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

  const [showHistorical, setShowHistorical] = useState(propShowHistorical);
  const [showOrderCreator, setShowOrderCreator] = useState(propShowOrderCreator);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [statusChangeOrder, setStatusChangeOrder] = useState<any>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Domyślnie aktualna data
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Globalne event listenery dla synchronizacji między stronami
  useEffect(() => {
    const handleOrderCreated = (event: CustomEvent) => {
      const newOrder = event.detail;
      queryClient.setQueriesData(
        { queryKey: ['orders'] },
        (oldData: any) => {
          if (!oldData?.data?.orders) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              orders: [newOrder, ...oldData.data.orders]
            }
          };
        }
      );
    };

    const handleOrderUpdated = (event: CustomEvent) => {
      const updatedOrder = event.detail;
      queryClient.setQueriesData(
        { queryKey: ['orders'] },
        (oldData: any) => {
          if (!oldData?.data?.orders) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              orders: oldData.data.orders.map((order: any) => 
                order.id === updatedOrder.id ? updatedOrder : order
              )
            }
          };
        }
      );
    };

    window.addEventListener('orderCreated', handleOrderCreated as EventListener);
    window.addEventListener('orderUpdated', handleOrderUpdated as EventListener);

    return () => {
      window.removeEventListener('orderCreated', handleOrderCreated as EventListener);
      window.removeEventListener('orderUpdated', handleOrderUpdated as EventListener);
    };
  }, [queryClient]);

  // Memoized search handler to prevent re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  }, []);

  // Handle search button click
  const handleSearch = () => {
    setAppliedSearch(localSearch);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setLocalSearch('');
    setAppliedSearch('');
  };

  // Adjust status filter based on historical toggle
  const effectiveStatus = showHistorical 
    ? 'HISTORICAL' as any // Use string 'HISTORICAL' for historical view (shows both COMPLETED and CANCELLED)
    : status; // For active orders, only show OPEN, IN_PROGRESS, READY by default

  // Domyślnie pokazuj wszystkie zamówienia jeśli nie ma filtra typu
  const effectiveType = type;

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', { 
      status: effectiveStatus, 
      type: effectiveType, 
      search: appliedSearch, 
      page, 
      limit,
      showHistorical,
      selectedDate
    }],
    queryFn: () => {
      const dateFilter = showHistorical && selectedDate ? {
        dateFrom: selectedDate,
        dateTo: selectedDate
      } : {};
      
      // For "in_progress" and "pending_acceptance" filters, we need to get all orders and filter on frontend
      if (effectiveType === 'in_progress' || effectiveType === 'pending_acceptance') {
        const filters = {
          status: effectiveStatus || undefined,
          search: appliedSearch,
          page: 1,
          limit: 50,
          ...dateFilter
        };
        return ordersApi.getOrders(filters);
      }
      
      // For other filters, use backend filtering
      const filters = { 
        status: effectiveStatus || undefined, 
        type: effectiveType === 'all' ? undefined : (effectiveType as OrderType), 
        search: appliedSearch, 
        page, 
        limit,
        ...dateFilter
      };
      return ordersApi.getOrders(filters);
    },
    staleTime: 60 * 1000, // Cache for 60 seconds (better performance)
    refetchOnWindowFocus: false, // Disable refetch on focus for better performance
    refetchOnMount: true, // Changed to true to ensure data loads on mount
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // Wait 1 second before retry
    // Enable silent background refetching
    refetchInterval: 30 * 1000, // Refetch every 30 seconds in background
    refetchIntervalInBackground: true,
    // Add network mode for better performance
    networkMode: 'online',
    // Hide loading indicators for background refetches
    notifyOnChangeProps: ['data', 'error'] // Only notify on data/error changes, not on fetching
  });

  // Memoized filtered orders to prevent unnecessary re-renders
  const filteredOrders = useMemo(() => {
    // Check if data has valid structure
    if (!data || !data.success || !data.data || !Array.isArray(data.data.orders)) {
      console.warn('⚠️ Invalid orders data structure:', data);
      return [];
    }
    
    let orders = [...data.data.orders];
    
    // Apply "in_progress" filter - show only orders with assigned driver
    if (effectiveType === 'in_progress') {
      orders = orders.filter((order: any) => 
        order.assignedEmployee && order.assignedEmployee.id
      );
    }
    
    // Apply "pending_acceptance" filter - show only orders that need acceptance
    if (effectiveType === 'pending_acceptance') {
      orders = orders.filter((order: any) => isPendingStatus(order.status));
    }

    // Apply frontend search filtering (only when searchBy is not 'all')
    if (appliedSearch && searchBy !== 'all') {
      orders = orders.filter((order: any) => {
        const searchTerm = appliedSearch.toLowerCase();
        
        switch (searchBy) {
          case 'address':
            return order.delivery?.address?.street?.toLowerCase().includes(searchTerm) ||
                   order.delivery?.address?.city?.toLowerCase().includes(searchTerm);
          case 'customer':
            return order.customer?.name?.toLowerCase().includes(searchTerm);
          case 'phone':
            return order.customer?.phone?.toLowerCase().includes(searchTerm);
          case 'dish':
            return order.items?.some((item: any) => 
              item.name?.toLowerCase().includes(searchTerm)
            );
          case 'price':
            return order.total?.toString().includes(searchTerm);
          default:
            return true;
        }
      });
    }

    // Apply sorting
    orders.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'orderNumber':
          aValue = a.orderNumber || '';
          bValue = b.orderNumber || '';
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return orders;
  }, [data?.data?.orders, effectiveType, appliedSearch, searchBy, sortBy, sortOrder]);

  // Force refresh when showHistorical changes
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  }, [showHistorical]); // Remove queryClient from dependencies to prevent unnecessary invalidations

  // Listen for reset filters event from navigation
  React.useEffect(() => {
    const handleResetFilters = () => {
      resetFilters();
    };

    window.addEventListener('resetFilters', handleResetFilters);
    return () => {
      window.removeEventListener('resetFilters', handleResetFilters);
    };
  }, [resetFilters]);

  // Sync with props
  React.useEffect(() => {
    setShowHistorical(propShowHistorical);
  }, [propShowHistorical]);

  React.useEffect(() => {
    setShowOrderCreator(propShowOrderCreator);
  }, [propShowOrderCreator]);

  const handleEditOrder = (order: any) => {
    // Sprawdź czy zamówienie jest historyczne
    const isHistoricalOrder = order.status === 'COMPLETED' || order.status === 'CANCELLED';
    
    if (isHistoricalOrder) {
      alert('Nie można edytować zamówień historycznych (zakończonych lub anulowanych)');
      return;
    }

    setSelectedOrderId(order.id);

    if (isPendingStatus(order.status)) {
      setPendingModalOrder(order);
      setShowPendingModal(true);
      return;
    }
    
    setEditOrder(order);
    setShowOrderCreator(true);
  };

  const handleEditFromDetail = (order: any) => {
    // Sprawdź czy zamówienie jest historyczne
    const isHistoricalOrder = order.status === 'COMPLETED' || order.status === 'CANCELLED';
    
    if (isHistoricalOrder) {
      alert('Nie można edytować zamówień historycznych (zakończonych lub anulowanych)');
      return;
    }

    setSelectedOrderId(order.id);

    if (isPendingStatus(order.status)) {
      setPendingModalOrder(order);
      setShowPendingModal(true);
      setShowOrderDetail(false); // Zamknij szczegóły zamówienia
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
    setShowOrderDetail(false); // Zamknij szczegóły zamówienia
  };


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


  const handleSort = (field: 'createdAt' | 'total' | 'orderNumber') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: 'createdAt' | 'total' | 'orderNumber') => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const getSearchByLabel = (type: string) => {
    switch (type) {
      case 'all': return 'Wszystko';
      case 'address': return 'Adres';
      case 'customer': return 'Nazwa klienta';
      case 'dish': return 'Nazwa dania';
      case 'price': return 'Cena';
      case 'phone': return 'Nr telefonu';
      default: return 'Wszystko';
    }
  };

  if (isLoading) {
    return (
      <div className="orders-list-page">
        <div className="loading-container">
          <div className="loading-skeleton">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="order-skeleton">
                <div className="skeleton-header">
                  <div className="skeleton-order-number"></div>
                  <div className="skeleton-status"></div>
                </div>
                <div className="skeleton-content">
                  <div className="skeleton-customer"></div>
                  <div className="skeleton-total"></div>
                </div>
                <div className="skeleton-actions">
                  <div className="skeleton-button"></div>
                  <div className="skeleton-button"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-list-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>Błąd podczas ładowania zamówień</h3>
          <p>Sprawdź połączenie z serwerem i spróbuj ponownie.</p>
        </div>
      </div>
    );
  }

  // Use local orders state instead of data
  const total = data?.data?.total || 0;

  return (
    <div className="orders-list-page">
      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <div className="search-container">
            <div className="search-input-group">
              <input
                key="search-input"
                type="text"
                placeholder="Szukaj zamówień..."
                value={localSearch}
                onChange={handleSearchChange}
                className="search-input"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <div className="search-by-selector">
                <label className="search-by-label">Wyszukaj po:</label>
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value as any)}
                  className="search-by-select"
                >
                  <option value="all">Wszystko</option>
                  <option value="address">Adres</option>
                  <option value="customer">Nazwa klienta</option>
                  <option value="dish">Nazwa dania</option>
                  <option value="price">Cena</option>
                  <option value="phone">Nr telefonu</option>
                </select>
              </div>
              <div className="search-buttons">
                <button
                  onClick={handleSearch}
                  className="search-btn"
                  disabled={!localSearch.trim()}
                >
                  🔍 Szukaj
                </button>
                {appliedSearch && (
                  <button
                    onClick={handleClearSearch}
                    className="clear-search-btn"
                  >
                    ✕ Wyczyść
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">Typ:</label>
            <div className="filter-buttons">
              {ORDER_TYPES.map((typeItem) => {
                const count = counts[typeItem.key as keyof typeof counts] || 0;
                return (
                  <button
                    key={typeItem.key}
                    onClick={() => setType(type === typeItem.key ? null : typeItem.key)}
                    className={`nav-filter-btn ${type === typeItem.key ? 'active' : ''}`}
                  >
                    <span className="filter-icon">{typeItem.icon}</span>
                    <span className="filter-label-text">{typeItem.label}</span>
                    {!countsLoading && count > 0 && (
                      <span className="filter-count">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sort controls */}
        <div className="filter-row">
          <div className="filter-group">
            <label className="filter-label">Sortuj według:</label>
            <div className="sort-buttons">
              <button
                onClick={() => handleSort('createdAt')}
                className={`sort-btn ${sortBy === 'createdAt' ? 'active' : ''}`}
              >
                Data {getSortIcon('createdAt')}
              </button>
              <button
                onClick={() => handleSort('total')}
                className={`sort-btn ${sortBy === 'total' ? 'active' : ''}`}
              >
                Kwota {getSortIcon('total')}
              </button>
              <button
                onClick={() => handleSort('orderNumber')}
                className={`sort-btn ${sortBy === 'orderNumber' ? 'active' : ''}`}
              >
                Numer {getSortIcon('orderNumber')}
              </button>
            </div>
          </div>
        </div>

        {/* Date filter - only show for historical orders */}
        {showHistorical && (
          <div className="filter-row">
            <div className="filter-group">
              <label className="filter-label">Data:</label>
              <div className="date-filter">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="date-input"
                />
                <button
                  onClick={() => {
                    const today = new Date();
                    setSelectedDate(today.toISOString().split('T')[0]);
                  }}
                  className="date-today-btn"
                  title="Dzisiaj"
                >
                  📅 Dzisiaj
                </button>
              </div>
            </div>
          </div>
        )}

      </div>


      {/* Main Content - Orders List and Details */}
      <div className="main-content">
        {/* Orders List */}
        <div className={`orders-container ${showOrderDetail ? 'with-details' : ''}`}>
          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Brak zamówień</h3>
              <p>
                {showHistorical 
                  ? 'Nie znaleziono zamówień historycznych dla wybranych filtrów.'
                  : 'Nie znaleziono aktywnych zamówień dla wybranych filtrów.'
                }
              </p>
            </div>
          ) : (
            <div className="orders-grid">
              {filteredOrders.map((order: any) => (
                <OrderItemRow
                  key={order.id}
                  order={order}
                  isSelected={selectedOrderId === order.id}
                  onEdit={handleEditOrder}
                  onOrderUpdated={handleOrderUpdated}
                  onCancel={handleCancelOrder}
                  onRestore={handleRestoreOrder}
                />
              ))}
            </div>
          )}
        </div>

        {/* Order Details Popup */}
        {showOrderDetail && selectedOrderDetail && (
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
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            <span>
              Pokazano {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} z {total} zamówień
            </span>
          </div>
          <div className="pagination-controls">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="pagination-btn"
            >
              ← Poprzednia
            </button>
            <span className="page-info">
              Strona {page} z {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="pagination-btn"
            >
              Następna →
            </button>
          </div>
        </div>
      )}

      {/* Order Creator Modal */}
      <OrderCreator 
        isOpen={showOrderCreator} 
        onClose={() => {
          setShowOrderCreator(false);
          setEditOrder(null);
          // Call prop function if provided
          if (propSetShowOrderCreator) {
            propSetShowOrderCreator(false);
          }
        }}
        editOrder={editOrder}
        onOrderUpdated={handleOrderUpdated}
      />

      <PendingOrderModal
        order={pendingModalOrder}
        isOpen={showPendingModal && !!pendingModalOrder}
        onClose={() => {
          setShowPendingModal(false);
          setPendingModalOrder(null);
          setSelectedOrderId(null);
        }}
        onAccepted={(updatedOrder) => {
          setShowPendingModal(false);
          setPendingModalOrder(null);
          setShowOrderDetail(false);
          setSelectedOrderDetail(null);
          setSelectedOrderId(null);
          handleOrderUpdated(updatedOrder);
          queryClient.invalidateQueries({ queryKey: ['orders-map'] });
          queryClient.invalidateQueries({ queryKey: ['order-summary'] });
        }}
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

    </div>
  );
};

export const OrdersListPage = React.memo(OrdersListPageComponent);

export default OrdersListPage;



