import { PrismaClient } from '@prisma/client';
import { OrdersFilters, OrderSummaryFilters, OrderSummaryResponse, OrderStatus } from '../types/local';
import { AppError } from '../middlewares/errorHandler';
import { dlog } from '../lib/logger';

export class OrdersRepository {
  constructor(private prisma: PrismaClient) {}

  // Helper function to parse JSON fields in order items - optimized
  private parseOrderItems<T extends { items?: unknown }>(order: T) {
    if (!order) return order;

    const typedOrder = order;

    // Ensure items is always an array (even if null/undefined)
    if (!typedOrder.items) {
      typedOrder.items = [];
    }

    if (Array.isArray(typedOrder.items)) {
      try {
        typedOrder.items = typedOrder.items.map((item: unknown) => {
          if (!item || typeof item !== 'object') return item;

          const typedItem = item as Record<string, unknown>;

          // Only parse JSON fields that exist and are strings
          const parsedItem: Record<string, unknown> = { ...typedItem };

          // Parse JSON strings
          if (typeof typedItem.addons === 'string') {
            parsedItem.addons = this.safeJsonParse(typedItem.addons);
          }
          if (typeof typedItem.ingredients === 'string') {
            parsedItem.ingredients = this.safeJsonParse(typedItem.ingredients);
          }
          if (typeof typedItem.addedIngredients === 'string') {
            parsedItem.addedIngredients = this.safeJsonParse(typedItem.addedIngredients);
          }
          if (typeof typedItem.removedIngredients === 'string') {
            parsedItem.removedIngredients = this.safeJsonParse(typedItem.removedIngredients);
          }
          if (typeof typedItem.selectedSize === 'string') {
            parsedItem.selectedSize = this.safeJsonParse(typedItem.selectedSize);
          }
          if (typeof typedItem.leftHalf === 'string') {
            parsedItem.leftHalf = this.safeJsonParse(typedItem.leftHalf);
          }
          if (typeof typedItem.rightHalf === 'string') {
            parsedItem.rightHalf = this.safeJsonParse(typedItem.rightHalf);
          }

          // Normalize null arrays to empty arrays for API compatibility
          if (parsedItem.addons === null) parsedItem.addons = [];
          if (parsedItem.ingredients === null) parsedItem.ingredients = [];
          if (parsedItem.addedIngredients === null) parsedItem.addedIngredients = [];
          if (parsedItem.removedIngredients === null) parsedItem.removedIngredients = [];

          return parsedItem;
        });
      } catch (error) {
        console.error('Error parsing order items:', error);
        // Return order with original items if parsing fails
      }
    }

    return typedOrder;
  }

