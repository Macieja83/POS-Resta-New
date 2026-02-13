import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { OrderItemRow } from './OrderItemRow';
import { useOrdersFilters } from '../../state/useOrdersFilters';
import { ordersApi } from '../../api/orders';
import { OrderStatus, OrderType } from '../../types/shared';

const ORDER_STATUSES: OrderStatus[] = [OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED];
const ORDER_TYPES: OrderType[] = [OrderType.DELIVERY, OrderType.TAKEAWAY, OrderType.DINE_IN];

interface OrdersListProps {
  defaultType?: 'delivery' | 'takeaway' | 'dine_in';
}

export const OrdersList: React.FC<OrdersListProps> = ({ defaultType }) => {
  const {
    status,
    type,
    search,
    dateFrom,
    dateTo,
    page,
    limit,
    selectedOrderId,
    // setSelectedOrderId,
    setStatus,
    setType,
    setSearch,
    setPage,
  } = useOrdersFilters();

  // Ustaw domyślny typ zamówienia jeśli podano
  useEffect(() => {
    if (defaultType && !type) {
      switch (defaultType) {
        case 'delivery':
          setType(OrderType.DELIVERY);
          break;
        case 'takeaway':
          setType(OrderType.TAKEAWAY);
          break;
        case 'dine_in':
          setType(OrderType.DINE_IN);
          break;
      }
    }
  }, [defaultType, type, setType]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', { status, type, search, dateFrom, dateTo, page, limit, defaultType }],
    queryFn: () => ordersApi.getOrders({ 
      status: status || undefined, 
      type: type as OrderType || undefined, 
      search, 
      dateFrom, 
      dateTo, 
      page, 
      limit 
    }),
  });

  // const handleOrderSelect = (order: any) => {
  //   setSelectedOrderId(order.id);
  // };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-center">Ładowanie zamówień...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600">Błąd podczas ładowania zamówień</div>
      </div>
    );
  }

  if (!data?.data?.orders || data.data.orders.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">Brak zamówień</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Szukaj zamówień..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {ORDER_STATUSES.map((statusValue) => (
            <button
              key={statusValue}
              onClick={() => setStatus(status === statusValue ? null : statusValue)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                status === statusValue
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {statusValue}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {ORDER_TYPES.map((typeValue) => (
            <button
              key={typeValue}
              onClick={() => setType(type === typeValue ? null : typeValue)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                type === typeValue
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {typeValue}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        {data.data.orders.map((order: any) => (
          <OrderItemRow
            key={order.id}
            order={order}
            isSelected={selectedOrderId === order.id}
          />
        ))}
      </div>

      {/* Pagination */}
      {data.data.total > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Strona {page} z {Math.ceil(data.data.total / limit)}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Poprzednia
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(data.data.total / limit)}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
              >
                Następna
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
