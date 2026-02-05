import { OrdersRepository } from '../repos/orders.repo';
import { EmployeesRepository } from '../repos/employees.repo';
import { OrderStatus, OrderSummaryFilters, OrderSummaryResponse, OrdersFiltersInput, CreateOrderInput, UpdateOrderStatusInput } from '../types/local';
import { AppError } from '../middlewares/errorHandler';

export class OrdersService {
  constructor(
    private ordersRepo: OrdersRepository,
    private employeesRepo: EmployeesRepository
  ) {}

  async getOrders(filters: OrdersFiltersInput) {
    // Include items so the orders list (tiles) can display cart contents
    return this.ordersRepo.findAll(filters, true);
  }

  async getOrderById(id: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new Error(`Zamówienie o ID ${id} nie zostało znalezione`);
    }
    return order;
  }

  async createOrder(data: CreateOrderInput) {
    // Validate delivery address for delivery orders
    if (data.type === 'DELIVERY' && !data.customer.address) {
      throw new Error('Adres dostawy jest wymagany dla zamówień typu dostawa');
    }

    // Validate table number for dine-in orders
    if (data.type === 'DINE_IN' && (!data.tableNumber || data.tableNumber.trim() === '')) {
      throw new Error('Numer stolika jest wymagany dla zamówień na miejscu');
    }

    // Validate items
    if (data.items.length === 0) {
      throw new Error('Zamówienie musi zawierać przynajmniej jeden produkt');
    }

    // Validate item prices
    for (const item of data.items) {
      if (item.price <= 0) {
        throw new Error(`Cena produktu "${item.name}" musi być większa od 0`);
      }
    }

    return this.ordersRepo.create(data);
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusInput, userId?: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new AppError(`Zamówienie o ID ${id} nie zostało znalezione`, 404);
    }

    // AUTO-COMPLETE: If order is DELIVERED and paymentMethod is being set,
    // automatically change status to COMPLETED (moves to historical)
    if (order.status === 'DELIVERED' && data.paymentMethod && !data.status) {
      console.log('✅ Auto-completing DELIVERED order with payment method');
      data.status = OrderStatus.COMPLETED;
    }
    
    // AUTO-COMPLETE: If status is being set to DELIVERED and paymentMethod is also being set,
    // automatically change status to COMPLETED (moves to historical immediately)
    if (data.status === OrderStatus.DELIVERED && data.paymentMethod) {
      console.log('✅ Auto-completing order: DELIVERED + payment method -> COMPLETED');
      data.status = OrderStatus.COMPLETED;
    }

    // Validate status transition only if status is being updated
    if (data.status && !this.isValidStatusTransition(order.status as OrderStatus, data.status)) {
      throw new AppError(`Nieprawidłowe przejście statusu z ${order.status} na ${data.status}`, 400);
    }

    // Build update data - ensure paymentMethod is preserved when status changes to COMPLETED
    const updateData: any = {};
    
    // Always preserve paymentMethod if it's provided
    if (data.paymentMethod) {
      updateData.paymentMethod = data.paymentMethod;
      console.log('💰 Payment method set:', data.paymentMethod);
    }
    
    // If status is being updated, include it
    if (data.status) {
      updateData.status = data.status;
      console.log('📝 Status updated to:', data.status);
    }

    // If order is being completed and we have userId, ensure completedById is set
    // This is important for empapp to track which driver completed the order
    if (userId && data.status) {
      const completedStatuses = ['COMPLETED', 'DELIVERED'];
      if (completedStatuses.includes(data.status)) {
        updateData.completedBy = updateData.completedBy || {
          id: userId,
          name: '',
          role: 'DRIVER'
        };
        console.log('✅ Setting completedById:', userId);
    }
    }

    console.log('💾 Final updateData:', JSON.stringify(updateData, null, 2));

    return this.ordersRepo.updateStatus(id, updateData);
  }

  async updateOrder(id: string, data: any) {
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new Error(`Zamówienie o ID ${id} nie zostało znalezione`);
    }

    // Validate delivery address for delivery orders only if type is being changed to DELIVERY
    if (data.type === 'DELIVERY' && data.customer && !data.customer.address) {
      throw new Error('Adres dostawy jest wymagany dla zamówień typu dostawa');
    }

    // Validate items only if items are being updated
    if (data.items && data.items.length === 0) {
      throw new Error('Zamówienie musi zawierać przynajmniej jeden produkt');
    }

    // Validate item prices only if items are being updated
    if (data.items) {
      for (const item of data.items) {
        if (item.price <= 0) {
          throw new Error(`Cena produktu "${item.name}" musi być większa od 0`);
        }
      }
    }

    return this.ordersRepo.updateOrder(id, data);
  }

  async deleteOrder(id: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) {
      throw new Error(`Zamówienie o ID ${id} nie zostało znalezione`);
    }

    return this.ordersRepo.delete(id);
  }

  async getOrdersWithGeo() {
    return this.ordersRepo.getOrdersWithGeo();
  }

  async getOrdersForMap() {
    return this.ordersRepo.findOrdersForMap();
  }

  async getOrderSummary(filters: OrderSummaryFilters): Promise<OrderSummaryResponse> {
    return this.ordersRepo.getOrderSummary(filters);
  }

  async assignEmployee(orderId: string, employeeId: string) {
    // Zoptymalizowane - wykonuje tylko jedno zapytanie do bazy
    return this.ordersRepo.assignEmployeeOptimized(orderId, employeeId);
  }

  async unassignEmployee(orderId: string) {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new Error(`Zamówienie o ID ${orderId} nie zostało znalezione`);
    }

    // Only allow unassignment for delivery orders
    if (order.type !== 'DELIVERY') {
      throw new Error('Usuwanie pracownika jest możliwe tylko dla zamówień typu dostawa');
    }

    // When driver is unassigned, move order back to an assignable state
    // If kierowca był już w trasie, utrzymaj status READY, w przeciwnym razie wróć do OPEN
    const normalizedStatus = (order.status || '').toUpperCase();
    const nextStatus = normalizedStatus === 'ON_THE_WAY' || normalizedStatus === 'READY'
      ? 'READY'
      : 'OPEN';

    return this.ordersRepo.unassignEmployee(orderId, nextStatus);
  }

  async restoreOrder(orderId: string) {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new Error(`Zamówienie o ID ${orderId} nie zostało znalezione`);
    }

    // Only allow restoring from COMPLETED or CANCELLED status
    if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
      throw new Error('Można przywrócić tylko zamówienia o statusie Zrealizowane lub Anulowane');
    }

    return this.ordersRepo.restoreOrder(orderId);
  }

  async setTestStatus(orderId: string, status: string) {
    return this.ordersRepo.updateStatus(orderId, { status });
  }

  private isValidStatusTransition(from: OrderStatus, to: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.OPEN]: [OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.ASSIGNED, OrderStatus.PENDING],
      [OrderStatus.PENDING]: [OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.ASSIGNED],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.OPEN, OrderStatus.READY, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.ASSIGNED],
      [OrderStatus.READY]: [OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.ASSIGNED, OrderStatus.ON_THE_WAY],
      [OrderStatus.ASSIGNED]: [OrderStatus.ON_THE_WAY, OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      [OrderStatus.ON_THE_WAY]: [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED], // DELIVERED can go to COMPLETED or CANCELLED
      [OrderStatus.COMPLETED]: [OrderStatus.HISTORICAL], // Allow moving to historical
      [OrderStatus.CANCELLED]: [OrderStatus.HISTORICAL], // Allow moving to historical
      [OrderStatus.HISTORICAL]: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }
}