  // Helper function to safely parse JSON - optimized
  private safeJsonParse(value: string): unknown {
    if (!value || typeof value !== 'string') return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      // Only log error in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to parse JSON:', value, error);
      }
      return null;
    }
  }

  async findAll(filters: OrdersFilters, includeItems: boolean = false) {
    const { page = 1, limit = 20, status, type, assignedEmployeeId, dateFrom, dateTo, search } = filters;

    const where: Record<string, unknown> = {};

    if (type) {
      where.type = type;
    }

    if (assignedEmployeeId !== undefined) {
      if (assignedEmployeeId === null) {
        // Filter for unassigned orders (assignedEmployeeId is null)
        where.assignedEmployeeId = null;
      } else {
        // Filter for specific employee
      where.assignedEmployeeId = assignedEmployeeId;
      }
    }

    if (status) {
      if (status === 'HISTORICAL') {
        where.status = {
          in: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        };
      } else if (Array.isArray(status)) {
        // Obsługa array statusów (dla wielu statusów jednocześnie)
        where.status = {
          in: status
        };
      } else {
        // Pojedynczy status
        where.status = status;
      }
    } else {
      where.status = {
        notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
      };
    }

    // Add date filters
    if (dateFrom || dateTo) {
      where.createdAt = {} as Record<string, unknown>;
      if (dateFrom) {
        // Start of day for dateFrom
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        (where.createdAt as Record<string, unknown>).gte = fromDate;
      }
      if (dateTo) {
        // End of day for dateTo
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, unknown>).lte = toDate;
      }
    }

    // Add search filter
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    try {
      // Optimize query by using select only needed fields
      const selectFields = {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        total: true,
        notes: true,
        tableNumber: true,
        promisedTime: true,
        paymentMethod: true,
        createdAt: true,
        updatedAt: true,
        customerId: true,
        assignedEmployeeId: true,
        completedById: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        assignedEmployee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        delivery: {
          select: {
            id: true,
            addressId: true,
            estimatedTime: true,
            address: {
              select: {
                id: true,
                street: true,
                city: true,
                postalCode: true,
                latitude: true,
                longitude: true
              }
            }
          }
        }
      };

      // Only include items if specifically requested
      if (includeItems) {
        (selectFields as unknown as { items?: unknown }).items = {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
            total: true,
            addons: true,
            ingredients: true,
            addedIngredients: true,
            removedIngredients: true,
            isHalfHalf: true,
            selectedSize: true,
            leftHalf: true,
            rightHalf: true,
            notes: true
          }
        };
      }

      const [orders, total] = await Promise.all([
        this.prisma.order.findMany({
          where,
          select: selectFields,
          orderBy: {
            createdAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        }),
        this.prisma.order.count({ where })
      ]);

      // Parse JSON fields for items in each order only if needed
      let parsedOrders = orders;
      if (includeItems && orders && Array.isArray(orders)) {
        try {
          type OrderRow = (typeof orders)[number];
          type OrderRowWithItems = OrderRow & { items?: unknown };

          parsedOrders = (orders as OrderRowWithItems[]).map((order) => {
            try {
              return this.parseOrderItems(order);
            } catch (error) {
              console.error('Error parsing order items for order:', (order as { id?: string }).id || 'unknown', error);
              return order; // Return original order if parsing fails
            }
          }) as typeof orders;
        } catch (error) {
          console.error('Error parsing orders:', error);
          parsedOrders = orders; // Return original orders if parsing fails
        }
      }

      return {
        orders: parsedOrders || [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('OrdersRepository.findAll - database error:', error);
      throw error;
    }
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });

    return this.parseOrderItems(order);
  }

  async create(data: Record<string, unknown>) {
    const typed = data as {
      status?: unknown;
      type?: unknown;
      notes?: unknown;
      tableNumber?: unknown;
      promisedTime?: unknown;
      assignedEmployeeId?: unknown;
      customer?: {
        name?: unknown;
        phone?: unknown;
        email?: unknown;
        address?: {
          street?: unknown;
          city?: unknown;
          postalCode?: unknown;
          latitude?: unknown;
          longitude?: unknown;
        };
      };
      items?: unknown;
    };

    const items = Array.isArray(typed.items) ? (typed.items as Array<{ quantity?: number; price?: number }>) : [];
    const total = this.calculateTotal(items.map((i) => ({ quantity: Number(i.quantity ?? 1), price: Number(i.price ?? 0) })));

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        name: String(typed.customer?.name ?? ''),
        phone: String(typed.customer?.phone ?? ''),
        email: String(typed.customer?.email ?? ''),
      }
    });

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        status: String(typed.status ?? 'OPEN'),
        type: String(typed.type ?? ''),
        total,
        notes: (typed.notes as unknown as string | undefined) ?? undefined,
        tableNumber: (typed.tableNumber as unknown as string | undefined) ?? undefined,
        promisedTime: Number(typed.promisedTime ?? 30),
        customerId: customer.id,
        assignedEmployeeId: (typed.assignedEmployeeId as unknown as string | undefined) ?? undefined,
        items: {
          create: (data.items as unknown[]).map((item: unknown) => {
            const typed = item as Record<string, unknown>;
            return {
            name: String(typed.name ?? ''),
            quantity: Number(typed.quantity ?? 1),
            price: Number(typed.price ?? 0),
            total: Number(typed.quantity ?? 1) * Number(typed.price ?? 0),
            addons: typed.addons ? JSON.stringify(typed.addons) : null,
            ingredients: typed.ingredients ? JSON.stringify(typed.ingredients) : null,
            addedIngredients: typed.addedIngredients ? JSON.stringify(typed.addedIngredients) : null,
            removedIngredients: typed.removedIngredients ? JSON.stringify(typed.removedIngredients) : null,
            isHalfHalf: Boolean(typed.isHalfHalf),
            selectedSize: typed.selectedSize ? JSON.stringify(typed.selectedSize) : null,
            leftHalf: typed.leftHalf ? JSON.stringify(typed.leftHalf) : null,
            rightHalf: typed.rightHalf ? JSON.stringify(typed.rightHalf) : null,
            notes: (typed.notes as unknown as string | null) ?? null,
          };
          })
        },
        ...(typed.type === 'DELIVERY' && typed.customer?.address && {
          delivery: {
            create: {
              address: {
                create: {
                  street: String(typed.customer.address.street ?? ''),
                  city: String(typed.customer.address.city ?? ''),
                  postalCode: String(typed.customer.address.postalCode ?? ''),
                  latitude: typed.customer.address.latitude === undefined ? undefined : Number(typed.customer.address.latitude),
                  longitude: typed.customer.address.longitude === undefined ? undefined : Number(typed.customer.address.longitude),
                }
              }
            }
          }
        })
      },
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });

    return this.parseOrderItems(order);
  }

  async updateStatus(id: string, statusData: Record<string, unknown>) {
    // Sprawdź status zamówienia przed aktualizacją
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
      select: { status: true, paymentMethod: true }
    });

    if (!existingOrder) {
      throw new AppError(`Zamówienie o podanym ID nie zostało znalezione`, 404);
    }

    dlog('🔄 Updating order status:', {
      orderId: id,
      currentStatus: existingOrder.status,
      currentPaymentMethod: existingOrder.paymentMethod,
      updateData: statusData
    });

    // Transform completedBy object to completedById if needed
    const updateData = { ...statusData } as Record<string, unknown>;
    if (updateData.completedBy && typeof updateData.completedBy === 'object') {
      updateData.completedById = (updateData.completedBy as { id?: string }).id;
      delete updateData.completedBy;
    }

    // Nie aktualizuj paymentMethod dla zamówień anulowanych
    if (updateData.paymentMethod && existingOrder.status === 'CANCELLED') {
      dlog('⚠️ Skipping paymentMethod update for CANCELLED order');
      delete updateData.paymentMethod;
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });

    dlog('✅ Order updated:', {
      orderId: id,
      newStatus: order.status,
      newPaymentMethod: order.paymentMethod,
      completedById: order.completedById
    });

    return this.parseOrderItems(order);
  }

  async updateOrder(id: string, data: Record<string, unknown>) {
    dlog('🔄 updateOrder called with data:', data);
    dlog('🔄 Items data:', data.items);
    if (data.items) {
      (data.items as unknown[]).forEach((item: unknown, index: number) => {
        const typed = item as Record<string, unknown>;
        dlog(`🔄 Item ${index}:`, typed.name);
        dlog(`  - selectedSize:`, typed.selectedSize);
        dlog(`  - removedIngredients:`, typed.removedIngredients);
        dlog(`  - addons:`, typed.addons);
      });
    }
    
    // Get existing order to check what needs to be updated
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: true }
    });
    
    if (!existingOrder) {
      throw new Error(`Order with id ${id} not found`);
    }
    
    // Prepare update data for order
    const orderUpdateData: Record<string, unknown> = {};
    
    // Update basic order fields
    if (data.type !== undefined) orderUpdateData.type = data.type;
    if (data.tableNumber !== undefined) orderUpdateData.tableNumber = data.tableNumber;
    if (data.promisedTime !== undefined) orderUpdateData.promisedTime = data.promisedTime;
    // Nie aktualizuj paymentMethod dla zamówień anulowanych
    if (data.paymentMethod !== undefined && existingOrder.status !== 'CANCELLED') {
      orderUpdateData.paymentMethod = data.paymentMethod;
    }
    if (data.notes !== undefined) orderUpdateData.notes = data.notes;
    
    // Handle type change - remove delivery address and assigned driver for non-delivery orders
    if (data.type !== undefined && data.type !== 'DELIVERY') {
      dlog('🚚 Type changed to non-delivery, removing address and driver');
      
      // Remove delivery address if exists
      const existingDelivery = await this.prisma.delivery.findUnique({
        where: { orderId: id }
      });
      
      if (existingDelivery) {
        dlog('🗑️ Removing delivery address');
        
        // Check if address is used by other deliveries
        const addressUsageCount = await this.prisma.delivery.count({
          where: { addressId: existingDelivery.addressId }
        });
        
        // Delete delivery record
        await this.prisma.delivery.delete({
          where: { orderId: id }
        });
        
        // If address is not used by other deliveries, delete it
        if (addressUsageCount <= 1) {
          dlog('🗑️ Deleting unused address');
          await this.prisma.address.delete({
            where: { id: existingDelivery.addressId }
          });
        }
      }
      
      // Remove assigned driver
      if (existingOrder.assignedEmployeeId) {
        dlog('👨‍💼 Removing assigned driver');
        orderUpdateData.assignedEmployeeId = null;
      }
    }
    
    // Handle customer update
    if (data.customer) {
      const customer = data.customer as {
        name?: unknown;
        phone?: unknown;
        email?: unknown;
      };
      dlog('👤 Updating customer:', customer);
      await this.prisma.customer.update({
        where: { id: existingOrder.customerId },
        data: {
          name: String(customer.name ?? ''),
          phone: String(customer.phone ?? ''),
          email: customer.email ? String(customer.email) : null
        }
      });
    }
    
    // Handle items update
    if (data.items && Array.isArray(data.items)) {
      dlog('📦 Updating items:', data.items);
      
      // Delete existing items
      await this.prisma.orderItem.deleteMany({
        where: { orderId: id }
      });
      
      // Create new items
      await this.prisma.orderItem.createMany({
        data: (data.items as unknown[]).map((item: unknown) => {
          const typed = item as Record<string, unknown>;
          return {
          name: String(typed.name ?? ''),
          quantity: Number(typed.quantity ?? 1),
          price: Number(typed.price ?? 0),
          total: Number(typed.quantity ?? 1) * Number(typed.price ?? 0),
          orderId: id,
          addons: typed.addons ? JSON.stringify(typed.addons) : null,
          ingredients: typed.ingredients ? JSON.stringify(typed.ingredients) : null,
          addedIngredients: typed.addedIngredients ? JSON.stringify(typed.addedIngredients) : null,
          removedIngredients: typed.removedIngredients ? JSON.stringify(typed.removedIngredients) : null,
          isHalfHalf: Boolean(typed.isHalfHalf),
          selectedSize: typed.selectedSize ? JSON.stringify(typed.selectedSize) : null,
          leftHalf: typed.leftHalf ? JSON.stringify(typed.leftHalf) : null,
          rightHalf: typed.rightHalf ? JSON.stringify(typed.rightHalf) : null,
          notes: (typed.notes as unknown as string | null) ?? null,
        };
        })
      });
      
      // Recalculate total
      orderUpdateData.total = this.calculateTotal(data.items);
    }
    
    // Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: orderUpdateData,
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });
    
    // Parse JSON fields for items
    if (updatedOrder && updatedOrder.items) {
      updatedOrder.items = updatedOrder.items.map(item => ({
        ...item,
        addons: item.addons ? JSON.parse(item.addons as string) : null,
        ingredients: item.ingredients ? JSON.parse(item.ingredients as string) : null,
        addedIngredients: item.addedIngredients ? JSON.parse(item.addedIngredients as string) : null,
        removedIngredients: item.removedIngredients ? JSON.parse(item.removedIngredients as string) : null,
        selectedSize: item.selectedSize ? JSON.parse(item.selectedSize as string) : null,
        leftHalf: item.leftHalf ? JSON.parse(item.leftHalf as string) : null,
        rightHalf: item.rightHalf ? JSON.parse(item.rightHalf as string) : null,
      }));
    }

    dlog('✅ Order updated successfully:', updatedOrder.id);
    return updatedOrder;
  }

  async delete(id: string) {
    return this.prisma.order.delete({
      where: { id }
    });
  }

  async getOrdersWithGeo() {
    const orders = await this.prisma.order.findMany({
      where: {
        type: 'DELIVERY',
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        }
      },
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });
    
    // Parse JSON fields for items in each order
    return orders.map(order => this.parseOrderItems(order));
  }

  async findOrdersForMap() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          notIn: ['COMPLETED', 'CANCELLED']
        }
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        type: true,
        total: true,
        createdAt: true,
        tableNumber: true,
        assignedEmployeeId: true,
        paymentMethod: true, // Dodano dla lepszej wydajności
        assignedEmployee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        customer: {
          select: {
            name: true,
            phone: true
          }
        },
        items: {
          select: {
            name: true,
            quantity: true,
            price: true,
            total: true,
            addons: true,
            ingredients: true,
            addedIngredients: true,
            removedIngredients: true,
            isHalfHalf: true,
            selectedSize: true,
            leftHalf: true,
            rightHalf: true,
            notes: true
          }
        },
        delivery: {
          select: {
            address: {
              select: {
                latitude: true,
                longitude: true,
                street: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      // Dodano limit dla lepszej wydajności
      take: 100
    });
    
    // Parse JSON fields for items in each order
    return orders.map(order => this.parseOrderItems(order));
  }

  async assignEmployee(id: string, employeeId: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { 
        assignedEmployeeId: employeeId,
        status: 'ASSIGNED' // Zmień status z OPEN na ASSIGNED
      },
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });
    
    return this.parseOrderItems(order);
  }

  // Zoptymalizowana metoda przypisywania kierowcy
  async assignEmployeeOptimized(orderId: string, employeeId: string) {
    // Wykonuje walidację i aktualizację w jednym zapytaniu
    const result = await this.prisma.$transaction(async (tx) => {
      // Sprawdź czy zamówienie istnieje i czy można przypisać kierowcę
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { 
          id: true, 
          type: true, 
          status: true,
          assignedEmployeeId: true
        }
      });

      if (!existingOrder) {
        throw new Error(`Zamówienie o ID ${orderId} nie zostało znalezione`);
      }

      // Sprawdź czy zamówienie nie jest zakończone
      if (existingOrder.status === 'COMPLETED' || existingOrder.status === 'CANCELLED') {
        throw new Error('Nie można przypisać kierowcy do zakończonego zamówienia');
      }

      // Sprawdź czy typ zamówienia pozwala na przypisanie
      // DELIVERY wymaga przypisania, ale można też przypisać inne typy dla śledzenia
      if (existingOrder.type !== 'DELIVERY' && existingOrder.type !== 'TAKEAWAY' && existingOrder.type !== 'DINE_IN') {
        console.error(`❌ [assignEmployeeOptimized] Invalid order type: ${existingOrder.type}`);
        throw new Error(`Nie można przypisać zamówienia: nieprawidłowy typ zamówienia (${existingOrder.type})`);
      }
      
      dlog(`ℹ️ [assignEmployeeOptimized] Order type: ${existingOrder.type}, status: ${existingOrder.status}`);

      // Sprawdź czy zamówienie już jest przypisane do tego samego pracownika
      if (existingOrder.assignedEmployeeId === employeeId) {
        throw new Error('Zamówienie jest już przypisane do tego pracownika');
      }

      // Sprawdź czy pracownik istnieje
      const employee = await tx.employee.findUnique({
        where: { id: employeeId },
        select: { id: true, role: true, name: true }
      });

      if (!employee) {
        console.error(`❌ [assignEmployeeOptimized] Employee not found: ${employeeId}`);
        throw new Error('Pracownik nie został znaleziony');
      }

      dlog(`ℹ️ [assignEmployeeOptimized] Employee found: ${employee.name}, role: ${employee.role}`);

      // Allow DRIVER, EMPLOYEE, and MANAGER roles to claim orders
      // DRIVER for delivery orders, EMPLOYEE/MANAGER for general orders and management
      const allowedRoles = ['DRIVER', 'EMPLOYEE', 'MANAGER'];
      if (!allowedRoles.includes(employee.role)) {
        console.error(`❌ [assignEmployeeOptimized] Invalid role: ${employee.role}`);
        throw new Error(`Nie można przypisać zamówienia: nieprawidłowa rola (${employee.role}). Wymagane: DRIVER, EMPLOYEE lub MANAGER`);
      }

      // Aktualizuj zamówienie - przypisz pracownika i zmień status na ASSIGNED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { 
          assignedEmployeeId: employeeId,
          status: 'ASSIGNED' // Zmień status z OPEN na ASSIGNED
        },
        include: {
          customer: true,
          items: true,
          delivery: {
            include: {
              address: true
            }
          },
          assignedEmployee: true
        }
      });
      return updatedOrder;
    });

    return this.parseOrderItems(result);
  }

  async unassignEmployee(id: string, nextStatus: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { 
        assignedEmployeeId: null,
        status: nextStatus,
      },
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });
    return this.parseOrderItems(order);
  }

  async restoreOrder(id: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: 'OPEN' },
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });
    return this.parseOrderItems(order);
  }

  async setTestStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        items: true,
        delivery: {
          include: {
            address: true
          }
        },
        assignedEmployee: true
      }
    });
    return this.parseOrderItems(order);
  }

  async getOrderSummary(filters: OrderSummaryFilters): Promise<OrderSummaryResponse> {
    const { dateFrom, dateTo, employeeId } = filters;
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (dateFrom || dateTo) {
      where.createdAt = {} as Record<string, unknown>;
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
    }
    
    if (employeeId) {
      where.assignedEmployeeId = employeeId;
    }

    // Get orders from database - only needed fields for summary
    const orders = await this.prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        type: true,
        total: true,
        paymentMethod: true,
        createdAt: true,
        assignedEmployeeId: true,
        assignedEmployee: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Calculate summary
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group by status
    const ordersByStatus: Record<string, number> = {};
    orders.forEach(order => {
      const status = order.status || 'OPEN';
      ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
    });

    // Group by type
    const ordersByType: Record<string, number> = {};
    orders.forEach(order => {
      const type = order.type || 'DELIVERY';
      ordersByType[type] = (ordersByType[type] || 0) + 1;
    });

    // Group by payment method
    const ordersByPaymentMethod: Record<string, number> = {};
    orders.forEach(order => {
      const paymentMethod = order.paymentMethod || 'CASH';
      ordersByPaymentMethod[paymentMethod] = (ordersByPaymentMethod[paymentMethod] || 0) + 1;
    });

    // Top employees
    const employeeStats = new Map<string, { name: string; orderCount: number; revenue: number }>();
    orders.forEach(order => {
      if (order.assignedEmployee) {
        const employeeId = order.assignedEmployee.id;
        const existing = employeeStats.get(employeeId);
        if (existing) {
          existing.orderCount++;
          existing.revenue += order.total;
        } else {
          employeeStats.set(employeeId, {
            name: order.assignedEmployee.name,
            orderCount: 1,
            revenue: order.total
          });
        }
      }
    });

    const topEmployees = Array.from(employeeStats.entries()).map(([id, stats]) => ({
      id,
      name: stats.name,
      orderCount: stats.orderCount,
      revenue: stats.revenue
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Oblicz szczegółowe metryki dla zrealizowanych zamówień
    // Zrealizowane = zamówienia ze statusem COMPLETED
    const completedOrders = orders.filter(order => order.status === 'COMPLETED');
    const uncompletedOrders = orders.filter(order => order.status !== 'COMPLETED');
    
    const completedOrdersData = {
      all: { count: completedOrders.length, total: completedOrders.reduce((sum, order) => sum + order.total, 0) },
      cash: { 
        count: completedOrders.filter(order => order.paymentMethod === 'CASH').length, 
        total: completedOrders.filter(order => order.paymentMethod === 'CASH').reduce((sum, order) => sum + order.total, 0) 
      },
      card: { 
        count: completedOrders.filter(order => order.paymentMethod === 'CARD').length, 
        total: completedOrders.filter(order => order.paymentMethod === 'CARD').reduce((sum, order) => sum + order.total, 0) 
      },
      paid: { 
        count: completedOrders.filter(order => order.paymentMethod && order.paymentMethod !== 'CASH' && order.paymentMethod !== 'CARD').length, 
        total: completedOrders.filter(order => order.paymentMethod && order.paymentMethod !== 'CASH' && order.paymentMethod !== 'CARD').reduce((sum, order) => sum + order.total, 0) 
      },
      discounts: { count: 0, total: 0 }, // TODO: Implement when discount field is added
      deliveries: { 
        count: completedOrders.filter(order => order.type === 'DELIVERY').length, 
        total: completedOrders.filter(order => order.type === 'DELIVERY').reduce((sum, order) => sum + order.total, 0) 
      },
      serviceFees: { count: 0, total: 0 }, // TODO: Implement when service fee field is added
      tips: { count: 0, total: 0 }, // TODO: Implement when tip field is added
    };

    const uncompletedOrdersData = {
      inProgress: { 
        count: uncompletedOrders.filter(order => order.status !== 'CANCELLED').length, 
        total: uncompletedOrders.filter(order => order.status !== 'CANCELLED').reduce((sum, order) => sum + order.total, 0) 
      },
      cancelled: { 
        count: uncompletedOrders.filter(order => order.status === 'CANCELLED').length, 
        total: uncompletedOrders.filter(order => order.status === 'CANCELLED').reduce((sum, order) => sum + order.total, 0) 
      },
    };

    // Oblicz dane dla konkretnych pracowników
    const employeeData = new Map<string, {
      name: string;
      role: string;
      completedOrders: typeof completedOrdersData;
      uncompletedOrders: typeof uncompletedOrdersData;
    }>();

    // Dodaj dane dla każdego pracownika
    orders.forEach(order => {
      const employeeId = order.assignedEmployeeId || 'unassigned';
      const employeeName = order.assignedEmployee?.name || 'Nieprzypisane zamówienia';
      const role = order.assignedEmployee?.role || '';

      if (!employeeData.has(employeeId)) {
        employeeData.set(employeeId, {
          name: employeeName,
          role: role,
          completedOrders: {
            all: { count: 0, total: 0 },
            cash: { count: 0, total: 0 },
            card: { count: 0, total: 0 },
            paid: { count: 0, total: 0 },
            discounts: { count: 0, total: 0 },
            deliveries: { count: 0, total: 0 },
            serviceFees: { count: 0, total: 0 },
            tips: { count: 0, total: 0 },
          },
          uncompletedOrders: {
            inProgress: { count: 0, total: 0 },
            cancelled: { count: 0, total: 0 },
          },
        });
      }

      const employee = employeeData.get(employeeId)!;
      const isCompleted = order.status === 'COMPLETED';
      const isInProgress = order.status !== 'COMPLETED' && order.status !== 'CANCELLED';
      const isCancelled = order.status === 'CANCELLED';

      if (isCompleted) {
        employee.completedOrders.all.count++;
        employee.completedOrders.all.total += order.total;

        if (order.paymentMethod === 'CASH') {
          employee.completedOrders.cash.count++;
          employee.completedOrders.cash.total += order.total;
        } else if (order.paymentMethod === 'CARD') {
          employee.completedOrders.card.count++;
          employee.completedOrders.card.total += order.total;
        } else if (order.paymentMethod && order.paymentMethod !== 'CASH' && order.paymentMethod !== 'CARD') {
          employee.completedOrders.paid.count++;
          employee.completedOrders.paid.total += order.total;
        }

        if (order.type === 'DELIVERY') {
          employee.completedOrders.deliveries.count++;
          employee.completedOrders.deliveries.total += order.total;
        }
      } else if (isInProgress) {
        employee.uncompletedOrders.inProgress.count++;
        employee.uncompletedOrders.inProgress.total += order.total;
      } else if (isCancelled) {
        employee.uncompletedOrders.cancelled.count++;
        employee.uncompletedOrders.cancelled.total += order.total;
      }
    });

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      ordersByType,
      ordersByPaymentMethod,
      topEmployees,
      completedOrders: completedOrdersData,
      uncompletedOrders: uncompletedOrdersData,
      employeeData: Array.from(employeeData.entries()).map(([id, data]) => ({
        id,
        ...data
      })),
    };
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  private calculateTotal(items: Array<{ quantity: number; price: number }>): number {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }
}