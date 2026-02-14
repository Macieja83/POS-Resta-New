import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { UpdateOrderRequest, OrderType, OrderItem, PaymentMethod, Order } from '../../types/shared';
import { menuApi, Dish as MenuItem } from '../../api/menu';
import { geocodeAddress, searchAddressSuggestions, AddressSuggestion } from '../../utils/geocoding';
import { AddressAutocomplete } from './AddressAutocomplete';
import { deliveryZonesApi, DeliveryZone } from '../../api/deliveryZones';
import { ReceiptPrinter } from './ReceiptPrinter';
import './OrderCreator.css';

interface OrderCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  editOrder?: Order; // Zamówienie do edycji
  onOrderCreated?: (order: Order) => void; // Callback dla nowego zamówienia
  onOrderUpdated?: (order: Order) => void; // Callback dla zaktualizowanego zamówienia
}

export const OrderCreator: React.FC<OrderCreatorProps> = ({ isOpen, onClose, editOrder, onOrderCreated, onOrderUpdated }) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [selectedItemForAddons, setSelectedItemForAddons] = useState<MenuItem | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<{[addonId: string]: boolean}>({});
  const [selectedIngredients, setSelectedIngredients] = useState<{[ingredientId: string]: boolean}>({});
  const [addonCounts, setAddonCounts] = useState<{[addonId: string]: number}>({});
  const [freeAddonCounts, setFreeAddonCounts] = useState<{[addonId: string]: number}>({});
  const [addonSearchQuery, setAddonSearchQuery] = useState('');
  const [addonItemQuantity, setAddonItemQuantity] = useState(1);
  const [selectedAddonSize, setSelectedAddonSize] = useState<{name: string, price?: number} | null>(null);
  const [isAddonHalfHalfMode, setIsAddonHalfHalfMode] = useState(false);
  
  // Nowe stany dla wieloetapowego procesu wyboru dania
  const [showItemConfigModal, setShowItemConfigModal] = useState(false);
  const [selectedItemForConfig, setSelectedItemForConfig] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<{name: string, price?: number} | null>(null);
  const [_currentStep, setCurrentStep] = useState<'config' | 'summary'>('config');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // Stany dla funkcjonalności pół na pół
  const [isHalfHalfMode, setIsHalfHalfMode] = useState(false);
  const [leftHalfDish, setLeftHalfDish] = useState<MenuItem | null>(null);
  const [rightHalfDish, setRightHalfDish] = useState<MenuItem | null>(null);
  const [halfHalfCategory, setHalfHalfCategory] = useState<string>('');
  
  // Stan dla komentarza do dania
  const [itemNotes, setItemNotes] = useState('');
  const [leftHalfSize, setLeftHalfSize] = useState<{name: string, price?: number} | null>(null);
  const [rightHalfSize, setRightHalfSize] = useState<{name: string, price?: number} | null>(null);
  const [_isGeocoding, setIsGeocoding] = useState(false);
  const [_geocodingError, setGeocodingError] = useState<string | null>(null);
  const [_addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [_showSuggestions, setShowSuggestions] = useState(false);
  const [_isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '+48123456789',
    email: '',
    address: {
      street: '',
      city: 'Słupsk',
      postalCode: '',
      comment: '',
      deliveryPrice: 0,
      latitude: undefined as number | undefined,
      longitude: undefined as number | undefined,
    },
    nip: '',
    orderSource: 'Default',
    pickupType: 'delivery' as 'dine_in' | 'takeaway' | 'delivery',
    paymentMethod: undefined as 'cash' | 'paid' | 'card' | undefined,
    printReceipt: true,
    deliveryType: 'asap' as 'asap' | 'scheduled',
    promisedTime: 30,
    customTime: '',
    scheduledDateTime: new Date().toISOString().slice(0, 16),
    tableNumber: '', // Numer stolika dla zamówień na miejscu
  });

  // Inicjalizacja danych z editOrder
  useEffect(() => {
    // WAŻNE: Ten useEffect powinien się uruchamiać TYLKO gdy modal się otwiera
    if (!isOpen) {
      console.log('🚪 Modal closed - skipping useEffect');
      return;
    }
    
    console.log('🔄 OrderCreator useEffect triggered:', { editOrder: !!editOrder, isOpen, orderItemsCount: orderItems.length });
    
    if (editOrder && isOpen) {
      console.log('🔄 Initializing editOrder:', editOrder);
      console.log('📦 editOrder.items:', editOrder.items);
      console.log('👤 editOrder.customer:', editOrder.customer);
      console.log('🏠 editOrder.type:', editOrder.type);
      console.log('Initializing editOrder with paymentMethod:', editOrder.paymentMethod);
      // Wypełnij dane klienta
      setCustomerData({
        name: editOrder.customer?.name || 'Klient',
        phone: editOrder.customer?.phone || '+48123456789',
        email: editOrder.customer?.email || '',
        address: {
          street: editOrder.delivery?.address?.street || 'Nieznana ulica',
          city: editOrder.delivery?.address?.city || 'Słupsk',
          postalCode: editOrder.delivery?.address?.postalCode || '00-000',
          comment: '',
          deliveryPrice: 0,
          latitude: editOrder.delivery?.address?.latitude,
          longitude: editOrder.delivery?.address?.longitude,
        },
        nip: '',
        orderSource: 'Default',
        pickupType: editOrder.type === 'DELIVERY' ? 'delivery' : 
                   editOrder.type === 'TAKEAWAY' ? 'takeaway' : 
                   editOrder.type === 'DINE_IN' ? 'dine_in' : 'delivery',
        paymentMethod: editOrder.paymentMethod === PaymentMethod.CASH ? 'cash' :
                       editOrder.paymentMethod === PaymentMethod.CARD ? 'card' :
                       editOrder.paymentMethod === PaymentMethod.PAID ? 'paid' :
                       'cash',
        printReceipt: true,
        deliveryType: 'asap',
        promisedTime: Math.max(editOrder.promisedTime || 30, 1),
        customTime: '',
        scheduledDateTime: new Date().toISOString().slice(0, 16),
        tableNumber: editOrder.tableNumber || '1', // Numer stolika z zamówienia - domyślnie 1
      });

      // Wypełnij pozycje zamówienia
      if (editOrder.items) {
        console.log('📦 Mapping editOrder.items:', editOrder.items);
        setOrderItems(editOrder.items.map((item: OrderItem) => {
          console.log('📦 Mapping item:', item);
          const mappedItem = {
            id: `${item.id || 'item'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || 'Nieznane danie',
            quantity: Math.max(item.quantity || 1, 1),
            price: Math.max(item.price || 0, 0.01), // Cena w złotówkach - minimum 0.01
            total: Math.max(item.quantity || 1, 1) * Math.max(item.price || 0, 0.01),
            // Zachowaj wszystkie dodatkowe pola z bazy danych
            addons: item.addons || [],
            ingredients: item.ingredients || [],
            addedIngredients: item.addedIngredients || [],
            removedIngredients: item.removedIngredients || [],
            isHalfHalf: item.isHalfHalf || false,
            selectedSize: item.selectedSize || null,
            leftHalf: item.leftHalf || null,
            rightHalf: item.rightHalf || null,
            notes: item.notes || null
          };
          console.log('📦 Mapped item with all fields:', mappedItem);
          return mappedItem;
        }));
      }
    } else if (!editOrder && isOpen) {
      // Resetuj dane dla nowego zamówienia (ale nie resetuj koszyka jeśli już ma pozycje)
      console.log('🆕 Initializing new order - current orderItems count:', orderItems.length);
      setCustomerData({
        name: '',
        phone: '+48',
        email: '',
        address: {
          street: '',
          city: 'Słupsk',
          postalCode: '',
          comment: '',
          deliveryPrice: 0,
          latitude: undefined,
          longitude: undefined,
        },
        nip: '',
        orderSource: 'Default',
        pickupType: 'delivery',
        paymentMethod: undefined,
        printReceipt: true,
        deliveryType: 'asap',
        promisedTime: 30,
        customTime: '',
        scheduledDateTime: new Date().toISOString().slice(0, 16),
        tableNumber: '', // Numer stolika dla nowego zamówienia
      });
      // Nie resetuj koszyka - pozwól użytkownikowi kontynuować dodawanie dań
      console.log('✅ Keeping existing orderItems:', orderItems);
      // setOrderItems([]);
    }
  }, [editOrder?.id, isOpen]); // Używaj tylko ID zamiast całego obiektu

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () => menuApi.getCategories(),
    enabled: isOpen,
    staleTime: 3 * 60 * 1000,
  });
  const categories = categoriesResponse?.success ? categoriesResponse.data : [];

  const { data: menuItemsResponse, isLoading: menuItemsLoading } = useQuery({
    queryKey: ['menu-items', selectedCategory],
    queryFn: () => selectedCategory ? menuApi.getDishes(selectedCategory) : Promise.resolve({ success: true, data: [] }),
    enabled: isOpen && !!selectedCategory,
    staleTime: 2 * 60 * 1000, // 2 min – przełączanie kategorii bez refetch
  });
  const menuItems = menuItemsResponse?.success ? menuItemsResponse.data : [];

  const { data: allMenuItemsResponse, isLoading: allMenuItemsLoading } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: () => menuApi.getAllDishes(),
    enabled: isOpen,
    staleTime: 2 * 60 * 1000,
  });
  const allMenuItems = allMenuItemsResponse?.success ? allMenuItemsResponse.data : [];

  const { data: deliveryZonesResponse } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => deliveryZonesApi.getZones(),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const deliveryZones = deliveryZonesResponse?.success ? deliveryZonesResponse.data : [];

  const { data: addonGroupsResponse } = useQuery({
    queryKey: ['addon-groups'],
    queryFn: () => menuApi.getAddonGroups(),
    enabled: isOpen,
    staleTime: 3 * 60 * 1000,
  });
  const addonGroups = addonGroupsResponse?.success ? addonGroupsResponse.data : [];

  // Wczytaj konfigurację pół na pół z localStorage
  const [halfHalfConfigs, setHalfHalfConfigs] = useState(() => {
    const saved = localStorage.getItem('halfHalfConfigs');
    return saved ? JSON.parse(saved) : [];
  });

  // Nasłuchuj zmian w localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('halfHalfConfigs');
      if (saved) {
        setHalfHalfConfigs(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('halfHalfConfigsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('halfHalfConfigsUpdated', handleStorageChange);
    };
  }, []);

  type OrdersQueryCache = {
    data?: {
      orders?: Array<{ id: string }>;
      total?: number;
    };
  };

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (response) => {
      const newOrder = response?.data;
      if (newOrder) {
        if (onOrderCreated) onOrderCreated(newOrder);
        window.dispatchEvent(new CustomEvent('orderCreated', { detail: newOrder }));
        // Natychmiastowa aktualizacja listy – nowe zamówienie w cache (bez refetch = bez opóźnienia)
        queryClient.setQueriesData(
          { queryKey: ['orders'] },
          (old: unknown) => {
            const oldCache = old as OrdersQueryCache | undefined;
            if (!oldCache?.data?.orders || oldCache.data.orders.some((o) => o.id === newOrder.id)) return old;
            return {
              ...oldCache,
              data: {
                ...oldCache.data,
                orders: [newOrder, ...oldCache.data.orders],
                total: (oldCache.data.total ?? 0) + 1,
              },
            };
          }
        );
        // Tylko mapa i geo – bez invalidate listy, żeby nie uruchamiać refetch (wolne)
        queryClient.invalidateQueries({ queryKey: ['orders-geo'] });
        queryClient.invalidateQueries({ queryKey: ['orders-map'] });
      }
      setShowReceiptModal(true);
    },
    onError: (error) => {
      console.error('Błąd podczas tworzenia zamówienia:', error);
      alert('Błąd podczas tworzenia zamówienia. Sprawdź konsolę.');
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateOrderRequest> }) =>
      ordersApi.updateOrder(id, data as UpdateOrderRequest),
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-geo'] });
      queryClient.invalidateQueries({ queryKey: ['orders-map'] });

      if (editOrder && response.data) {
        try {
          const refreshedOrder = await ordersApi.getOrderById(editOrder.id);
          if (refreshedOrder.success && refreshedOrder.data) {
            if (onOrderUpdated) onOrderUpdated(refreshedOrder.data);
            window.dispatchEvent(new CustomEvent('orderUpdated', { detail: refreshedOrder.data }));
          }
        } catch (error) {
          console.error('❌ Error refreshing order data:', error);
          // Fallback do response.data jeśli odświeżanie nie powiodło się
          if (onOrderUpdated && response.data) {
            onOrderUpdated(response.data);
          }
          
          // Wyślij globalny event dla synchronizacji między stronami
          window.dispatchEvent(new CustomEvent('orderUpdated', { 
            detail: response.data 
          }));
        }
      } else {
        // Jeśli nie ma editOrder, użyj response.data
        if (onOrderUpdated && response.data) {
          onOrderUpdated(response.data);
        }
        
        // Wyślij globalny event dla synchronizacji między stronami
        if (response.data) {
          window.dispatchEvent(new CustomEvent('orderUpdated', { 
            detail: response.data 
          }));
        }
      }
      
      // Zamknij modal zamówienia
      onClose();
      resetForm();
      
      // Otwórz bon po pomyślnej aktualizacji zamówienia (po zamknięciu modala)
      setTimeout(() => {
        setShowReceiptModal(true);
      }, 100);
    },
    onError: (error) => {
      console.error('Błąd podczas aktualizacji zamówienia:', error);
      alert('Błąd podczas aktualizacji zamówienia. Sprawdź konsolę.');
    }
  });

  useEffect(() => {
    if (categories && categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Synchronizuj konfigurację pół na pół z localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('halfHalfConfigs');
      if (saved) {
        setHalfHalfConfigs(JSON.parse(saved));
      }
    };

    const handleConfigUpdate = (event: CustomEvent) => {
      setHalfHalfConfigs(event.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('halfHalfConfigsUpdated', handleConfigUpdate as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('halfHalfConfigsUpdated', handleConfigUpdate as EventListener);
    };
  }, []);

  const resetForm = () => {
    setOrderItems([]);
    setCustomerData({
      name: '',
      phone: '+48',
      email: '',
      address: {
        street: '',
        city: 'Słupsk',
        postalCode: '',
        comment: '',
        deliveryPrice: 0,
        latitude: undefined,
        longitude: undefined,
      },
      nip: '',
      orderSource: 'Default',
      pickupType: 'delivery',
      paymentMethod: undefined,
      printReceipt: true,
      deliveryType: 'asap',
      promisedTime: 30,
      customTime: '',
      scheduledDateTime: new Date().toISOString().slice(0, 16),
      tableNumber: '', // Numer stolika dla nowego zamówienia
    });
    setSelectedCategory('');
    setSearchQuery('');
    setShowCustomerModal(false);
  };

  const addItemToOrder = useCallback((item: MenuItem) => {
    console.log('🍽️ addItemToOrder called with item:', item);
    console.log('🔍 Checking half-half option for:', item.name, item.categoryId);
    
    // Sprawdź czy pozycja ma opcję pół na pół
    const hasHalfHalf = hasHalfHalfOption(item.name, item.categoryId);
    console.log('✅ Has half-half option:', hasHalfHalf);
    
    if (hasHalfHalf) {
      console.log('🎯 Setting half-half category to:', item.categoryId);
      // Ustaw kategorię pół na pół i otwórz modal z dodatkami w trybie pół na pół
      setHalfHalfCategory(item.categoryId);
      setSelectedItemForAddons(item);
      setSelectedAddons({});
      setAddonSearchQuery('');
      setIsAddonHalfHalfMode(true);
      // Resetuj wybory pół na pół
      setLeftHalfDish(null);
      setRightHalfDish(null);
      setLeftHalfSize(null);
      setRightHalfSize(null);
      // Inicjalizuj składniki jako domyślnie wybrane
      initializeIngredients(item);
      setShowAddonModal(true);
    } else {
      // Sprawdź czy pozycja ma dodatki lub składniki
      const hasAddons = item.addonGroups && item.addonGroups.length > 0;
      const hasIngredients = item.ingredients && item.ingredients.length > 0;
      
      if (hasAddons || hasIngredients) {
        // Otwórz modal z dodatkami
        setSelectedItemForAddons(item);
        setSelectedAddons({});
        setAddonSearchQuery('');
        // Inicjalizuj składniki jako domyślnie wybrane
        initializeIngredients(item);
        setShowAddonModal(true);
      } else {
        // Otwórz modal konfiguracji dania (dla pozycji bez dodatków)
        setSelectedItemForConfig(item);
        setSelectedSize(null);
        setCurrentStep('config');
        setItemQuantity(1);
        setSelectedAddons({});
        setEditingItemId(null);
        setItemNotes('');
        setShowItemConfigModal(true);
      }
    }
  }, []);

  const editItemInOrder = (itemId: string) => {
    console.log('🔧 editItemInOrder called with itemId:', itemId);
    const existingItem = orderItems.find(item => item.id === itemId);
    console.log('🔧 existingItem found:', existingItem);
    if (!existingItem) return;

    // Znajdź oryginalne danie w menu
    const originalItem = allMenuItems?.find(menuItem => 
      existingItem.name.includes(menuItem.name)
    );
    console.log('🔧 originalItem found:', originalItem);
    
    if (!originalItem) return;

    // Sprawdź czy pozycja ma dodatki lub składniki
    const hasAddons = originalItem.addonGroups && originalItem.addonGroups.length > 0;
    const hasIngredients = originalItem.ingredients && originalItem.ingredients.length > 0;
    console.log('🔧 hasAddons:', hasAddons, 'hasIngredients:', hasIngredients);
    
    if (hasAddons || hasIngredients) {
      console.log('🔧 Opening addon modal');
      // Otwórz modal z dodatkami do edycji
      setSelectedItemForAddons(originalItem);
      setAddonItemQuantity(existingItem.quantity);
      setAddonSearchQuery('');

      // Ustaw wybrane dodatki
      const selectedAddonsState: {[addonId: string]: boolean} = {};
      const addonCountsState: {[addonId: string]: number} = {};
      const selectedIngredientsState: {[ingredientId: string]: boolean} = {};
      const freeAddonCountsState: {[addonId: string]: number} = {};
      
      // Inicjalizuj wszystkie oryginalne składniki jako wybrane
      if (originalItem.ingredients) {
        originalItem.ingredients.forEach(ingredient => {
          selectedIngredientsState[ingredient.id] = true;
        });
      }
      
      // Ustaw liczniki płatnych dodatków
      if (existingItem.addons) {
        existingItem.addons.forEach(addon => {
          // Znajdź ID dodatku w grupach dodatków
          for (const group of addonGroups || []) {
            const addonInGroup = group.addonItems?.find(a => a.name === addon.name);
            if (addonInGroup) {
              selectedAddonsState[addonInGroup.id] = true;
              addonCountsState[addonInGroup.id] = addon.quantity || 1;
              break;
            }
          }
        });
      }
      
      // Ustaw liczniki darmowych dodatków
      if (existingItem.addedIngredients) {
        existingItem.addedIngredients.forEach(added => {
          // Sprawdź czy to darmowy dodatek (nie oryginalny składnik)
          if (!originalItem.ingredients?.some(orig => orig.id === added.id)) {
            freeAddonCountsState[added.id] = added.quantity || 1;
          }
        });
      }
      
      // Usuń składniki które zostały usunięte
      if (existingItem.removedIngredients) {
        existingItem.removedIngredients.forEach(removed => {
          selectedIngredientsState[removed.id] = false;
        });
      }
      
      setSelectedAddons(selectedAddonsState);
      setAddonCounts(addonCountsState);
      setSelectedIngredients(selectedIngredientsState);
      setFreeAddonCounts(freeAddonCountsState);
      setEditingItemId(itemId);
      
      // Ustaw wybrany rozmiar na podstawie nazwy pozycji
      const sizeMatch = existingItem.name.match(/(\d+cm)/);
      if (sizeMatch && originalItem.sizes) {
        const sizeName = sizeMatch[1];
        const size = originalItem.sizes.find(s => s.name === sizeName);
        if (size) {
          setSelectedAddonSize(size);
        }
      }
      
      setShowAddonModal(true);
    } else {
      console.log('🔧 Opening config modal');
      // Otwórz modal konfiguracji dania (dla pozycji bez dodatków)
      setSelectedItemForConfig(originalItem);
      setItemQuantity(existingItem.quantity);
      setEditingItemId(itemId);
      setItemNotes(existingItem.notes || '');
      
      // Ustaw wybrany rozmiar na podstawie nazwy pozycji
      const sizeMatch = existingItem.name.match(/(\d+cm)/);
      if (sizeMatch && originalItem.sizes) {
        const sizeName = sizeMatch[1];
        const size = originalItem.sizes.find(s => s.name === sizeName);
        if (size) {
          setSelectedSize(size);
        }
      }
    
    setCurrentStep('config');
    setShowItemConfigModal(true);
    }
  };

  const addItemToOrderWithAddons = (item: MenuItem, addons: {id: string, name: string, price: number, quantity: number}[], ingredients: {id: string, name: string}[] = [], quantity: number = 1, freeAddons: {id: string, name: string, quantity: number}[] = [], selectedSize?: {name: string, price?: number} | null, notes?: string) => {
    // Oblicz które składniki zostały dodane, a które usunięte
    const originalIngredients = item.ingredients || [];
    const selectedIngredientIds = ingredients.map(i => i.id);
    
    // Składniki które użytkownik dodał (nie były w oryginalnym daniu)
    const addedIngredients = ingredients.filter(ingredient => 
      !originalIngredients.some(orig => orig.id === ingredient.id)
    );
    
    // Składniki które użytkownik usunął (były w oryginalnym daniu, ale nie zostały wybrane)
    const removedIngredients = originalIngredients.filter(orig => 
      !selectedIngredientIds.includes(orig.id)
    );
    
    // Połącz darmowe dodatki z oryginalnymi składnikami
    const allAddedIngredients = [...addedIngredients, ...freeAddons];
    
    const sizeKey = selectedSize?.name ?? null;
    const existingItem = orderItems.find(orderItem => 
      orderItem.name === item.name && 
      ((orderItem.selectedSize && orderItem.selectedSize.name) ?? null) === sizeKey &&
      JSON.stringify(orderItem.addons?.map(a => a.id).sort()) === JSON.stringify(addons.map(a => a.id).sort()) &&
      JSON.stringify(orderItem.addedIngredients?.map(i => i.id).sort()) === JSON.stringify(allAddedIngredients.map(i => i.id).sort()) &&
      JSON.stringify(orderItem.removedIngredients?.map(i => i.id).sort()) === JSON.stringify(removedIngredients.map(i => i.id).sort())
    );
    const basePrice = selectedSize ? selectedSize.price : (item.price || 0); // Cena w złotówkach
    const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    const totalPrice = basePrice + addonsTotal; // Składniki nie zmieniają ceny
    
    if (existingItem) {
      setOrderItems(prev => prev.map(orderItem =>
        orderItem.name === item.name && 
        ((orderItem.selectedSize && orderItem.selectedSize.name) ?? null) === sizeKey &&
        JSON.stringify(orderItem.addons?.map(a => a.id).sort()) === JSON.stringify(addons.map(a => a.id).sort()) &&
        JSON.stringify(orderItem.addedIngredients?.map(i => i.id).sort()) === JSON.stringify(allAddedIngredients.map(i => i.id).sort()) &&
        JSON.stringify(orderItem.removedIngredients?.map(i => i.id).sort()) === JSON.stringify(removedIngredients.map(i => i.id).sort())
          ? {
              ...orderItem,
              quantity: orderItem.quantity + quantity,
              total: (orderItem.quantity + quantity) * totalPrice,
              selectedSize: selectedSize ? { name: selectedSize.name, price: selectedSize.price || 0 } : orderItem.selectedSize
            }
          : orderItem
      ));
    } else {
      setOrderItems(prev => [...prev, {
        id: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: item.name,
        quantity: quantity,
        price: totalPrice,
        total: totalPrice * quantity,
        addons: addons,
        addedIngredients: allAddedIngredients,
        removedIngredients: removedIngredients,
        notes: notes,
        selectedSize: selectedSize ? { name: selectedSize.name, price: selectedSize.price || 0 } : undefined,
      }]);
    }
  };


  const _handleAddonToggle = useCallback((addonId: string) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: !prev[addonId]
    }));
  }, []);

  const handleIngredientToggle = useCallback((ingredientId: string) => {
    setSelectedIngredients(prev => ({
      ...prev,
      [ingredientId]: !prev[ingredientId]
    }));
  }, []);

  const handleAddonClick = useCallback((addonId: string) => {
    setAddonCounts(prev => ({
      ...prev,
      [addonId]: (prev[addonId] || 0) + 1
    }));
  }, []);

  const handleFreeAddonClick = useCallback((addonId: string) => {
    setFreeAddonCounts(prev => ({
      ...prev,
      [addonId]: (prev[addonId] || 0) + 1
    }));
  }, []);

  const handleAddonRemove = useCallback((addonId: string) => {
    setAddonCounts(prev => {
      const newCount = Math.max(0, (prev[addonId] || 0) - 1);
      if (newCount === 0) {
        const { [addonId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: newCount };
    });
  }, []);

  const handleFreeAddonRemove = useCallback((addonId: string) => {
    setFreeAddonCounts(prev => {
      const newCount = Math.max(0, (prev[addonId] || 0) - 1);
      if (newCount === 0) {
        const { [addonId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: newCount };
    });
  }, []);

  const handleAddonSizeSelect = useCallback((size: {name: string, price?: number}) => {
    setSelectedAddonSize(size);
  }, []);

  const handleAddonHalfHalfModeToggle = useCallback(() => {
    const newMode = !isAddonHalfHalfMode;
    setIsAddonHalfHalfMode(newMode);
    if (newMode) {
      // Resetuj wybory gdy włączamy tryb pół na pół
      setLeftHalfDish(null);
      setRightHalfDish(null);
      setLeftHalfSize(null);
      setRightHalfSize(null);
    }
  }, [isAddonHalfHalfMode]);

  const handleConfirmAddons = useCallback(() => {
    if (!selectedItemForAddons) return;

    // Sprawdź czy to tryb pół na pół
    if (isAddonHalfHalfMode && leftHalfDish && rightHalfDish) {
      // Tryb pół na pół - utwórz jedną pozycję pół na pół
      const halfHalfItem: OrderItem = {
        id: `half-half-${Date.now()}`,
        name: `${leftHalfDish.name} + ${rightHalfDish.name} (pół na pół)`,
        quantity: addonItemQuantity,
        price: selectedAddonSize ? selectedAddonSize.price : ((leftHalfDish.price + rightHalfDish.price) / 2),
        total: 0,
        isHalfHalf: true,
        selectedSize: selectedAddonSize ? { name: selectedAddonSize.name, price: selectedAddonSize.price } : undefined,
        leftHalf: {
          dishName: leftHalfDish.name,
          addons: [],
          addedIngredients: [],
          removedIngredients: []
        },
        rightHalf: {
          dishName: rightHalfDish.name,
          addons: [],
          addedIngredients: [],
          removedIngredients: []
        }
      };

      // Dodaj płatne dodatki dla lewej połowy
      const leftAddons = Object.entries(addonCounts)
        .filter(([addonId, count]) => addonId.startsWith('left-') && count > 0)
        .map(([addonId, count]) => {
          const cleanId = addonId.replace('left-', '');
        for (const group of addonGroups || []) {
            const addon = group.addonItems?.find(a => a.id === cleanId);
          if (addon) {
            return {
              id: addon.id,
              name: addon.name,
                price: addon.price,
                quantity: count
            };
          }
        }
        return null;
      })
        .filter(Boolean) as {id: string, name: string, price: number, quantity: number}[];

      // Dodaj płatne dodatki dla prawej połowy
      const rightAddons = Object.entries(addonCounts)
        .filter(([addonId, count]) => addonId.startsWith('right-') && count > 0)
        .map(([addonId, count]) => {
          const cleanId = addonId.replace('right-', '');
          for (const group of addonGroups || []) {
            const addon = group.addonItems?.find(a => a.id === cleanId);
            if (addon) {
              return {
                id: addon.id,
                name: addon.name,
                price: addon.price,
                quantity: count
              };
            }
          }
          return null;
        })
        .filter(Boolean) as {id: string, name: string, price: number, quantity: number}[];

      // Dodaj darmowe dodatki dla lewej połowy
      const leftFreeAddons = Object.entries(freeAddonCounts)
        .filter(([addonId, count]) => addonId.startsWith('left-') && count > 0)
        .map(([addonId, count]) => {
          const cleanId = addonId.replace('left-', '');
          for (const group of addonGroups || []) {
            const addon = group.addonItems?.find(a => a.id === cleanId);
            if (addon) {
              return {
                id: addon.id,
                name: addon.name,
                quantity: count
              };
            }
          }
          return null;
        })
        .filter(Boolean) as {id: string, name: string, quantity: number}[];

      // Dodaj darmowe dodatki dla prawej połowy
      const rightFreeAddons = Object.entries(freeAddonCounts)
        .filter(([addonId, count]) => addonId.startsWith('right-') && count > 0)
        .map(([addonId, count]) => {
          const cleanId = addonId.replace('right-', '');
          for (const group of addonGroups || []) {
            const addon = group.addonItems?.find(a => a.id === cleanId);
            if (addon) {
              return {
                id: addon.id,
                name: addon.name,
                quantity: count
              };
            }
          }
          return null;
        })
        .filter(Boolean) as {id: string, name: string, quantity: number}[];

      // Oblicz ceny - połowa ceny dań + połowa ceny płatnych dodatków
      const leftAddonsTotal = leftAddons.reduce((sum, addon) => sum + ((addon.price * addon.quantity) / 2), 0);
      const rightAddonsTotal = rightAddons.reduce((sum, addon) => sum + ((addon.price * addon.quantity) / 2), 0);
      
      // Ustaw dodatki i składniki
      halfHalfItem.leftHalf!.addons = leftAddons.map(addon => ({
        ...addon,
        price: addon.price / 2 // Cena dodatku dzielona na pół
      }));
      halfHalfItem.leftHalf!.addedIngredients = leftFreeAddons;
      halfHalfItem.leftHalf!.removedIngredients = leftHalfDish.ingredients?.filter(ingredient => 
        !leftHalfDish.ingredients?.some(orig => orig.id === ingredient.id)
      ) || [];

      halfHalfItem.rightHalf!.addons = rightAddons.map(addon => ({
        ...addon,
        price: addon.price / 2 // Cena dodatku dzielona na pół
      }));
      halfHalfItem.rightHalf!.addedIngredients = rightFreeAddons;
      halfHalfItem.rightHalf!.removedIngredients = rightHalfDish.ingredients?.filter(ingredient => 
        !rightHalfDish.ingredients?.some(orig => orig.id === ingredient.id)
      ) || [];

      // Oblicz całkowitą cenę: połowa ceny lewego dania + połowa ceny prawego dania + połowa ceny płatnych dodatków
      const leftHalfBasePrice = selectedAddonSize ? selectedAddonSize.price / 2 : leftHalfDish.price / 2;
      const rightHalfBasePrice = selectedAddonSize ? selectedAddonSize.price / 2 : rightHalfDish.price / 2;
      const totalBasePrice = leftHalfBasePrice + rightHalfBasePrice; // Suma połówek dań
      const totalAddonsPrice = leftAddonsTotal + rightAddonsTotal; // Suma połówek dodatków
      const totalPrice = (totalBasePrice + totalAddonsPrice) * addonItemQuantity;
      
      halfHalfItem.price = totalBasePrice; // Cena bazowa = połowa lewego + połowa prawego
      halfHalfItem.total = totalPrice;

      // Dodaj pozycję do zamówienia
      if (editingItemId) {
        setOrderItems(prev => prev.map(item => 
          item.id === editingItemId ? halfHalfItem : item
        ));
      } else {
        setOrderItems(prev => [...prev, halfHalfItem]);
      }
      
      // Zamknij modal i wyczyść stany
    setShowAddonModal(false);
    setSelectedItemForAddons(null);
    setSelectedAddons({});
      setSelectedIngredients({});
      setAddonCounts({});
      setFreeAddonCounts({});
      setSelectedAddonSize(null);
      setIsAddonHalfHalfMode(false);
      setLeftHalfDish(null);
      setRightHalfDish(null);
      setLeftHalfSize(null);
      setRightHalfSize(null);
      setAddonItemQuantity(1);
      setEditingItemId(null);
      return;
    }

    // Płatne dodatki z licznikami (tryb normalny)
    const selectedAddonObjects = Object.entries(addonCounts)
      .filter(([_, count]) => count > 0)
      .map(([addonId, count]) => {
        // Znajdź dodatek w grupach dodatków
        for (const group of addonGroups || []) {
          const addon = group.addonItems?.find(a => a.id === addonId);
          if (addon) {
            return {
              id: addon.id,
              name: addon.name,
              price: addon.price, // Cena w złotówkach
              quantity: count
            };
          }
        }
        return null;
      })
      .filter(Boolean) as {id: string, name: string, price: number, quantity: number}[];

    // Darmowe dodatki z licznikami
    const selectedFreeAddonObjects = Object.entries(freeAddonCounts)
      .filter(([_, count]) => count > 0)
      .map(([addonId, count]) => {
        // Znajdź dodatek w grupach dodatków
        for (const group of addonGroups || []) {
          const addon = group.addonItems?.find(a => a.id === addonId);
          if (addon) {
            return {
              id: addon.id,
              name: addon.name,
              quantity: count
            };
          }
        }
        return null;
      })
      .filter(Boolean) as {id: string, name: string, quantity: number}[];

    // Oryginalne składniki (zawarte w daniu)
    const selectedIngredientObjects = Object.entries(selectedIngredients)
      .filter(([_, selected]) => selected)
      .map(([ingredientId, _]) => {
        const ingredient = selectedItemForAddons.ingredients?.find(i => i.id === ingredientId);
        if (ingredient) {
          return {
            id: ingredient.id,
            name: ingredient.name
          };
        }
        return null;
      })
      .filter(Boolean) as {id: string, name: string}[];

    if (editingItemId) {
      console.log('🔧 Editing item with ID:', editingItemId);
      console.log('🔧 Selected addon objects:', selectedAddonObjects);
      console.log('🔧 Selected free addon objects:', selectedFreeAddonObjects);
      console.log('🔧 Selected ingredient objects:', selectedIngredientObjects);
      
      // Edycja istniejącej pozycji
      const existingItem = orderItems.find(item => item.id === editingItemId);
      if (existingItem) {
        console.log('🔧 Existing item found:', existingItem);
        
        // Oblicz które składniki zostały dodane, a które usunięte
        const originalIngredients = selectedItemForAddons.ingredients || [];
        const selectedIngredientIds = selectedIngredientObjects.map(i => i.id);
        
        // Składniki które użytkownik dodał (nie były w oryginalnym daniu)
        const addedIngredients = selectedIngredientObjects.filter(ingredient => 
          !originalIngredients.some(orig => orig.id === ingredient.id)
        );
        
        // Składniki które użytkownik usunął (były w oryginalnym daniu, ale nie zostały wybrane)
        const removedIngredients = originalIngredients.filter(orig => 
          !selectedIngredientIds.includes(orig.id)
        );
        
        const basePrice = selectedAddonSize?.price || selectedItemForAddons.price || 0;
        const addonsTotal = selectedAddonObjects.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
        const totalPrice = basePrice + addonsTotal;
        
        // Połącz darmowe dodatki z oryginalnymi składnikami
        const allAddedIngredients = [...addedIngredients, ...selectedFreeAddonObjects];
        
        console.log('🔧 Updated item data:', {
          quantity: addonItemQuantity,
          price: totalPrice,
          total: totalPrice * addonItemQuantity,
          addons: selectedAddonObjects,
          addedIngredients: allAddedIngredients,
          removedIngredients: removedIngredients
        });
        
        setOrderItems(prev => prev.map(item =>
          item.id === editingItemId
            ? {
                ...item,
                quantity: addonItemQuantity,
                price: totalPrice,
                total: totalPrice * addonItemQuantity,
                addons: selectedAddonObjects,
                addedIngredients: allAddedIngredients,
                removedIngredients: removedIngredients
              }
            : item
        ));
        
        console.log('🔧 Item updated successfully');
      } else {
        console.log('❌ Existing item not found for ID:', editingItemId);
      }
    } else {
      // Dodawanie nowej pozycji
      addItemToOrderWithAddons(selectedItemForAddons, selectedAddonObjects, selectedIngredientObjects, addonItemQuantity, selectedFreeAddonObjects, selectedAddonSize);
    }
    
    setShowAddonModal(false);
    setSelectedItemForAddons(null);
    setSelectedAddons({});
    setSelectedIngredients({});
    setAddonCounts({});
    setFreeAddonCounts({});
    setAddonItemQuantity(1);
    // Reset editingItemId tylko po zakończeniu edycji
    if (editingItemId) {
      setEditingItemId(null);
    }
  }, [selectedItemForAddons, isAddonHalfHalfMode, leftHalfDish, rightHalfDish, addonItemQuantity, selectedAddonSize, addonCounts, freeAddonCounts, selectedIngredients, addonGroups, orderItems, editingItemId, addItemToOrderWithAddons]);


  // Funkcje dla nowego modala konfiguracji dania
  const handleSizeSelect = (size: {name: string, price?: number}) => {
    setSelectedSize(size);
  };

  const _handleGoToSummary = () => {
    setCurrentStep('summary');
  };

  const _handleBackToConfig = () => {
    setCurrentStep('config');
  };

  const handleItemConfigCancel = () => {
    setShowItemConfigModal(false);
    setSelectedItemForConfig(null);
    setSelectedSize(null);
    setCurrentStep('config');
    setItemQuantity(1);
    setSelectedAddons({});
    setSelectedIngredients({});
    setEditingItemId(null);
    setIsHalfHalfMode(false);
    setLeftHalfDish(null);
    setRightHalfDish(null);
    setItemNotes('');
    setLeftHalfSize(null);
    setRightHalfSize(null);
  };

  // Funkcja do inicjalizacji składników (domyślnie wybrane)
  const initializeIngredients = (item: MenuItem) => {
    const defaultIngredients: {[ingredientId: string]: boolean} = {};
    
    // Inicjalizuj oryginalne składniki jako wybrane
    if (item.ingredients) {
      item.ingredients.forEach(ingredient => {
        defaultIngredients[ingredient.id] = true;
      });
    }
    
    setSelectedIngredients(defaultIngredients);
    setAddonCounts({});
    setFreeAddonCounts({});
    setSelectedAddonSize(null);
    // Nie resetuj trybu pół na pół - to powinno być kontrolowane przez wywołujący kod
    // setIsAddonHalfHalfMode(false);
    // setLeftHalfDish(null);
    // setRightHalfDish(null);
    // setLeftHalfSize(null);
    // setRightHalfSize(null);
    // setHalfHalfCategory('');
  };

  // Funkcje dla trybu pół na pół
  const handleHalfHalfModeToggle = () => {
    setIsHalfHalfMode(!isHalfHalfMode);
    if (!isHalfHalfMode) {
      // Resetuj wybory gdy włączamy tryb pół na pół
      setLeftHalfDish(null);
      setRightHalfDish(null);
      setLeftHalfSize(null);
      setRightHalfSize(null);
      setHalfHalfCategory('');
    }
  };

  const handleHalfDishSelect = (dish: MenuItem, side: 'left' | 'right') => {
    if (side === 'left') {
      setLeftHalfDish(dish);
      // Użyj aktualnie wybranego rozmiaru lub pierwszego dostępnego
      if (leftHalfSize) {
        // Użyj już wybranego rozmiaru
      } else if (dish.sizes && dish.sizes.length > 0) {
        setLeftHalfSize(dish.sizes[0]);
        setRightHalfSize(dish.sizes[0]); // Ustaw ten sam rozmiar dla obu połówek
      }
    } else {
      setRightHalfDish(dish);
      // Użyj aktualnie wybranego rozmiaru lub pierwszego dostępnego
      if (rightHalfSize) {
        // Użyj już wybranego rozmiaru
      } else if (dish.sizes && dish.sizes.length > 0) {
        setRightHalfSize(dish.sizes[0]);
        setLeftHalfSize(dish.sizes[0]); // Ustaw ten sam rozmiar dla obu połówek
      }
    }
  };


  const getHalfHalfPrice = () => {
    if (!leftHalfDish || !rightHalfDish || !leftHalfSize) {
      return 0;
    }
    
    // Znajdź ceny dla wybranych dań z wybranym rozmiarem
    const leftSizePrice = leftHalfDish.sizes?.find(size => size.name === leftHalfSize.name)?.price || leftHalfDish.price;
    const rightSizePrice = rightHalfDish.sizes?.find(size => size.name === leftHalfSize.name)?.price || rightHalfDish.price;
    
    return (leftSizePrice + rightSizePrice) / 2; // Średnia cena
  };

  const getHalfHalfTitle = () => {
    if (!leftHalfDish || !rightHalfDish) return 'Wybierz dania pół na pół';
    return `1/2 ${leftHalfDish.name} / 1/2 ${rightHalfDish.name}`;
  };

  const handleAddToOrder = () => {
    if (isHalfHalfMode) {
      // Tryb pół na pół
      if (!leftHalfDish || !rightHalfDish || !leftHalfSize || !rightHalfSize) return;

      const halfHalfPrice = getHalfHalfPrice();
      const halfHalfName = getHalfHalfTitle();

      const newItem: OrderItem = {
        id: `halfhalf-${Date.now()}`,
        name: halfHalfName,
        quantity: itemQuantity,
        price: halfHalfPrice,
        total: halfHalfPrice * itemQuantity,
        addons: [],
        ingredients: []
      };

      setOrderItems(prev => [...prev, newItem]);
      handleItemConfigCancel();
    } else {
      // Tryb normalny
      if (!selectedItemForConfig || !selectedSize) return;

      // Płatne dodatki z licznikami (tryb normalny)
      const selectedAddonObjects = Object.entries(addonCounts)
        .filter(([_, count]) => count > 0)
        .map(([addonId, count]) => {
          // Znajdź dodatek w grupach dodatków
          for (const group of addonGroups || []) {
            const addon = group.addonItems?.find(a => a.id === addonId);
            if (addon) {
              return {
                id: addon.id,
                name: addon.name,
                price: addon.price, // Cena w złotówkach
                quantity: count
              };
            }
          }
          return null;
        })
        .filter(Boolean) as {id: string, name: string, price: number, quantity: number}[];

      const selectedIngredientObjects = Object.entries(selectedIngredients)
        .filter(([_, selected]) => selected)
        .map(([ingredientId, _]) => {
          const ingredient = selectedItemForConfig.ingredients?.find(i => i.id === ingredientId);
          if (ingredient) {
            return {
              id: ingredient.id,
              name: ingredient.name
            };
          }
          return null;
        })
        .filter(Boolean) as {id: string, name: string}[];

      const itemWithSize = {
        ...selectedItemForConfig,
        price: selectedSize.price,
        name: `${selectedItemForConfig.name} ${selectedSize.name}`
      };

      if (editingItemId) {
        // Edycja istniejącej pozycji - użyj tej samej logiki co addItemToOrderWithAddons
        const currentItem = orderItems.find(item => item.id === editingItemId);
        if (!currentItem) return;
        
        // Oblicz które składniki zostały dodane, a które usunięte
        const originalIngredients = selectedItemForConfig.ingredients || [];
        const selectedIngredientIds = selectedIngredientObjects.map(i => i.id);
        
        // Składniki które użytkownik dodał (nie były w oryginalnym daniu)
        const addedIngredients = selectedIngredientObjects.filter(ingredient => 
          !originalIngredients.some(orig => orig.id === ingredient.id)
        );
        
        // Składniki które użytkownik usunął (były w oryginalnym daniu, ale nie zostały wybrane)
        const removedIngredients = originalIngredients.filter(orig => 
          !selectedIngredientIds.includes(orig.id)
        );
        
        const basePrice = selectedSize ? selectedSize.price : (selectedItemForConfig.price || 0);
        const addonsTotal = selectedAddonObjects.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
        const totalPrice = basePrice + addonsTotal;
        
        setOrderItems(prev => prev.map(item => 
          item.id === editingItemId 
            ? {
                ...item,
                name: itemWithSize.name,
                price: totalPrice,
                quantity: itemQuantity,
                total: totalPrice * itemQuantity,
                addons: selectedAddonObjects,
                addedIngredients: addedIngredients,
                removedIngredients: removedIngredients,
                selectedSize: selectedSize ? { name: selectedSize.name, price: selectedSize.price || 0 } : undefined,
                notes: itemNotes || ''
              }
            : item
        ));
      } else {
        // Dodawanie nowej pozycji
        addItemToOrderWithAddons(itemWithSize, selectedAddonObjects, selectedIngredientObjects, itemQuantity, [], selectedSize, itemNotes);
      }
    }
    
    handleItemConfigCancel();
  };

  const removeItemFromOrder = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const getTotalPrice = () => {
    const itemsTotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const deliveryPrice = customerData.pickupType === 'delivery' ? customerData.address.deliveryPrice : 0;
    return itemsTotal + deliveryPrice;
  };

  // Funkcja sprawdzająca czy danie ma skonfigurowaną opcję pół na pół
  const hasHalfHalfOption = (itemName: string, categoryId: string) => {
    // Jeśli dane nie są jeszcze załadowane, zwróć false
    if (allMenuItemsLoading || allMenuItems.length === 0) {
      console.log('⏳ Data not loaded yet, skipping half-half check');
      return false;
    }
    
    console.log('🔍 hasHalfHalfOption check:', { itemName, categoryId });
    console.log('📋 halfHalfConfigs:', halfHalfConfigs);
    console.log('🍽️ allMenuItems:', allMenuItems);
    
    // Sprawdź czy istnieje konfiguracja pół na pół dla tej kategorii
    const config = halfHalfConfigs.find(config => 
      config.categoryId === categoryId && 
      config.available &&
      config.dishes.length > 0
    );
    
    console.log('⚙️ Found config:', config);
    
    if (!config) {
      console.log('❌ No config found for category:', categoryId);
      return false;
    }
    
    // Sprawdź czy to danie jest w konfiguracji pół na pół
    const dish = allMenuItems.find(item => item.name === itemName && item.categoryId === categoryId);
    console.log('🍽️ Found dish:', dish);
    console.log('📝 Config dishes:', config.dishes);
    
    const isInConfig = dish ? config.dishes.includes(dish.id) : false;
    console.log('✅ Is in config:', isInConfig);
    
    return isInConfig;
  };

  // Funkcja pobierająca dania dostępne w trybie pół na pół dla danej kategorii
  const getHalfHalfDishes = (categoryId: string) => {
    console.log('🔍 getHalfHalfDishes called with categoryId:', categoryId);
    console.log('📋 halfHalfConfigs:', halfHalfConfigs);
    console.log('🍽️ allMenuItems length:', allMenuItems.length);
    
    const config = halfHalfConfigs.find(config => 
      config.categoryId === categoryId && 
      config.available &&
      config.dishes.length > 0
    );
    
    console.log('⚙️ Found config:', config);
    
    if (!config) {
      console.log('❌ No config found for category:', categoryId);
      return [];
    }
    
    const filteredDishes = allMenuItems.filter(item => 
      item.categoryId === categoryId && 
      config.dishes.includes(item.id)
    );
    
    console.log('🍽️ Filtered dishes:', filteredDishes);
    console.log('📝 Config dishes:', config.dishes);
    
    return filteredDishes;
  };

  // Funkcja sprawdzająca czy punkt znajduje się w strefie dostaw
  const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  // Funkcja znajdowania strefy dostaw dla adresu
  const findDeliveryZoneForAddress = (latitude: number, longitude: number): DeliveryZone | null => {
    if (!deliveryZones || deliveryZones.length === 0) return null;
    
    const point: [number, number] = [latitude, longitude];
    
    for (const zone of deliveryZones) {
      if (zone.isActive && zone.coordinates && zone.coordinates.length >= 3) {
        if (isPointInPolygon(point, zone.coordinates)) {
          return zone;
        }
      }
    }
    
    return null;
  };

  // Funkcja aktualizacji kwoty dostawy na podstawie strefy
  const updateDeliveryPriceFromZone = (latitude: number, longitude: number) => {
    const zone = findDeliveryZoneForAddress(latitude, longitude);
    if (zone) {
      const deliveryPrice = zone.deliveryPrice / 100; // Konwersja z groszy na złotówki
      setCustomerData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          deliveryPrice: deliveryPrice
        }
      }));
    } else {
      // Jeśli nie znaleziono strefy, ustaw domyślną kwotę
      setCustomerData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          deliveryPrice: 0
        }
      }));
    }
  };

  // Function to automatically geocode address
  const autoGeocodeAddress = async (street: string, city: string) => {
    if (!street || !city || street.length < 5) {
      return; // Don't geocode if address is too short
    }

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      const result = await geocodeAddress(street, city);
      
      if ('error' in result) {
        setGeocodingError(result.message);
        console.warn('Geocoding failed:', result.message);
      } else {
        // Update coordinates
        setCustomerData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            latitude: result.latitude,
            longitude: result.longitude
          }
        }));
        
        // Clear any previous errors
        setGeocodingError(null);
      }
    } catch (error) {
      setGeocodingError('Błąd podczas geolokalizacji adresu');
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Function to search for address suggestions
  const searchAddressSuggestionsDebounced = async (query: string, city: string) => {
    console.log('🔍 searchAddressSuggestionsDebounced called:', { query, city, queryLength: query.length });
    
    if (!query || query.length < 2) {
      console.log('❌ Query too short, clearing suggestions');
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    console.log('⏳ Starting address suggestions search...');
    setIsLoadingSuggestions(true);
    try {
      const suggestions = await searchAddressSuggestions(query, city);
      console.log('✅ Address suggestions received:', suggestions);
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('❌ Address suggestions error:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Debounced search function
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const debouncedSearch = (query: string, city: string) => {
    console.log('⏱️ debouncedSearch called:', { query, city });
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      console.log('⏰ Timeout triggered, calling searchAddressSuggestionsDebounced');
      searchAddressSuggestionsDebounced(query, city);
    }, 300);
    
    setSearchTimeout(timeout);
  };


  // Function to handle address suggestion selection
  const _handleAddressSuggestionSelect = (suggestion: AddressSuggestion) => {
    setCustomerData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        street: suggestion.address.road ? 
          `${suggestion.address.road}${suggestion.address.houseNumber ? ` ${suggestion.address.houseNumber}` : ''}` : 
          suggestion.displayName.split(',')[0],
        city: suggestion.address.city || 'Słupsk',
        postalCode: suggestion.address.postcode || '76-200',
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      }
    }));
    
    setAddressSuggestions([]);
    setShowSuggestions(false);
    setGeocodingError(null);
  };


  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleCustomerDataChange = (field: string, value: string | number | boolean | undefined) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setCustomerData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));

      // Auto-geocode when street or city changes
      if (addressField === 'street' || addressField === 'city') {
        const newAddress = addressField === 'street' ? String(value ?? '') : customerData.address.street;
        const newCity = addressField === 'city' ? String(value ?? '') : customerData.address.city;
        
        // Search for address suggestions when typing in street field
        if (addressField === 'street') {
          console.log('🏠 Street field changed, calling debouncedSearch:', { newAddress, newCity });
          debouncedSearch(newAddress, newCity);
        }
        
        // Debounce geocoding to avoid too many API calls
        setTimeout(() => {
          autoGeocodeAddress(newAddress, newCity);
        }, 1000);
      }

    } else {
      setCustomerData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 handleSubmit called with orderItems:', orderItems);
    console.log('🚀 orderItems.length:', orderItems.length);
    
    if (orderItems.length === 0) {
      alert('Dodaj przynajmniej jedną pozycję do zamówienia');
      return;
    }

    // Zabezpieczenie przed duplikowaniem
    if (createOrderMutation.isPending || updateOrderMutation.isPending) {
      return;
    }

    // Wymagaj danych klienta tylko dla zamówień na dostawę
    if (customerData.pickupType === 'delivery' && !customerData.name.trim()) {
      alert('Nazwa klienta jest wymagana dla zamówień na dostawę');
      return;
    }

    // Wymagaj numeru telefonu dla zamówień na dostawę
    if (customerData.pickupType === 'delivery' && (!customerData.phone.trim() || customerData.phone.length < 9)) {
      alert('Numer telefonu jest wymagany dla zamówień na dostawę (minimum 9 znaków)');
      return;
    }

    // Wymagaj kodu pocztowego dla zamówień na dostawę
    if (customerData.pickupType === 'delivery' && (!customerData.address.postalCode.trim())) {
      alert('Kod pocztowy jest wymagany dla zamówień na dostawę');
      return;
    }

    // Wymagaj numeru stolika dla zamówień na miejscu
    if (customerData.pickupType === 'dine_in' && !customerData.tableNumber.trim()) {
      alert('Numer stolika jest wymagany dla zamówień na miejscu');
      return;
    }

    const orderData = {
      type: customerData.pickupType === 'delivery' ? OrderType.DELIVERY : 
            customerData.pickupType === 'takeaway' ? OrderType.TAKEAWAY : 
            OrderType.DINE_IN,
      customer: {
        name: customerData.pickupType === 'delivery' ? (customerData.name || 'Klient') : 
              customerData.pickupType === 'takeaway' ? 'Klient na wynos' : 'Klient na miejscu',
        phone: customerData.pickupType === 'delivery' ? (customerData.phone || '+48123456789') : '+48123456789',
        ...(customerData.pickupType === 'delivery' && customerData.email && { email: customerData.email }),
        ...(customerData.pickupType === 'delivery' && {
          address: {
            street: customerData.address.street || 'Nieznana ulica',
            city: customerData.address.city || 'Nieznane miasto',
            postalCode: customerData.address.postalCode || '00-000',
            latitude: customerData.address.latitude,
            longitude: customerData.address.longitude
          }
        })
      },
      items: orderItems.map(item => {
        console.log('📦 Mapping item for submission:', item);
        return {
          name: item.name || 'Nieznane danie',
          quantity: Math.max(item.quantity || 1, 1), // Minimum 1 żeby przejść walidację positive()
          price: Math.max(item.price || 0, 0.01), // Cena w złotówkach - minimum 0.01 żeby przejść walidację positive()
          addons: item.addons || [],
          ingredients: item.ingredients || [],
          addedIngredients: item.addedIngredients || [],
          removedIngredients: item.removedIngredients || [],
          isHalfHalf: item.isHalfHalf || false,
          selectedSize: item.selectedSize || undefined,
          leftHalf: item.leftHalf || undefined,
          rightHalf: item.rightHalf || undefined,
          notes: item.notes || undefined
        };
      }),
      total: getTotalPrice(),
      tableNumber: customerData.pickupType === 'dine_in' ? customerData.tableNumber : undefined,
      promisedTime: (() => {
        // Dla zamówień "scheduled" oblicz różnicę między wybraną datą a aktualnym czasem
        if (customerData.deliveryType === 'scheduled' && customerData.scheduledDateTime) {
          const now = new Date();
          const scheduledTime = new Date(customerData.scheduledDateTime);
          const diffInMinutes = Math.ceil((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
          
          // Upewnij się, że czas jest dodatni (nie w przeszłości)
          const finalTime = Math.max(diffInMinutes, 1);
          console.log('Scheduled order calculation:', {
            now: now.toISOString(),
            scheduled: scheduledTime.toISOString(),
            diffInMinutes,
            finalTime
          });
          return finalTime;
        }
        
        // Dla zamówień ASAP używaj standardowej logiki
        if (customerData.customTime && customerData.customTime.trim() !== '') {
          const customTime = parseInt(customerData.customTime);
          console.log('Using custom time:', customTime, 'from input:', customerData.customTime);
          return customTime || customerData.promisedTime;
        } else {
          console.log('Using promised time from buttons:', customerData.promisedTime);
          return customerData.promisedTime;
        }
      })(),
      ...(customerData.paymentMethod && { 
        paymentMethod: customerData.paymentMethod === 'cash' ? PaymentMethod.CASH :
                       customerData.paymentMethod === 'card' ? PaymentMethod.CARD :
                       customerData.paymentMethod === 'paid' ? PaymentMethod.PAID :
                       undefined
      })
    };

    console.log('📋 Final orderData:', orderData);
    console.log('📋 orderData.items:', orderData.items);

    if (editOrder) {
      // Aktualizacja istniejącego zamówienia
      const { total: _total, ...updateData } = orderData;
      
      // Filtruj tylko zmienione pola
      const changedData: Partial<UpdateOrderRequest> = {};
      
      // Zawsze wysyłaj type, customer, items, notes, tableNumber, promisedTime
      // bo to są podstawowe pola zamówienia
      if (updateData.type !== editOrder.type) {
        changedData.type = updateData.type;
      }
      
      // Zawsze aktualizuj customer, items, tableNumber, promisedTime
      // bo mogły się zmienić
      changedData.customer = updateData.customer;
      changedData.items = updateData.items;
      changedData.tableNumber = updateData.tableNumber;
      changedData.promisedTime = updateData.promisedTime;
      
      // Nie wysyłaj paymentMethod dla zamówień anulowanych
      if (updateData.paymentMethod && editOrder.status !== 'CANCELLED') {
        changedData.paymentMethod = updateData.paymentMethod;
      }
      
      console.log('🔄 Aktualizacja zamówienia:', { id: editOrder.id, changedData });
      console.log('📦 Items w changedData:', changedData.items);
      console.log('👤 Customer w changedData:', changedData.customer);
      updateOrderMutation.mutate({ id: editOrder.id, data: changedData });
    } else {
      // Tworzenie nowego zamówienia
      createOrderMutation.mutate(orderData);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="order-creator-overlay">
      <div className="order-creator-modal">
        <div className="modal-header">
          <h2>{editOrder ? '✏️ Edytuj zamówienie' : '➕ Nowe zamówienie'}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="order-creator-content">
          {/* Lewy panel - Kategorie menu */}
          <div className="menu-categories-panel">
            <div className="search-section">
              <input
                type="text"
                placeholder="🔍 Szukaj"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="categories-list">
              {categoriesLoading ? (
                <div className="menu-loading">Ładowanie kategorii…</div>
              ) : (
                categories?.map(category => (
                  <div
                    key={category.id}
                    className={`category-item ${selectedCategory === category.id ? 'selected' : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span className="category-name">{category.name}</span>
                    <span className="category-count">{category.itemCount}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Środkowy panel - Pozycje menu */}
          <div className="menu-items-panel">
            <div className="panel-header">
              <h3>Lista dań: {categories?.find(c => c.id === selectedCategory)?.name || 'Wybierz kategorię'}</h3>
            </div>
            
            <div className="menu-items-grid">
              {menuItemsLoading && selectedCategory ? (
                <div className="menu-loading">Ładowanie dań…</div>
              ) : (
                menuItems?.map(item => (
                  <div
                    key={item.id}
                    className="menu-item-card"
                    onClick={() => addItemToOrder(item)}
                  >
                    <div className="item-name">{item.name}</div>
                    <div className="item-price">{(item.price || 0).toFixed(2)} zł</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prawy panel - Podsumowanie zamówienia */}
          <div className="order-summary-panel">
            {/* TYP ODBIORU – wybór rodzaju zamówienia na górze popupu */}
            <div className="pickup-type-section">
              <label className="pickup-type-label">TYP ODBIORU *</label>
              <div className="button-group pickup-type-buttons">
                <button
                  type="button"
                  className={`option-btn ${customerData.pickupType === 'dine_in' ? 'active' : ''}`}
                  onClick={() => handleCustomerDataChange('pickupType', 'dine_in')}
                >
                  🏠 Na miejscu
                </button>
                <button
                  type="button"
                  className={`option-btn ${customerData.pickupType === 'takeaway' ? 'active' : ''}`}
                  onClick={() => handleCustomerDataChange('pickupType', 'takeaway')}
                >
                  📦 Na wynos
                </button>
                <button
                  type="button"
                  className={`option-btn ${customerData.pickupType === 'delivery' ? 'active' : ''}`}
                  onClick={() => handleCustomerDataChange('pickupType', 'delivery')}
                >
                  🚚 Dostawa
                </button>
              </div>
              {customerData.pickupType === 'dine_in' && (
                <div className="table-number-inline">
                  <label>Numer stolika *</label>
                  <input
                    type="text"
                    value={customerData.tableNumber}
                    onChange={(e) => handleCustomerDataChange('tableNumber', e.target.value)}
                    className="form-input table-number-input"
                    placeholder="np. 5, A1, VIP"
                  />
                </div>
              )}
            </div>

            <div className="customer-section">
              <div className="customer-info">
                <div className="info-row">
                  <span className="info-label">Klient:</span>
                  <span className="info-value">{customerData.name || 'Brak danych'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Adres:</span>
                  <span className="info-value">{customerData.address.street || 'Brak danych'}</span>
                </div>
              </div>
              
              <button 
                className="customer-data-btn"
                onClick={() => setShowCustomerModal(true)}
              >
                👤 Dane klienta
              </button>
            </div>
            
            <div className="order-items-section">
              <div className="items-header">
                <span>Nazwa</span>
                <span>Ilość</span>
                <span>Suma</span>
                <span>Edytuj</span>
              </div>
              
              {orderItems.length === 0 ? (
                <div className="empty-items">Brak dań</div>
              ) : (
                <div className="items-list">
                  {orderItems.map(item => (
                    <div key={item.id} className="order-item-row">
                      <div className="item-details">
                      <span className="item-name">
                        {item.name}
                        {item.selectedSize && (
                          <span style={{ 
                            color: '#6b7280',
                            fontSize: '0.75rem',
                            marginLeft: '0.25rem'
                          }}>
                            - {item.selectedSize.name}
                          </span>
                        )}
                      </span>
                        
                        {/* Pozycje pół na pół - kompaktowy format */}
                        {item.isHalfHalf && item.leftHalf && item.rightHalf && (
                          <div className="half-half-compact">
                            <div className="half-half-description">
                              <span className="half-half-text">
                                [1/2 {item.leftHalf.dishName}
                                {/* Dodane składniki lewej połowy */}
                                {item.leftHalf.addedIngredients && item.leftHalf.addedIngredients.length > 0 && (
                                  <>
                                    {item.leftHalf.addedIngredients.map(ingredient => 
                                      Array.from({ length: ingredient.quantity || 1 }, (_, i) => (
                                        <span key={`${ingredient.id}-${i}`} className="added-ingredient"> + {ingredient.name}</span>
                                      ))
                                    )}
                                  </>
                                )}
                                {/* Usunięte składniki lewej połowy */}
                                {item.leftHalf.removedIngredients && item.leftHalf.removedIngredients.length > 0 && (
                                  <>
                                    {item.leftHalf.removedIngredients.map(ingredient => (
                                      <span key={`left-removed-${ingredient.id}`} className="removed-ingredient"> - {ingredient.name}</span>
                                    ))}
                                  </>
                                )}
                                {/* Płatne dodatki lewej połowy */}
                                {item.leftHalf.addons && item.leftHalf.addons.length > 0 && (
                                  <>
                                    {item.leftHalf.addons.map(addon => 
                                      Array.from({ length: addon.quantity }, (_, i) => (
                                        <span key={`${addon.id}-${i}`} className="added-ingredient"> + {addon.name} (+{(addon.price || 0).toFixed(2)} zł)</span>
                                      ))
                                    )}
                                  </>
                                )}
                                <span className="half-separator"> / 1/2 {item.rightHalf.dishName}</span>
                                {/* Dodane składniki prawej połowy */}
                                {item.rightHalf.addedIngredients && item.rightHalf.addedIngredients.length > 0 && (
                                  <>
                                    {item.rightHalf.addedIngredients.map(ingredient => 
                                      Array.from({ length: ingredient.quantity || 1 }, (_, i) => (
                                        <span key={`${ingredient.id}-${i}`} className="added-ingredient"> + {ingredient.name}</span>
                                      ))
                                    )}
                                  </>
                                )}
                                {/* Usunięte składniki prawej połowy */}
                                {item.rightHalf.removedIngredients && item.rightHalf.removedIngredients.length > 0 && (
                                  <>
                                    {item.rightHalf.removedIngredients.map(ingredient => (
                                      <span key={`right-removed-${ingredient.id}`} className="removed-ingredient"> - {ingredient.name}</span>
                                    ))}
                                  </>
                                )}
                                {/* Płatne dodatki prawej połowy */}
                                {item.rightHalf.addons && item.rightHalf.addons.length > 0 && (
                                  <>
                                    {item.rightHalf.addons.map(addon => 
                                      Array.from({ length: addon.quantity }, (_, i) => (
                                        <span key={`${addon.id}-${i}`} className="added-ingredient"> + {addon.name} (+{(addon.price || 0).toFixed(2)} zł)</span>
                                      ))
                                    )}
                                  </>
                                )}
                                <span className="size-info">] {item.selectedSize?.name || '40cm'}</span>
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* Zwykłe pozycje (nie pół na pół) */}
                        {!item.isHalfHalf && (
                          <>
                            {/* Składniki dodane */}
                            {item.addedIngredients && item.addedIngredients.length > 0 && (
                              <div className="item-ingredients">
                                <span className="ingredients-label">Dodane składniki:</span>
                                <span className="ingredients-list">
                                  {item.addedIngredients.map(ingredient => `+${ingredient.name}`).join(', ')}
                                </span>
                              </div>
                            )}
                            {/* Składniki usunięte */}
                            {item.removedIngredients && item.removedIngredients.length > 0 && (
                              <div className="item-ingredients">
                                <span className="ingredients-label">Usunięte składniki:</span>
                                <span className="ingredients-list">
                                  {item.removedIngredients.map(ingredient => `-${ingredient.name}`).join(', ')}
                                </span>
                              </div>
                            )}
                            {/* Dodatki */}
                            {item.addons && item.addons.length > 0 && (
                              <div className="item-addons">
                                <span className="addons-label">Dodatki:</span>
                                <span className="addons-list">
                                  {item.addons.map(addon => `${addon.name} (+${(addon.price || 0).toFixed(2)} zł)`).join(', ')}
                                </span>
                              </div>
                            )}
                            {/* Komentarz do dania */}
                            {item.notes && (
                              <div className="item-notes">
                                <span className="notes-label">Komentarz:</span>
                                <span className="notes-text">"{item.notes}"</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="quantity-display">
                        <span className="quantity">Ilość: {item.quantity}</span>
                      </div>
                      <span className="item-total">{(item.total || 0).toFixed(2)} zł</span>
                      <div className="item-actions">
                        <button
                          onClick={() => {
                            console.log('🔧 Edit button clicked for item:', item);
                            editItemInOrder(item.id);
                          }}
                          className="edit-btn"
                          title="Edytuj pozycję"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => removeItemFromOrder(item.id)}
                          className="remove-btn"
                          title="Usuń pozycję"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="order-total">
              <span className="total-label">Łączna cena:</span>
              <span className="total-amount">{getTotalPrice().toFixed(2)} zł</span>
            </div>
            
            <div className="order-actions">
              <button
                onClick={handleSubmit}
                disabled={orderItems.length === 0 || createOrderMutation.isPending || updateOrderMutation.isPending}
                className="submit-btn"
              >
                {createOrderMutation.isPending || updateOrderMutation.isPending 
                  ? '⏳ Przetwarzanie...' 
                  : editOrder ? '✅ Aktualizuj zamówienie' : '✅ Złóż zamówienie'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal z danymi klienta */}
      {showCustomerModal && (
        <div className="customer-modal-overlay">
          <div className="customer-modal">
            <div className="customer-modal-header">
              <h3>Dane klienta</h3>
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="customer-form-content">
              {/* Lewa kolumna */}
              <div className="form-left-column">
                <div className="form-group">
                  <label>Telefon *</label>
                  <input
                    type="tel"
                    value={customerData.phone}
                    onChange={(e) => handleCustomerDataChange('phone', e.target.value)}
                    className="form-input"
                    placeholder="+48"
                  />
                </div>
                
                <div className="form-group">
                  <label>Adres *</label>
                  <div className="address-row">
                    <div className="address-autocomplete-wrapper">
                      <AddressAutocomplete
                        value={{
                          street: customerData.address.street,
                          city: customerData.address.city,
                          postalCode: customerData.address.postalCode,
                          latitude: customerData.address.latitude,
                          longitude: customerData.address.longitude
                        }}
                        onChange={(address) => {
                          setCustomerData(prev => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              ...address
                            }
                          }));
                        }}
                        onGeocodingComplete={(coordinates) => {
                          setCustomerData(prev => ({
                            ...prev,
                            address: {
                              ...prev.address,
                              latitude: coordinates.latitude,
                              longitude: coordinates.longitude
                            }
                          }));
                          // Aktualizuj kwotę dostawy na podstawie strefy
                          updateDeliveryPriceFromZone(coordinates.latitude, coordinates.longitude);
                        }}
                        onGeocodingError={(error) => {
                          setGeocodingError(error);
                        }}
                        placeholder="Wpisz adres z numerem budynku..."
                        disabled={false}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Komentarz do adresu</label>
                  <textarea
                    value={customerData.address.comment}
                    onChange={(e) => handleCustomerDataChange('address.comment', e.target.value)}
                    className="form-textarea"
                    placeholder="Dodatkowe informacje o adresie"
                    rows={3}
                  />
                </div>
                
                
                <div className="form-group">
                  <label>Cena dostawy</label>
                  <div className="price-input-row">
                    <input
                      type="number"
                      value={customerData.address.deliveryPrice}
                      onChange={(e) => handleCustomerDataChange('address.deliveryPrice', parseFloat(e.target.value) || 0)}
                      className="form-input price-input"
                      placeholder="0.00"
                      step="0.01"
                    />
                    <span className="currency">zł</span>
                  </div>
                  {customerData.address.latitude && customerData.address.longitude && (
                    <div className="delivery-zone-info">
                      {(() => {
                        const zone = findDeliveryZoneForAddress(customerData.address.latitude!, customerData.address.longitude!);
                        if (zone) {
                          return (
                            <div className="zone-info">
                              <span className="zone-name">📍 Strefa: {zone.name}</span>
                              <span className="zone-price">Kwota: {zone.deliveryPrice / 100} zł</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="zone-info no-zone">
                              <span className="zone-name">📍 Poza strefą dostaw</span>
                              <span className="zone-price">Dostawa: 0 zł</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Imię i nazwisko</label>
                  <input
                    type="text"
                    value={customerData.name}
                    onChange={(e) => handleCustomerDataChange('name', e.target.value)}
                    className="form-input"
                    placeholder="Wprowadź imię i nazwisko"
                  />
                </div>
                
                <div className="form-group">
                  <label>NIP</label>
                  <input
                    type="text"
                    value={customerData.nip}
                    onChange={(e) => handleCustomerDataChange('nip', e.target.value)}
                    className="form-input"
                    placeholder="Wprowadź NIP"
                  />
                </div>
              </div>
              
              {/* Prawa kolumna */}
              <div className="form-right-column">
                <div className="form-group">
                  <label>Źródło zamówienia: {customerData.orderSource}</label>
                </div>
                
                <div className="form-group">
                  <label>TYP ODBIORU *</label>
                  <div className="button-group">
                    <button
                      type="button"
                      className={`option-btn ${customerData.pickupType === 'dine_in' ? 'active' : ''}`}
                      onClick={() => handleCustomerDataChange('pickupType', 'dine_in')}
                    >
                      🏠 Na miejscu
                    </button>
                    <button
                      type="button"
                      className={`option-btn ${customerData.pickupType === 'takeaway' ? 'active' : ''}`}
                      onClick={() => handleCustomerDataChange('pickupType', 'takeaway')}
                    >
                      📦 Na wynos
                    </button>
                    <button
                      type="button"
                      className={`option-btn ${customerData.pickupType === 'delivery' ? 'active' : ''}`}
                      onClick={() => handleCustomerDataChange('pickupType', 'delivery')}
                    >
                      🚚 Dostawa
                    </button>
                  </div>
                </div>
                
                {/* Pole numeru stolika - tylko dla zamówień na miejscu */}
                {customerData.pickupType === 'dine_in' && (
                  <div className="form-group">
                    <label>Numer stolika *</label>
                    <input
                      type="text"
                      value={customerData.tableNumber}
                      onChange={(e) => handleCustomerDataChange('tableNumber', e.target.value)}
                      className="form-input"
                      placeholder="np. 5, A1, VIP"
                    />
                  </div>
                )}
                
                {/* Ukryj formę płatności dla zamówień anulowanych */}
                {editOrder?.status !== 'CANCELLED' && (
                  <div className="form-group">
                    <label>SPOSÓB ZAPŁATY</label>
                    <div className="button-group">
                      <button
                        type="button"
                        className={`option-btn ${customerData.paymentMethod === 'cash' ? 'active' : ''}`}
                        onClick={() => handleCustomerDataChange('paymentMethod', 'cash')}
                      >
                        💰 Gotówka
                      </button>
                      <button
                        type="button"
                        className={`option-btn ${customerData.paymentMethod === 'paid' ? 'active' : ''}`}
                        onClick={() => handleCustomerDataChange('paymentMethod', 'paid')}
                      >
                        ✅ Zapłacone
                      </button>
                      <button
                        type="button"
                        className={`option-btn ${customerData.paymentMethod === 'card' ? 'active' : ''}`}
                        onClick={() => handleCustomerDataChange('paymentMethod', 'card')}
                      >
                        💳 Karta
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={customerData.printReceipt}
                      onChange={(e) => handleCustomerDataChange('printReceipt', e.target.checked)}
                      className="checkbox-input"
                    />
                    Drukuj paragon
                  </label>
                </div>
              </div>
            </div>
            
            {/* Dolna sekcja */}
            <div className="form-bottom-section">
              <div className="form-group">
                <label>TYP DOSTAWY</label>
                <div className="delivery-type-buttons">
                  <button
                    type="button"
                    className={`delivery-btn ${customerData.deliveryType === 'asap' ? 'active' : ''}`}
                    onClick={() => handleCustomerDataChange('deliveryType', 'asap')}
                  >
                    🚚 Jak najszybciej
                  </button>
                  <button
                    type="button"
                    className={`delivery-btn ${customerData.deliveryType === 'scheduled' ? 'active' : ''}`}
                    onClick={() => handleCustomerDataChange('deliveryType', 'scheduled')}
                  >
                    🕐 Na wybraną godzinę
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label>OBIECANY CZAS *</label>
                
                {customerData.deliveryType === 'asap' ? (
                  <div className="time-options">
                    {[15, 30, 45, 60, 75, 90, 120].map(time => (
                      <button
                        key={time}
                        type="button"
                        className={`time-btn ${customerData.promisedTime === time ? 'active' : ''}`}
                        onClick={() => handleCustomerDataChange('promisedTime', time)}
                      >
                        {time}
                      </button>
                    ))}
                    <div className="custom-time">
                      <input
                        type="text"
                        value={customerData.customTime}
                        onChange={(e) => handleCustomerDataChange('customTime', e.target.value)}
                        className="form-input custom-input"
                        placeholder="Własny"
                      />
                      <span>min</span>
                    </div>
                  </div>
                ) : (
                  <div className="scheduled-time-section">
                    <label className="datetime-label">Wybierz datę i godzinę dostawy:</label>
                    <input
                      type="datetime-local"
                      value={customerData.scheduledDateTime}
                      onChange={(e) => handleCustomerDataChange('scheduledDateTime', e.target.value)}
                      className="form-input datetime-input"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
              
              <div className="order-summary">
                <div className="total-price">
                  <span>Łączna cena: {getTotalPrice().toFixed(2)} zł</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    setShowCustomerModal(false);
                    handleSubmit(e);
                  }}
                  className="place-order-btn"
                >
                  {editOrder ? '🛒 Aktualizuj zamówienie' : '🛒 Złóż zamówienie'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do wyboru dodatków */}
      {showAddonModal && selectedItemForAddons && (
        <div className="customer-modal-overlay">
          <div className="addons-modal">
            {/* Header z wyszukiwaniem */}
            <div className="addons-header">
              <div className="addons-title-section">
                <h3>Dodatki</h3>
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="Szukaj"
                    className="search-input"
                    value={addonSearchQuery}
                    onChange={(e) => setAddonSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="addons-actions">
                <div className="quantity-controls">
              <button 
                    onClick={() => setAddonItemQuantity(Math.max(1, addonItemQuantity - 1))}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <span className="quantity">{addonItemQuantity}</span>
                  <button
                    onClick={() => setAddonItemQuantity(addonItemQuantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={handleConfirmAddons}
                  className="save-btn"
                >
                  esc Zapisz
                </button>
              </div>
            </div>
            
            <div className="addons-content">
              {/* Sekcja z wybranymi dodatkami (pills) - ukryj w trybie pół na pół */}
              {!isAddonHalfHalfMode && (
                <div className="selected-addons-section">
                <div className="selected-addons-pills">
                  {/* Płatne dodatki z licznikami */}
                  {Object.entries(addonCounts)
                    .filter(([_, count]) => count > 0)
                    .map(([addonId, count]) => {
                      for (const group of addonGroups || []) {
                        const addon = group.addonItems?.find(a => a.id === addonId);
                        if (addon) {
                          return (
                            <div key={`paid-${addonId}`} className="selected-addon-pill">
                              <span className="addon-name">{addon.name} x{count}</span>
                              <button
                                type="button"
                                className="remove-addon-btn"
                                onClick={() => handleAddonRemove(addonId)}
              >
                ×
              </button>
            </div>
                          );
                        }
                      }
                      return null;
                    })}
                  {/* Darmowe dodatki z licznikami */}
                  {Object.entries(freeAddonCounts)
                    .filter(([_, count]) => count > 0)
                    .map(([addonId, count]) => {
                      for (const group of addonGroups || []) {
                        const addon = group.addonItems?.find(a => a.id === addonId);
                        if (addon) {
                          return (
                            <div key={`free-${addonId}`} className="selected-addon-pill free">
                              <span className="addon-name">{addon.name} x{count}</span>
                              <button
                                type="button"
                                className="remove-addon-btn"
                                onClick={() => handleFreeAddonRemove(addonId)}
                              >
                                ×
                              </button>
                            </div>
                          );
                        }
                      }
                      return null;
                    })}
                  {/* Oryginalne składniki */}
                  {Object.entries(selectedIngredients)
                    .filter(([_, selected]) => selected)
                    .map(([ingredientId, _]) => {
                      const ingredient = selectedItemForAddons.ingredients?.find(i => i.id === ingredientId);
                      if (ingredient) {
                        return (
                          <div key={`ingredient-${ingredientId}`} className="selected-addon-pill ingredient">
                            <span className="addon-name">{ingredient.name}</span>
                            <button
                              type="button"
                              className="remove-addon-btn"
                              onClick={() => handleIngredientToggle(ingredientId)}
                            >
                              ×
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })}
                </div>
              </div>
              )}
            
              {/* Sekcja z rozmiarami */}
              {selectedItemForAddons.sizes && selectedItemForAddons.sizes.length > 0 && (
                <div className="addons-section">
                  <h4 className="section-title">ROZMIARY</h4>
                  <div className="sizes-grid">
                    {selectedItemForAddons.sizes.map(size => (
                      <button
                        key={size.name}
                        onClick={() => handleAddonSizeSelect(size)}
                        className={`size-button ${selectedAddonSize?.name === size.name ? 'selected' : ''}`}
                      >
                        <span className="size-name">{size.name}</span>
                        <span className="size-price">+{(size.price || 0).toFixed(2)} zł</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sekcja pół na pół */}
              {selectedItemForAddons.sizes && selectedItemForAddons.sizes.length > 0 && (
                <div className="addons-section">
                  <h4 className="section-title">PÓŁ NA PÓŁ</h4>
                  <div className="half-half-section">
                    <button
                      onClick={handleAddonHalfHalfModeToggle}
                      className={`half-half-toggle ${isAddonHalfHalfMode ? 'active' : ''}`}
                    >
                      {isAddonHalfHalfMode ? '✓ Pół na pół włączone' : 'Pół na pół'}
                    </button>
                    
                    {isAddonHalfHalfMode && (
                      <div className="half-half-content">
                        {/* Wybór dań pół na pół */}
                        <div className="half-dishes-selection">
                          <h5>WYBIERZ DANIA PÓŁ NA PÓŁ</h5>
                          <div className="half-dishes-container">
                            {/* Wybór dań - kategoria jest już ustawiona */}
                            {halfHalfCategory && (
                              <>
                                <div className="half-category-header">
                                  <h6>
                                    {categories.find(cat => cat.id === halfHalfCategory)?.name || 'Wybrana kategoria'}
                                  </h6>
                                </div>

                                {/* Lewa połowa */}
                                <div className="half-dish-section">
                                  <h6>Lewa połowa</h6>
                                  <div className="half-dish-options">
                                    {getHalfHalfDishes(halfHalfCategory).map(item => {
                                      const category = categories.find(cat => cat.id === item.categoryId);
                                      return (
                                        <button
                                          key={`left-${item.id}`}
                                          className={`half-dish-btn ${leftHalfDish?.id === item.id ? 'selected' : ''}`}
                                          onClick={() => handleHalfDishSelect(item, 'left')}
                                        >
                                          <div className="half-dish-info">
                                            <span className="half-dish-name">{item.name}</span>
                                            <span className="half-dish-category">{category?.name || 'Nieznana kategoria'}</span>
                                            <span className="half-dish-price">{(item.price || 0).toFixed(2)} zł</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Prawa połowa */}
                                <div className="half-dish-section">
                                  <h6>Prawa połowa</h6>
                                  <div className="half-dish-options">
                                    {getHalfHalfDishes(halfHalfCategory).map(item => {
                                      const category = categories.find(cat => cat.id === item.categoryId);
                                      return (
                                        <button
                                          key={`right-${item.id}`}
                                          className={`half-dish-btn ${rightHalfDish?.id === item.id ? 'selected' : ''}`}
                                          onClick={() => handleHalfDishSelect(item, 'right')}
                                        >
                                          <div className="half-dish-info">
                                            <span className="half-dish-name">{item.name}</span>
                                            <span className="half-dish-category">{category?.name || 'Nieznana kategoria'}</span>
                                            <span className="half-dish-price">{(item.price || 0).toFixed(2)} zł</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>


                        {/* Płatne dodatki dla każdej połowy */}
                        <div className="half-addons-selection">
                          <h5>PŁATNE DODATKI DLA KAŻDEJ POŁÓWKI</h5>
                          <div className="half-addons-container">
                            {/* Lewa połowa - płatne dodatki */}
                            <div className="half-addon-section">
                              <h6>Lewa połowa - płatne dodatki</h6>
                              <div className="half-addon-options">
                                {leftHalfDish ? (
                                  leftHalfDish.addonGroups?.map(group => {
                                    if (!group || group.addonItems?.length === 0) return null;
                                    
                                    return (
                                      <div key={`left-${group.id}`} className="addon-group-section">
                                        <h6>{group.name}</h6>
                                        <div className="addons-grid">
                                          {group.addonItems?.map(addon => (
                                            <div key={`left-${addon.id}`} className="addon-item">
                                              <button
                                                onClick={() => {
                                                  const currentCount = (addonCounts[`left-${addon.id}`] || 0) + 1;
                                                  setAddonCounts(prev => ({
                                                    ...prev,
                                                    [`left-${addon.id}`]: currentCount
                                                  }));
                                                }}
                                                className="addon-button"
                                              >
                                                <span className="addon-name">{addon.name}</span>
                                                <span className="addon-price">{(addon.price || 0).toFixed(2)} zł</span>
                                                {addonCounts[`left-${addon.id}`] > 0 && (
                                                  <span className="addon-count">x{addonCounts[`left-${addon.id}`]}</span>
                                                )}
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="no-dish-selected">
                                    <p>Najpierw wybierz danie dla lewej połowy</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Prawa połowa - płatne dodatki */}
                            <div className="half-addon-section">
                              <h6>Prawa połowa - płatne dodatki</h6>
                              <div className="half-addon-options">
                                {rightHalfDish ? (
                                  rightHalfDish.addonGroups?.map(group => {
                                    if (!group || group.addonItems?.length === 0) return null;
                                    
                                    return (
                                      <div key={`right-${group.id}`} className="addon-group-section">
                                        <h6>{group.name}</h6>
                                        <div className="addons-grid">
                                          {group.addonItems?.map(addon => (
                                            <div key={`right-${addon.id}`} className="addon-item">
                                              <button
                                                onClick={() => {
                                                  const currentCount = (addonCounts[`right-${addon.id}`] || 0) + 1;
                                                  setAddonCounts(prev => ({
                                                    ...prev,
                                                    [`right-${addon.id}`]: currentCount
                                                  }));
                                                }}
                                                className="addon-button"
                                              >
                                                <span className="addon-name">{addon.name}</span>
                                                <span className="addon-price">{(addon.price || 0).toFixed(2)} zł</span>
                                                {addonCounts[`right-${addon.id}`] > 0 && (
                                                  <span className="addon-count">x{addonCounts[`right-${addon.id}`]}</span>
                                                )}
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="no-dish-selected">
                                    <p>Najpierw wybierz danie dla prawej połowy</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Darmowe dodatki dla każdej połowy */}
                        <div className="half-addons-selection">
                          <h5>DARMOWE DODATKI DLA KAŻDEJ POŁÓWKI</h5>
                          <div className="half-addons-container">
                            {/* Lewa połowa - darmowe dodatki */}
                            <div className="half-addon-section">
                              <h6>Lewa połowa - darmowe dodatki</h6>
                              <div className="half-addon-options">
                                {leftHalfDish ? (
                                  leftHalfDish.addonGroups?.map(group => {
                                    if (!group || group.addonItems?.length === 0) return null;
                                    
                                    return (
                                      <div key={`left-free-${group.id}`} className="addon-group-section">
                                        <h6>{group.name}</h6>
                                        <div className="addons-grid">
                                          {group.addonItems?.map(addon => (
                                            <div key={`left-free-${addon.id}`} className="addon-item">
                                              <button
                                                onClick={() => {
                                                  const currentCount = (freeAddonCounts[`left-${addon.id}`] || 0) + 1;
                                                  setFreeAddonCounts(prev => ({
                                                    ...prev,
                                                    [`left-${addon.id}`]: currentCount
                                                  }));
                                                }}
                                                className="addon-button"
                                              >
                                                <span className="addon-name">{addon.name}</span>
                                                <span className="addon-price">Darmowe</span>
                                                {freeAddonCounts[`left-${addon.id}`] > 0 && (
                                                  <span className="addon-count">x{freeAddonCounts[`left-${addon.id}`]}</span>
                                                )}
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="no-dish-selected">
                                    <p>Najpierw wybierz danie dla lewej połowy</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Prawa połowa - darmowe dodatki */}
                            <div className="half-addon-section">
                              <h6>Prawa połowa - darmowe dodatki</h6>
                              <div className="half-addon-options">
                                {rightHalfDish ? (
                                  rightHalfDish.addonGroups?.map(group => {
                                    if (!group || group.addonItems?.length === 0) return null;
                                    
                                    return (
                                      <div key={`right-free-${group.id}`} className="addon-group-section">
                                        <h6>{group.name}</h6>
                                        <div className="addons-grid">
                                          {group.addonItems?.map(addon => (
                                            <div key={`right-free-${addon.id}`} className="addon-item">
                                              <button
                                                onClick={() => {
                                                  const currentCount = (freeAddonCounts[`right-${addon.id}`] || 0) + 1;
                                                  setFreeAddonCounts(prev => ({
                                                    ...prev,
                                                    [`right-${addon.id}`]: currentCount
                                                  }));
                                                }}
                                                className="addon-button"
                                              >
                                                <span className="addon-name">{addon.name}</span>
                                                <span className="addon-price">Darmowe</span>
                                                {freeAddonCounts[`right-${addon.id}`] > 0 && (
                                                  <span className="addon-count">x{freeAddonCounts[`right-${addon.id}`]}</span>
                                                )}
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="no-dish-selected">
                                    <p>Najpierw wybierz danie dla prawej połowy</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Wyświetlanie składników z wybranych dań z możliwością usunięcia */}
                        <div className="half-ingredients-display">
                          <h5>SKŁADNIKI Z WYBRANYCH DAŃ</h5>
                          <div className="half-ingredients-container">
                            <div className="half-ingredient-section">
                              <h6>Lewa połowa - składniki</h6>
                              <div className="ingredients-list">
                                {/* Oryginalne składniki z dania */}
                                {leftHalfDish?.ingredients?.map(ingredient => (
                                  <div key={`left-ingredient-${ingredient.id}`} className="ingredient-item removable">
                                    <span className="ingredient-name">{ingredient.name}</span>
                                    <button
                                      type="button"
                                      className="remove-ingredient-btn"
                                      onClick={() => {
                                        // Usuń składnik z lewej połowy
                                        setLeftHalfDish(prev => prev ? {
                                          ...prev,
                                          ingredients: prev.ingredients?.filter(i => i.id !== ingredient.id) || []
                                        } : null);
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                
                                {/* Dodane płatne dodatki dla lewej połowy */}
                                {Object.entries(addonCounts)
                                  .filter(([addonId, count]) => addonId.startsWith('left-') && count > 0)
                                  .map(([addonId, count]) => {
                                    const cleanId = addonId.replace('left-', '');
                      for (const group of addonGroups || []) {
                                      const addon = group.addonItems?.find(a => a.id === cleanId);
                                      if (addon) {
                                        return (
                                          <div key={`left-addon-${addon.id}`} className="ingredient-item removable paid">
                                            <span className="ingredient-name">{addon.name} x{count} (+{(addon.price || 0).toFixed(2)} zł)</span>
                                            <button
                                              type="button"
                                              className="remove-ingredient-btn"
                                              onClick={() => {
                                                setAddonCounts(prev => ({
                                                  ...prev,
                                                  [`left-${addon.id}`]: 0
                                                }));
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      }
                                    }
                                    return null;
                                  })
                                  .filter(Boolean)}
                                
                                {/* Dodane darmowe dodatki dla lewej połowy */}
                                {Object.entries(freeAddonCounts)
                                  .filter(([addonId, count]) => addonId.startsWith('left-') && count > 0)
                                  .map(([addonId, count]) => {
                                    const cleanId = addonId.replace('left-', '');
                                    for (const group of addonGroups || []) {
                                      const addon = group.addonItems?.find(a => a.id === cleanId);
                                      if (addon) {
                                        return (
                                          <div key={`left-free-addon-${addon.id}`} className="ingredient-item removable free">
                                            <span className="ingredient-name">{addon.name} x{count} (darmowe)</span>
                                            <button
                                              type="button"
                                              className="remove-ingredient-btn"
                                              onClick={() => {
                                                setFreeAddonCounts(prev => ({
                                                  ...prev,
                                                  [`left-${addon.id}`]: 0
                                                }));
                                              }}
                                            >
                                              ×
                                            </button>
                </div>
                                        );
                                      }
                                    }
                                    return null;
                                  })
                                  .filter(Boolean)}
                              </div>
                            </div>
                            
                            <div className="half-ingredient-section">
                              <h6>Prawa połowa - składniki</h6>
                              <div className="ingredients-list">
                                {/* Oryginalne składniki z dania */}
                                {rightHalfDish?.ingredients?.map(ingredient => (
                                  <div key={`right-ingredient-${ingredient.id}`} className="ingredient-item removable">
                                    <span className="ingredient-name">{ingredient.name}</span>
                  <button
                    type="button"
                                      className="remove-ingredient-btn"
                                      onClick={() => {
                                        // Usuń składnik z prawej połowy
                                        setRightHalfDish(prev => prev ? {
                                          ...prev,
                                          ingredients: prev.ingredients?.filter(i => i.id !== ingredient.id) || []
                                        } : null);
                                      }}
                                    >
                                      ×
                  </button>
                                  </div>
                                ))}
                                
                                {/* Dodane płatne dodatki dla prawej połowy */}
                                {Object.entries(addonCounts)
                                  .filter(([addonId, count]) => addonId.startsWith('right-') && count > 0)
                                  .map(([addonId, count]) => {
                                    const cleanId = addonId.replace('right-', '');
                                    for (const group of addonGroups || []) {
                                      const addon = group.addonItems?.find(a => a.id === cleanId);
                                      if (addon) {
                                        return (
                                          <div key={`right-addon-${addon.id}`} className="ingredient-item removable paid">
                                            <span className="ingredient-name">{addon.name} x{count} (+{(addon.price || 0).toFixed(2)} zł)</span>
                  <button
                    type="button"
                                              className="remove-ingredient-btn"
                                              onClick={() => {
                                                setAddonCounts(prev => ({
                                                  ...prev,
                                                  [`right-${addon.id}`]: 0
                                                }));
                                              }}
                                            >
                                              ×
                  </button>
                </div>
                                        );
                                      }
                                    }
                                    return null;
                                  })
                                  .filter(Boolean)}
                                
                                {/* Dodane darmowe dodatki dla prawej połowy */}
                                {Object.entries(freeAddonCounts)
                                  .filter(([addonId, count]) => addonId.startsWith('right-') && count > 0)
                                  .map(([addonId, count]) => {
                                    const cleanId = addonId.replace('right-', '');
                                    for (const group of addonGroups || []) {
                                      const addon = group.addonItems?.find(a => a.id === cleanId);
                                      if (addon) {
                                        return (
                                          <div key={`right-free-addon-${addon.id}`} className="ingredient-item removable free">
                                            <span className="ingredient-name">{addon.name} x{count} (darmowe)</span>
                                            <button
                                              type="button"
                                              className="remove-ingredient-btn"
                                              onClick={() => {
                                                setFreeAddonCounts(prev => ({
                                                  ...prev,
                                                  [`right-${addon.id}`]: 0
                                                }));
                                              }}
                                            >
                                              ×
                                            </button>
                                          </div>
                                        );
                                      }
                                    }
                                    return null;
                                  })
                                  .filter(Boolean)}
                              </div>
              </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sekcja PŁATNE DODATKI - ukryj w trybie pół na pół */}
              {!isAddonHalfHalfMode && selectedItemForAddons.addonGroups?.map(group => {
                if (!group || group.addonItems?.length === 0) return null;
                
                return (
                  <div key={group.id} className="addons-section">
                    <h4 className="section-title">PŁATNE DODATKI</h4>
                    <div className="addons-grid">
                      {group.addonItems
                        ?.filter(addon => 
                          addon.name.toLowerCase().includes(addonSearchQuery.toLowerCase())
                        )
                        ?.map(addon => (
                        <div key={`main-addon-${addon.id}`} className="addon-item">
                          <button
                            onClick={() => handleAddonClick(addon.id)}
                            className="addon-button"
                          >
                            <span className="addon-name">{addon.name}</span>
                            <span className="addon-price">{(addon.price || 0).toFixed(2)} zł</span>
                            {addonCounts[addon.id] > 0 && (
                              <span className="addon-count">x{addonCounts[addon.id]}</span>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {/* Sekcja DARMOWE DODATKI - ukryj w trybie pół na pół */}
              {!isAddonHalfHalfMode && selectedItemForAddons.addonGroups?.map(group => {
                if (!group || group.addonItems?.length === 0) return null;
                
                return (
                  <div key={`free-${group.id}`} className="addons-section">
                    <h4 className="section-title">DARMOWE DODATKI</h4>
                    <div className="addons-grid">
                      {group.addonItems
                        ?.filter(addon => 
                          addon.name.toLowerCase().includes(addonSearchQuery.toLowerCase())
                        )
                        ?.map(addon => (
                        <div key={`main-free-${addon.id}`} className="addon-item">
                  <button
                            onClick={() => handleFreeAddonClick(addon.id)}
                            className="addon-button free"
                  >
                            <span className="addon-name">{addon.name}</span>
                            {freeAddonCounts[addon.id] > 0 && (
                              <span className="addon-count">x{freeAddonCounts[addon.id]}</span>
                            )}
                  </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer z przyciskiem zapisz */}
            <div className="addons-footer">
                  <button
                    onClick={handleConfirmAddons}
                className="save-btn-large"
                  >
                esc Zapisz
                  </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal konfiguracji dania – w Portalu do body, żeby był wyśrodkowany na ekranie */}
      {showItemConfigModal && selectedItemForConfig && createPortal(
        <div className="customer-modal-overlay item-config-overlay">
          <div className="item-config-modal">
            <div className="customer-modal-header">
              <div className="modal-title">
                <h3>
                  {isHalfHalfMode ? getHalfHalfTitle() : (editingItemId ? 'Edytuj pozycję' : selectedItemForConfig.name)}
                </h3>
                {hasHalfHalfOption(selectedItemForConfig.name, selectedItemForConfig.categoryId) && !isHalfHalfMode && (
                  <button 
                    className="half-half-toggle-btn"
                    onClick={handleHalfHalfModeToggle}
                    title="Przełącz na tryb pół na pół"
                  >
                    🍕½
                  </button>
                )}
                {isHalfHalfMode && (
                  <div className="half-half-mode-indicator">
                    <span className="half-half-badge">1/2</span>
                    <span className="half-half-price">Cena: {getHalfHalfPrice().toFixed(2)} zł</span>
                  </div>
                )}
              </div>
              <button 
                onClick={handleItemConfigCancel}
                className="close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="item-config-content">
              {/* Jedna strona: rozmiar, dodatki i podsumowanie */}
              <div className="item-configuration item-config-single-page">
                  {isHalfHalfMode ? (
                    // Tryb pół na pół
                    <div className="half-half-configuration">
                      {/* Wybór rozmiaru */}
                      <div className="size-selection">
                        <h4>ROZMIARY</h4>
                        <div className="size-options">
                          {(leftHalfDish?.sizes || selectedItemForConfig.sizes || []).map((size, index) => (
                            <button
                              key={index}
                              className={`size-option ${leftHalfSize?.name === size.name ? 'selected' : ''}`}
                              onClick={() => {
                                setLeftHalfSize(size);
                                setRightHalfSize(size);
                              }}
                            >
                              <span className="size-name">{size.name}</span>
                              <span className="size-price">{(size.price || 0).toFixed(2)} zł</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Wybór dań pół na pół */}
                      <div className="half-dishes-selection">
                        <h4>WYBIERZ DANIA PÓŁ NA PÓŁ</h4>
                        <div className="half-dishes-container">
                          {/* Lewa połowa */}
                          <div className="half-dish-section">
                            <h5>Lewa połowa</h5>
                            <div className="half-dish-options">
                              {allMenuItems?.map(item => {
                                const category = categories.find(cat => cat.id === item.categoryId);
                                return (
                                  <button
                                    key={`left-${item.id}`}
                                    className={`half-dish-btn ${leftHalfDish?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => handleHalfDishSelect(item, 'left')}
                                  >
                                    <div className="half-dish-info">
                                      <span className="half-dish-name">{item.name}</span>
                                      <span className="half-dish-category">{category?.name || 'Nieznana kategoria'}</span>
                                      <span className="half-dish-price">{(item.price || 0).toFixed(2)} zł</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Prawa połowa */}
                          <div className="half-dish-section">
                            <h5>Prawa połowa</h5>
                            <div className="half-dish-options">
                              {allMenuItems?.map(item => {
                                const category = categories.find(cat => cat.id === item.categoryId);
                                return (
                                  <button
                                    key={`right-${item.id}`}
                                    className={`half-dish-btn ${rightHalfDish?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => handleHalfDishSelect(item, 'right')}
                                  >
                                    <div className="half-dish-info">
                                      <span className="half-dish-name">{item.name}</span>
                                      <span className="half-dish-category">{category?.name || 'Nieznana kategoria'}</span>
                                      <span className="half-dish-price">{(item.price || 0).toFixed(2)} zł</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Tryb normalny
                    <>
                      {/* Wybór rozmiaru */}
                      <div className="size-selection">
                        <h4>ROZMIARY</h4>
                        <div className="size-options">
                          {selectedItemForConfig.sizes?.map((size, index) => (
                            <button
                              key={index}
                              className={`size-option ${selectedSize?.name === size.name ? 'selected' : ''}`}
                              onClick={() => handleSizeSelect(size)}
                            >
                              <span className="size-name">{size.name}</span>
                              <span className="size-price">{(size.price || 0).toFixed(2)} zł</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Wybór składników i dodatków */}
                  {(selectedItemForConfig.ingredients && selectedItemForConfig.ingredients.length > 0) || 
                   (selectedItemForConfig.addonGroups && selectedItemForConfig.addonGroups.length > 0) ? (
                    <div className="addons-selection">
                      <div className="addons-tabs">
                        {selectedItemForConfig.ingredients && selectedItemForConfig.ingredients.length > 0 && (
                        <button className="addon-tab active">SKŁADNIKI</button>
                        )}
                        {selectedItemForConfig.addonGroups && selectedItemForConfig.addonGroups.length > 0 && (
                        <button className="addon-tab active">WYBIERZ DODATKI</button>
                        )}
                      </div>
                      
                      <div className="addons-content">
                        {/* Sekcja ze składnikami */}
                        {selectedItemForConfig.ingredients && selectedItemForConfig.ingredients.length > 0 && (
                          <div className="addon-group">
                            <h5>Składniki (darmowe)</h5>
                            <div className="addon-grid">
                              {selectedItemForConfig.ingredients.map(ingredient => (
                                <label key={`config-ingredient-${ingredient.id}`} className="addon-card">
                                  <input
                                    type="checkbox"
                                    checked={selectedIngredients[ingredient.id] || false}
                                    onChange={() => handleIngredientToggle(ingredient.id)}
                                  />
                                  <div className="addon-info">
                                    <span className="addon-name">{ingredient.name}</span>
                                    <span className="addon-price">Darmowe</span>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sekcja z dodatkami płatnymi */}
                        {selectedItemForConfig.addonGroups?.map(group => {
                          if (!group || !group.addonItems || group.addonItems.length === 0) return null;
                          
                          return (
                            <div key={group.id} className="addon-group">
                              <h5>{group.name}</h5>
                              <div className="addon-grid">
                                {group.addonItems?.map(addon => (
                                  <label key={`config-addon-${addon.id}`} className="addon-card">
                                    <input
                                      type="checkbox"
                                      checked={(addonCounts[addon.id] || 0) > 0}
                                      onChange={() => {
                                        if ((addonCounts[addon.id] || 0) > 0) {
                                          handleAddonRemove(addon.id);
                                        } else {
                                          handleAddonClick(addon.id);
                                        }
                                      }}
                                    />
                                    <div className="addon-info">
                                      <span className="addon-name">{addon.name}</span>
                                      {addon.price > 0 && (
                                        <span className="addon-price">+{(addon.price || 0).toFixed(2)} zł</span>
                                      )}
                                      {(addonCounts[addon.id] || 0) > 0 && (
                                        <span className="addon-count">x{addonCounts[addon.id]}</span>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Pole komentarza do dania */}
                  <div className="item-notes-section">
                    <label htmlFor="item-notes-config">Komentarz do dania (opcjonalnie):</label>
                    <textarea
                      id="item-notes-config"
                      value={editingItemId ? (orderItems.find(item => item.id === editingItemId)?.notes || '') : itemNotes}
                      onChange={(e) => {
                        if (editingItemId) {
                          setOrderItems(prev => prev.map(item => 
                            item.id === editingItemId 
                              ? { ...item, notes: e.target.value }
                              : item
                          ));
                        } else {
                          setItemNotes(e.target.value);
                        }
                      }}
                      placeholder="np. bez cebuli, bardzo ostre, na wynos..."
                      className="item-notes-input"
                      rows={3}
                    />
                  </div>

                  {/* Podsumowanie na tej samej stronie */}
                  <div className="item-summary-inline">
                    <h4 className="summary-inline-title">Podsumowanie</h4>
                    <div className="summary-item">
                    <h5>{isHalfHalfMode ? 'Danie pół na pół' : 'Aktualne danie'}</h5>
                    <div className="item-details">
                      {isHalfHalfMode ? (
                        <div className="half-half-summary">
                          <div className="half-summary">
                            <span className="half-label">Lewa połowa:</span>
                            <span className="half-dish">{leftHalfDish?.name} {leftHalfSize?.name}</span>
                          </div>
                          <div className="half-summary">
                            <span className="half-label">Prawa połowa:</span>
                            <span className="half-dish">{rightHalfDish?.name} {rightHalfSize?.name}</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="item-name">{selectedItemForConfig.name} {selectedSize?.name}</span>
                          <span className="item-quantity">Ilość: {itemQuantity}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {Object.keys(selectedIngredients).length > 0 && (
                    <div className="selected-ingredients">
                      <h5>Wybrane składniki:</h5>
                      {Object.entries(selectedIngredients)
                        .filter(([_, selected]) => selected)
                        .map(([ingredientId, _]) => {
                          const ingredient = selectedItemForConfig.ingredients?.find(i => i.id === ingredientId);
                          if (ingredient) {
                            return (
                              <div key={`config-selected-${ingredientId}`} className="selected-ingredient">
                                <span>{ingredient.name}</span>
                                <span>Darmowe</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                    </div>
                  )}
                  
                  {Object.keys(selectedAddons).length > 0 && (
                    <div className="selected-addons">
                      <h5>Wybrane dodatki:</h5>
                      {Object.entries(selectedAddons)
                        .filter(([_, selected]) => selected)
                        .map(([addonId, _]) => {
                          for (const group of addonGroups || []) {
                            const addon = group.addonItems?.find(a => a.id === addonId);
                            if (addon) {
                              const count = addonCounts[addonId] || 1;
                              return (
                                <div key={`config-${addonId}`} className="selected-addon">
                                  <span>{addon.name}{count > 1 ? ` ×${count}` : ''}</span>
                                  {addon.price > 0 && (
                                    <span>+{((addon.price || 0) * count).toFixed(2)} zł</span>
                                  )}
                                </div>
                              );
                            }
                          }
                          return null;
                        })}
                    </div>
                  )}
                  
                  <div className="quantity-controls">
                    <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>-</button>
                    <span>{itemQuantity}</span>
                    <button onClick={() => setItemQuantity(itemQuantity + 1)}>+</button>
                  </div>
                  
                  <div className="total-price">
                    <span>Łączna cena: {
                      isHalfHalfMode 
                        ? getHalfHalfPrice().toFixed(2)
                        : ((selectedSize?.price || 0) + Object.entries(selectedAddons)
                          .filter(([_, selected]) => selected)
                          .reduce((sum, [addonId, _]) => {
                            for (const group of addonGroups || []) {
                              const addon = group.addonItems?.find(a => a.id === addonId);
                              if (addon) return sum + (addon.price || 0) * (addonCounts[addonId] || 1);
                            }
                            return sum;
                          }, 0)).toFixed(2)
                    } zł</span>
                  </div>
                  
                  <button
                    className="add-to-order-btn"
                    onClick={handleAddToOrder}
                    disabled={isHalfHalfMode ? (!leftHalfDish || !rightHalfDish || !leftHalfSize) : !selectedSize}
                  >
                    {editingItemId ? '💾 Zaktualizuj' : '🛒 Dodaj'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal bonu */}
      <ReceiptPrinter
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          resetForm();
          onClose();
        }}
        orderItems={orderItems}
        customerData={customerData}
        totalPrice={getTotalPrice()}
      />
    </div>
  );
};

