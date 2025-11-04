import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert, Modal, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { ordersApi } from '../lib/api';
import type { Order } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { CountdownTimer } from '../components/CountdownTimer';

type Tab = 'available' | 'my';

const STATUS_OPTIONS = [
  {
    value: 'ON_THE_WAY',
    label: 'W drodze',
    description: 'Powiadom restaurację, że wyruszyłeś do klienta',
    requiresPayment: false,
  },
  {
    value: 'DELIVERED',
    label: 'Zakończ zamówienie',
    description: 'Dostarczone – wybierz formę płatności i zamknij zamówienie',
    requiresPayment: true,
  },
] as const;

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Gotówka' },
  { value: 'CARD', label: 'Karta' },
] as const;

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('available');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatusOption, setSelectedStatusOption] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const { isAuthenticated, loading: authLoading, token, user, logout } = useAuth();
  const router = useRouter();
  const isFetchingRef = useRef(false);
  const pendingRefreshRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const extractAddressString = (value: unknown): string => {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object') {
      const addressObject = value as { street?: unknown; city?: unknown; postalCode?: unknown; comment?: unknown };
      const parts = [addressObject.street, addressObject.city, addressObject.postalCode]
        .map((part) => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);

      let formatted = parts.join(', ');
      if (typeof addressObject.comment === 'string' && addressObject.comment.trim()) {
        formatted = formatted
          ? `${formatted} (${addressObject.comment.trim()})`
          : addressObject.comment.trim();
      }

      return formatted;
    }

    return '';
  };

  const formatDeliveryAddress = (order?: Order | null): string => {
    if (!order) {
      return '';
    }

    const fromDelivery = extractAddressString(order.delivery?.address ?? null);
    if (fromDelivery) {
      return fromDelivery;
    }

    const fromField = extractAddressString(order.deliveryAddress ?? null);
    if (fromField) {
      return fromField;
    }

    const fromCustomer = extractAddressString(order.customer?.address ?? null);
    if (fromCustomer) {
      return fromCustomer;
    }

    return '';
  };

  const upsertOrderInState = (order: Order) => {
    const assignedId = order.assignedEmployeeId;
    const isAssignedToCurrentUser = !!assignedId && !!user && assignedId === user.id;
    const isUnassigned = !assignedId;
    const normalizedStatus = (order.status || '').toUpperCase();
    const shouldBeAvailable = isUnassigned && ['OPEN', 'PENDING', 'READY', 'ON_THE_WAY', 'PENDING_ACCEPTANCE'].includes(normalizedStatus);

    setMyOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id);
      if (isAssignedToCurrentUser) {
        if (exists) {
          return prev.map((o) => (o.id === order.id ? order : o));
        }
        return [order, ...prev];
      }
      if (exists) {
        return prev.filter((o) => o.id !== order.id);
      }
      return prev;
    });

    setAvailableOrders((prev) => {
      const without = prev.filter((o) => o.id !== order.id);
      if (shouldBeAvailable) {
        return [order, ...without];
      }
      return without;
    });

    if (selectedOrder && selectedOrder.id === order.id) {
      if (isAssignedToCurrentUser) {
        setSelectedOrder(order);
      } else if (isUnassigned) {
        setSelectedOrder(null);
      }
    }

    if (shouldBeAvailable && activeTab !== 'available') {
      setActiveTab('available');
    }
  };

  const allowedStatusOptions = useMemo(() => {
    if (!selectedOrder) {
      return [] as Array<(typeof STATUS_OPTIONS)[number]>;
    }

    const currentStatus = selectedOrder.status;
    const options: Array<(typeof STATUS_OPTIONS)[number]> = [];

    if (['OPEN', 'PENDING', 'READY', 'ASSIGNED'].includes(currentStatus)) {
      options.push(STATUS_OPTIONS[0]);
    }

    if (['ON_THE_WAY', 'DELIVERED'].includes(currentStatus)) {
      options.push(STATUS_OPTIONS[1]);
    }

    return options;
  }, [selectedOrder]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      requestAnimationFrame(() => {
        router.replace('/(auth)/login');
      });
    } else if (isAuthenticated) {
      loadAllOrders();
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }

    const handleExternalOrderUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<Order | { order: Order }>;
      const detail = customEvent.detail as any;
      const updatedOrder: Order | undefined = detail?.order ?? detail;

      if (updatedOrder) {
        upsertOrderInState(updatedOrder);
      } else {
        loadAllOrders({ silent: true });
      }
    };

    window.addEventListener('orderUpdated', handleExternalOrderUpdate as EventListener);
    window.addEventListener('orderAssignmentChanged', handleExternalOrderUpdate as EventListener);

    return () => {
      window.removeEventListener('orderUpdated', handleExternalOrderUpdate as EventListener);
      window.removeEventListener('orderAssignmentChanged', handleExternalOrderUpdate as EventListener);
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const poll = () => {
      loadAllOrders({ silent: true });
    };

    poll();
    pollingRef.current = setInterval(poll, 10000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!showStatusModal || !selectedOrder) {
      setSelectedStatusOption('');
      setSelectedPaymentMethod('');
      return;
    }

    if (allowedStatusOptions.length === 0) {
      setSelectedStatusOption('');
      setSelectedPaymentMethod('');
      return;
    }

    const preferredOption = allowedStatusOptions.find(option => option.value === 'DELIVERED')
      || allowedStatusOptions[0];

    setSelectedStatusOption(preferredOption.value);

    if (preferredOption.requiresPayment) {
      setSelectedPaymentMethod(selectedOrder.paymentMethod || '');
    } else {
      setSelectedPaymentMethod('');
    }
  }, [showStatusModal, selectedOrder, allowedStatusOptions]);

  const loadAllOrders = async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (!isAuthenticated || !token) {
      if (!silent) {
      setLoading(false);
      }
      setRefreshing(false);
      return;
    }

    if (isFetchingRef.current) {
      pendingRefreshRef.current = true;
      return;
    }

    isFetchingRef.current = true;
    if (!silent) {
      setLoading(true);
    }

    const finish = () => {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
      isFetchingRef.current = false;

      if (pendingRefreshRef.current) {
        pendingRefreshRef.current = false;
        setTimeout(() => {
          loadAllOrders({ silent: true });
        }, 0);
      }
    };

    try {
      const [available, mine] = await Promise.all([
        ordersApi.getAvailableOrders(20, 1),
        ordersApi.getMyOrders(20, 1),
      ]);

      if (available.success && available.data) {
        setAvailableOrders(Array.isArray(available.data) ? available.data : []);
    }

      if (mine.success && mine.data) {
        setMyOrders(mine.data.data || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('autoryz')) {
        await logout();
      }
    } finally {
      finish();
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllOrders({ silent: true });
  };

  const handleClaimOrder = async (orderId: string) => {
    setClaiming(orderId);
    try {
      console.log('🔵 [handleClaimOrder] Claiming order:', orderId);
      const response = await ordersApi.claimOrder(orderId);
      if (response.success) {
        console.log('✅ [handleClaimOrder] Order claimed successfully');
        if (response.data) {
          upsertOrderInState(response.data);
        }
        await loadAllOrders({ silent: true });
        // Switch to "My Orders" tab to show the newly claimed order
        setActiveTab('my');
        Alert.alert('Sukces', 'Zamówienie zostało przypisane do Twojego konta');
      } else {
        console.error('❌ [handleClaimOrder] Claim failed:', response.error);
        Alert.alert('Błąd', response.error || 'Nie udało się przejąć zamówienia');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('❌ [handleClaimOrder] Error:', error);
      Alert.alert('Błąd', message || 'Nie udało się przejąć zamówienia');
    } finally {
      setClaiming(null);
    }
  };

  const handleUpdateStatus = async (status: string, paymentMethod?: string): Promise<boolean> => {
    if (!selectedOrder) {
      return false;
    }

    setUpdatingStatus(true);
    try {
      const payload: Record<string, any> = { status };
      if (paymentMethod) {
        payload.paymentMethod = paymentMethod;
      }

      const response = await ordersApi.updateOrderStatus(selectedOrder.id, payload);
      if (response.success) {
        if (response.data) {
          upsertOrderInState(response.data);
          setSelectedOrder(response.data);
        }
        await loadAllOrders({ silent: true });
        Alert.alert('Sukces', 'Status zamówienia został zaktualizowany');
        return true;
      }

      Alert.alert('Błąd', response.error || 'Nie udało się zaktualizować statusu');
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Błąd', message || 'Nie udało się zaktualizować statusu');
      return false;
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedStatusOption('');
    setSelectedPaymentMethod('');
    setSelectedOrder(null);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedOrder || !selectedStatusOption) {
      Alert.alert('Błąd', 'Brak dostępnej akcji dla tego zamówienia');
      return;
    }

    if (selectedStatusOption === 'DELIVERED' && !selectedPaymentMethod) {
      Alert.alert('Wybierz płatność', 'Wybierz formę płatności, aby zakończyć zamówienie');
      return;
    }

    const success = await handleUpdateStatus(
      selectedStatusOption,
      selectedStatusOption === 'DELIVERED' ? selectedPaymentMethod : undefined
    );

    if (success) {
      handleCloseStatusModal();
    }
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} zł`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#2196F3';
      case 'PENDING': return '#FF9800';
      case 'READY': return '#4CAF50';
      case 'ON_THE_WAY': return '#9C27B0';
      case 'DELIVERED': return '#4CAF50';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      OPEN: 'Otwarte',
      PENDING: 'Oczekujące',
      READY: 'Gotowe',
      ON_THE_WAY: 'W drodze',
      DELIVERED: 'Dostarczone',
      COMPLETED: 'Zakończone',
      CANCELLED: 'Anulowane',
    };
    return labels[status] || status;
  };

const getPaymentMethodLabel = (method?: string) => {
  switch ((method || '').toUpperCase()) {
    case 'CASH':
      return 'Gotówka';
    case 'CARD':
      return 'Karta';
    case 'PAID':
      return 'Zapłacone';
    case 'ONLINE':
      return 'Online';
    default:
      return 'Brak informacji';
  }
};

  const renderAvailableOrder = ({ item }: { item: Order }) => {
    const displayAddress = formatDeliveryAddress(item);
    const paymentLabel = getPaymentMethodLabel(item.paymentMethod);

    return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.customerPhone}>📞 {item.customer.phone}</Text>
          {displayAddress ? (
            <Text style={styles.address}>📍 {displayAddress}</Text>
          ) : null}
          <Text style={styles.paymentInfo}>💳 {paymentLabel}</Text>
        {item.promisedTime && (
          <View style={styles.timerContainer}>
            <CountdownTimer
              createdAt={item.createdAt}
              promisedTime={item.promisedTime}
              status={item.status}
            />
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.total}>{formatPrice(item.total)}</Text>
        <TouchableOpacity
          style={[styles.claimButton, claiming === item.id && styles.claimButtonDisabled]}
          onPress={(e) => {
            e.stopPropagation();
            handleClaimOrder(item.id);
          }}
          disabled={claiming === item.id || !!item.assignedEmployeeId}
        >
          {claiming === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.claimButtonText}>
              {item.assignedEmployeeId ? 'Przypisane' : 'Przejmij'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  };

  const renderMyOrder = ({ item }: { item: Order }) => {
    const displayAddress = formatDeliveryAddress(item);
    const paymentLabel = getPaymentMethodLabel(item.paymentMethod);

    return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => {
        setSelectedOrder(item);
        setShowDetailsModal(true);
      }}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.customerPhone}>📞 {item.customer.phone}</Text>
          {displayAddress ? (
            <Text style={styles.address}>📍 {displayAddress}</Text>
          ) : null}
          <Text style={styles.paymentInfo}>💳 {paymentLabel}</Text>
        {item.promisedTime && (
          <View style={styles.timerContainer}>
            <CountdownTimer
              createdAt={item.createdAt}
              promisedTime={item.promisedTime}
              status={item.status}
            />
          </View>
        )}
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.total}>{formatPrice(item.total)}</Text>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={(e) => {
            e.stopPropagation();
            setSelectedOrder(item);
            setShowStatusModal(true);
          }}
        >
          <Text style={styles.statusButtonText}>Zmień status</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  };

  if (loading && availableOrders.length === 0 && myOrders.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie zamówień...</Text>
      </View>
    );
  }

  const currentOrders = activeTab === 'available' ? availableOrders : myOrders;
  const confirmDisabled =
    updatingStatus ||
    !selectedStatusOption ||
    allowedStatusOptions.length === 0 ||
    (selectedStatusOption === 'DELIVERED' && !selectedPaymentMethod);

  const confirmButtonLabel = selectedStatusOption === 'DELIVERED'
    ? 'Zakończ zamówienie'
    : selectedStatusOption === 'ON_THE_WAY'
      ? 'Oznacz jako w drodze'
      : 'Potwierdź';
 
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Zamówienia</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.tabActive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabText, activeTab === 'available' && styles.tabTextActive]}>
              Dostępne ({availableOrders.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'my' && styles.tabActive]}
            onPress={() => setActiveTab('my')}
          >
            <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
              Moje ({myOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={currentOrders}
        renderItem={activeTab === 'available' ? renderAvailableOrder : renderMyOrder}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'available' ? 'Brak dostępnych zamówień' : 'Brak przypisanych zamówień'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Order Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <ScrollView>
                <Text style={styles.modalTitle}>Szczegóły zamówienia #{selectedOrder.orderNumber}</Text>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Klient:</Text>
                  <Text style={styles.modalValue}>{selectedOrder.customer.name}</Text>
                  <View style={styles.contactRow}>
                  <Text style={styles.modalValue}>📞 {selectedOrder.customer.phone}</Text>
                    <TouchableOpacity
                      style={styles.contactButton}
                      onPress={() => Linking.openURL(`tel:${selectedOrder.customer.phone}`)}
                    >
                      <Text style={styles.contactButtonText}>Zadzwoń</Text>
                    </TouchableOpacity>
                </View>
                </View>
                {(() => {
                  const detailAddress = formatDeliveryAddress(selectedOrder);
                  if (!detailAddress) {
                    return null;
                  }
                  const mapsQuery = encodeURIComponent(detailAddress);
                  return (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Adres dostawy:</Text>
                      <View style={styles.contactRow}>
                        <Text style={[styles.modalValue, styles.addressText]}>📍 {detailAddress}</Text>
                        <TouchableOpacity
                          style={styles.contactButton}
                          onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`)}
                        >
                          <Text style={styles.contactButtonText}>Nawiguj</Text>
                        </TouchableOpacity>
                  </View>
                    </View>
                  );
                })()}
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Status:</Text>
                  <Text style={styles.modalValue}>{getStatusLabel(selectedOrder.status)}</Text>
                </View>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Wartość:</Text>
                  <Text style={styles.modalValue}>{formatPrice(selectedOrder.total)}</Text>
                </View>
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Pozycje:</Text>
                    {selectedOrder.items.map((item: any, index: number) => (
                      <Text key={index} style={styles.modalValue}>
                        • {item.name} x{item.quantity} - {formatPrice(item.price * item.quantity)}
                      </Text>
                    ))}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Text style={styles.modalCloseButtonText}>Zamknij</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseStatusModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <>
                <Text style={styles.modalTitle}>Zmień status zamówienia</Text>
                <Text style={styles.modalSubtitle}>#{selectedOrder.orderNumber}</Text>
                
                <ScrollView style={styles.modalScroll}>
                  <View style={styles.statusOptionsContainer}>
                    {allowedStatusOptions.length === 0 ? (
                      <Text style={styles.emptyStatusText}>
                        Brak dostępnych akcji dla tego zamówienia.
                    </Text>
                    ) : (
                      allowedStatusOptions.map((option) => {
                        const isActive = selectedStatusOption === option.value;
                        return (
                  <TouchableOpacity
                            key={option.value}
                            style={[styles.statusOptionCard, isActive && styles.statusOptionCardActive]}
                    onPress={() => {
                              setSelectedStatusOption(option.value);
                              if (!option.requiresPayment) {
                                setSelectedPaymentMethod('');
                      }
                    }}
                    disabled={updatingStatus}
                  >
                            <Text style={[styles.statusOptionTitle, isActive && styles.statusOptionTitleActive]}>
                              {option.label}
                    </Text>
                            <Text style={styles.statusOptionDescription}>{option.description}</Text>
                  </TouchableOpacity>
                        );
                      })
                    )}
                </View>

                  {selectedStatusOption === 'DELIVERED' && (
                    <View style={styles.paymentSection}>
                      <Text style={styles.sectionLabel}>Forma płatności</Text>
                      {selectedOrder.paymentMethod === 'PAID' ? (
                  <View style={styles.paidInfoContainer}>
                          <Text style={styles.paidInfoText}>💰 Zamówienie opłacone online – forma płatności zablokowana</Text>
                        </View>
                      ) : (
                        <View style={styles.paymentButtonsWrapper}>
                          {PAYMENT_OPTIONS.map((option) => {
                            const active = selectedPaymentMethod === option.value;
                            return (
                              <TouchableOpacity
                                key={option.value}
                                style={[styles.paymentButton, active && styles.paymentButtonActive]}
                                onPress={() => setSelectedPaymentMethod(option.value)}
                                disabled={updatingStatus}
                              >
                                <Text style={[styles.paymentButtonText, active && styles.paymentButtonTextActive]}>
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                  </View>
                )}
                    </View>
                  )}
                </ScrollView>

                {updatingStatus && (
                  <ActivityIndicator size="small" color="#007AFF" style={styles.updatingIndicator} />
                )}

                <View style={styles.modalActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={handleCloseStatusModal}
                  disabled={updatingStatus}
                >
                    <Text style={styles.actionButtonSecondaryText}>Anuluj</Text>
                </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary, (selectedStatusOption === 'DELIVERED' && !selectedPaymentMethod) && styles.actionButtonDisabled]}
                    onPress={handleConfirmStatusChange}
                    disabled={
                      updatingStatus ||
                      !selectedStatusOption ||
                      (selectedStatusOption === 'DELIVERED' && !selectedPaymentMethod)
                    }
                  >
                    <Text style={styles.actionButtonPrimaryText}>
                      {updatingStatus ? 'Aktualizuję…' : 'Potwierdź'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  paymentInfo: {
    fontSize: 14,
    color: '#334155',
    marginTop: 6,
    fontWeight: '600',
  },
  timerContainer: {
    marginTop: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  claimButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  modalCloseButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalScroll: {
    maxHeight: 320,
    marginVertical: 12,
  },
  statusOptionsContainer: {
    gap: 12,
  },
  statusOptionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9fafb',
  },
  statusOptionCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusOptionTitleActive: {
    color: '#0f172a',
  },
  statusOptionDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  emptyStatusText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  paymentSection: {
    marginTop: 20,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  paymentButtonsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentButton: {
    flexGrow: 1,
    minWidth: 90,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  paymentButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  paymentButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  paymentButtonTextActive: {
    color: '#0f172a',
  },
  paidInfoContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
  },
  paidInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#15803D',
  },
  updatingIndicator: {
    marginTop: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#f3f4f6',
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  contactRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    flex: 1,
  },
  contactButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
