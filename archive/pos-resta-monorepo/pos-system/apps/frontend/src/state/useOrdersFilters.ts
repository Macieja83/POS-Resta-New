import { create } from 'zustand';
import { OrderStatus } from '../types/shared';

interface OrdersFiltersState {
  status: OrderStatus | null;
  type: string | null;
  search: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
  selectedOrderId: string | null;
  
  // Actions
  setStatus: (status: OrderStatus | null) => void;
  setType: (type: string | null) => void;
  setSearch: (search: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSelectedOrderId: (id: string | null) => void;
  resetFilters: () => void;
}

export const useOrdersFilters = create<OrdersFiltersState>((set) => ({
  // Initial state
  status: null,
  type: null,
  search: '',
  dateFrom: '',
  dateTo: '',
  page: 1,
  limit: 20,
  selectedOrderId: null,

  // Actions
  setStatus: (status) => set({ status, page: 1 }),
  setType: (type) => set({ type, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setDateFrom: (dateFrom) => set({ dateFrom, page: 1 }),
  setDateTo: (dateTo) => set({ dateTo, page: 1 }),
  setPage: (page) => set({ page }),
  setLimit: (limit) => set({ limit, page: 1 }),
  setSelectedOrderId: (selectedOrderId) => set({ selectedOrderId }),
  
  resetFilters: () => set({
    status: null,
    type: null,
    search: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 20,
    selectedOrderId: null,
  }),
}));
