import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { OrderSummaryFilters } from '../types/shared';

export const useOrderStats = (filters?: OrderSummaryFilters) => {
  return useQuery({
    queryKey: ['order-stats', filters],
    queryFn: () => ordersApi.getOrderSummary(filters || {}),
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    refetchIntervalInBackground: true,
  });
};

export const useOrderCounts = () => {
  const { data: statsData, isLoading, error } = useOrderStats();
  
  const stats = statsData?.data;
  
  // Calculate counts for each filter type
  const counts = {
    all: stats?.totalOrders || 0,
    DELIVERY: stats?.ordersByType?.DELIVERY || 0,
    TAKEAWAY: stats?.ordersByType?.TAKEAWAY || 0,
    DINE_IN: stats?.ordersByType?.DINE_IN || 0,
    in_progress: 0, // Will be calculated from orders with assignedEmployeeId
    pending_acceptance: 0, // Will be calculated from orders with status OPEN/NEW
  };

  // For in_progress and pending_acceptance, we need to get additional data
  // These will be calculated from the main orders query
  const { data: ordersData } = useQuery({
    queryKey: ['orders', { status: undefined, type: undefined }],
    queryFn: () => ordersApi.getOrders({ 
      status: undefined, 
      type: undefined, 
      page: 1, 
      limit: 100 
    }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Calculate in_progress and pending_acceptance counts
  if (ordersData?.data?.orders) {
    const orders = ordersData.data.orders;
    
    // In progress = orders with assigned employee
    counts.in_progress = orders.filter((order: any) => 
      order.assignedEmployeeId && 
      order.status !== 'COMPLETED' && 
      order.status !== 'CANCELLED'
    ).length;
    
    // Pending acceptance = orders with status OPEN or NEW
    counts.pending_acceptance = orders.filter((order: any) => 
      order.status === 'OPEN' || order.status === 'NEW'
    ).length;
  }

  return {
    counts,
    isLoading,
    error,
    stats
  };
};
