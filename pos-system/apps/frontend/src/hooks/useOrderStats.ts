import { useMemo } from 'react';
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
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders-map'],
    queryFn: () => ordersApi.getOrdersForMap(),
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
  });

  const activeOrders = useMemo(() => {
    if (data?.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [] as unknown[];
  }, [data]);

  const counts = useMemo(() => {
    const result = {
      all: 0,
      DELIVERY: 0,
      TAKEAWAY: 0,
      DINE_IN: 0,
      in_progress: 0,
      pending_acceptance: 0,
    };

    const pendingStatuses = new Set(['PENDING', 'PENDING_ACCEPTANCE']);

    activeOrders.forEach((order: unknown) => {
      const typed = order as {
        type?: string;
        status?: string;
        assignedEmployeeId?: string;
      };
      result.all += 1;

      switch (typed.type) {
        case 'DELIVERY':
          result.DELIVERY += 1;
          break;
        case 'TAKEAWAY':
          result.TAKEAWAY += 1;
          break;
        case 'DINE_IN':
          result.DINE_IN += 1;
          break;
        default:
          break;
      }

      if (typed.assignedEmployeeId) {
        result.in_progress += 1;
      }

      const status = (typed.status || '').toUpperCase();
      if (pendingStatuses.has(status)) {
        result.pending_acceptance += 1;
      }
    });

    return result;
  }, [activeOrders]);

  return {
    counts,
    isLoading,
    error,
    stats: undefined,
  };
};
