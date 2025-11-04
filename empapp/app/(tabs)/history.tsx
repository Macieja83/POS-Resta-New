import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ordersApi } from '../lib/api';
import type { Order } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function HistoryScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    cash: 0,
    card: 0,
    paid: 0,
    totalCash: 0,
    totalCard: 0,
    totalPaid: 0,
    totalAmount: 0,
  });
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const getOrderReferenceDate = (order: Order): Date | null => {
    const anyOrder = order as Record<string, any>;
    const candidate =
      anyOrder.completedAt ||
      anyOrder.deliveredAt ||
      anyOrder.updatedAt ||
      order.createdAt;

    if (!candidate) {
      return null;
    }

    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const isSameDay = (first: Date, second: Date) => (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );

  const calculateStats = (dailyOrders: Order[]) => {
    const result = {
      total: dailyOrders.length,
      cash: 0,
      card: 0,
      paid: 0,
      totalCash: 0,
      totalCard: 0,
      totalPaid: 0,
      totalAmount: 0,
    };

    dailyOrders.forEach((order) => {
      const payment = (order.paymentMethod || '').toUpperCase();
      const amount = Number(order.total) || 0;

      switch (payment) {
        case 'CASH':
          result.cash += 1;
          result.totalCash += amount;
          break;
        case 'CARD':
          result.card += 1;
          result.totalCard += amount;
          break;
        case 'PAID':
          result.paid += 1;
          result.totalPaid += amount;
          break;
        default:
          break;
      }
    });

    result.totalAmount = result.totalCash + result.totalCard + result.totalPaid;
    return result;
  };

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      requestAnimationFrame(() => {
        router.replace('/(auth)/login');
      });
    } else if (isAuthenticated) {
      loadHistory();
    }
  }, [isAuthenticated, authLoading]);

  const loadHistory = async () => {
    try {
      const response = await ordersApi.getOrderHistory(100, 1);
      if (response.success && response.data) {
        const today = new Date();
        const fetchedOrders = response.data.data || [];

        const filteredOrders = fetchedOrders.filter((order) => {
          const refDate = getOrderReferenceDate(order);
          return refDate ? isSameDay(refDate, today) : false;
        });

        setOrders(filteredOrders);
        setStats(calculateStats(filteredOrders));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error loading history:', error);
      Alert.alert('Błąd', message || 'Nie udało się załadować historii');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatPrice = (price: number) => {
    return `${price.toFixed(2)} zł`;
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Gotówka';
      case 'CARD': return 'Karta';
      case 'PAID': return 'Zapłacone';
      default: return method || 'Nieznane';
    }
  };

  const getPaymentBadgeColor = (method: string) => {
    switch (method) {
      case 'CASH': return '#4CAF50';
      case 'CARD': return '#2196F3';
      case 'PAID': return '#9C27B0';
      default: return '#666';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        <View style={[styles.paymentBadge, { 
          backgroundColor: getPaymentBadgeColor(item.paymentMethod || '')
        }]}>
          <Text style={styles.paymentText}>
            {getPaymentMethodLabel(item.paymentMethod || '')}
          </Text>
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.customerName}>{item.customer.name}</Text>
        <Text style={styles.total}>{formatPrice(item.total)}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.date}>
          {(() => {
            const effectiveDate = getOrderReferenceDate(item);
            if (!effectiveDate) {
              return '-';
            }
            return effectiveDate.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            });
          })()}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Ładowanie historii...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Statistics Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statystyki płatności</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Wszystkie zamówienia</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.cash}</Text>
              <Text style={styles.statLabel}>Gotówka</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.card}</Text>
              <Text style={styles.statLabel}>Karta</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.paid}</Text>
              <Text style={styles.statLabel}>Zapłacone</Text>
            </View>
          </View>

          <View style={styles.amountsContainer}>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Suma gotówka:</Text>
              <Text style={styles.amountValue}>{formatPrice(stats.totalCash)}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Suma karta:</Text>
              <Text style={styles.amountValue}>{formatPrice(stats.totalCard)}</Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Suma zapłacone:</Text>
              <Text style={styles.amountValue}>{formatPrice(stats.totalPaid || 0)}</Text>
            </View>
            <View style={[styles.amountRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>RAZEM:</Text>
              <Text style={styles.totalValue}>{formatPrice(stats.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Orders List */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Historia zamówień</Text>
          <Text style={styles.headerSubtitle}>{orders.length} zamówień</Text>
        </View>

        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Brak historii zamówień</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </ScrollView>
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
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  amountsContainer: {
    marginTop: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#007AFF',
    marginTop: 4,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  paymentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  orderFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
