import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import './PublicMenuPage.css';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  sizes?: {
    id: string;
    name: string;
    price: number;
  }[];
  addonGroups?: {
    id: string;
    name: string;
    items: {
      id: string;
      name: string;
      price: number;
    }[];
  }[];
  ingredients?: {
    id: string;
    name: string;
  }[];
}

interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  selectedSize?: {
    name: string;
    price: number;
  };
  addons: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  addedIngredients?: {
    id: string;
    name: string;
    quantity?: number;
  }[];
  removedIngredients?: {
    id: string;
    name: string;
  }[];
  isHalfHalf?: boolean;
  leftHalf?: {
    dishName: string;
    addons?: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    addedIngredients?: {
      id: string;
      name: string;
      quantity?: number;
    }[];
    removedIngredients?: {
      id: string;
      name: string;
    }[];
  };
  rightHalf?: {
    dishName: string;
    addons?: {
      id: string;
      name: string;
      price: number;
      quantity: number;
    }[];
    addedIngredients?: {
      id: string;
      name: string;
      quantity?: number;
    }[];
    removedIngredients?: {
      id: string;
      name: string;
    }[];
  };
  notes?: string;
}

const PublicMenuPage: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  
  // Stany dla modala konfiguracji produktu
  const [showItemConfigModal, setShowItemConfigModal] = useState(false);
  const [selectedItemForConfig, setSelectedItemForConfig] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<{name: string, price: number} | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<{[addonId: string]: boolean}>({});
  const [addonCounts, setAddonCounts] = useState<{[addonId: string]: number}>({});
  const [selectedIngredients, setSelectedIngredients] = useState<{[ingredientId: string]: boolean}>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  // Fetch public menu
  const { data: menuData, isLoading } = useQuery({
    queryKey: ['public-menu'],
    queryFn: async () => {
      const response = await fetch('/api/menu/public');
      if (!response.ok) throw new Error('Failed to fetch menu');
      return response.json();
    }
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: unknown) => {
      const response = await fetch('/api/orders/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error('Failed to create order');
      return response.json();
    },
    onSuccess: () => {
      alert('Zamówienie zostało złożone pomyślnie!');
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setTableNumber('');
      setNotes('');
      setOrderType('DINE_IN');
      setPaymentMethod('CASH');
      setShowCart(false);
    },
    onError: (error) => {
      alert('Błąd podczas składania zamówienia: ' + error.message);
    }
  });

  const menu: MenuCategory[] = menuData?.data || [];

  useEffect(() => {
    if (menu.length > 0 && !selectedCategory) {
      setSelectedCategory(menu[0].id);
    }
  }, [menu, selectedCategory]);

  const openItemConfig = (item: MenuItem) => {
    console.log('Opening item config for:', item.name);
    console.log('Item sizes:', item.sizes);
    console.log('Has sizes?', item.sizes && item.sizes.length > 0);
    
    setSelectedItemForConfig(item);
    setSelectedSize(null);
    setSelectedAddons({});
    setAddonCounts({});
    setSelectedIngredients({});
    setItemQuantity(1);
    setItemNotes('');
    setShowItemConfigModal(true);
  };

  const addToCart = () => {
    if (!selectedItemForConfig) return;


    // Sprawdź czy wymagany jest wybór rozmiaru
    if (selectedItemForConfig.sizes && selectedItemForConfig.sizes.length > 0 && !selectedSize) {
      alert('Proszę wybrać rozmiar przed dodaniem do koszyka!');
      return;
    }

    // Oblicz które składniki zostały dodane, a które usunięte
    const originalIngredients = selectedItemForConfig.ingredients || [];
    const selectedIngredientIds = Object.keys(selectedIngredients).filter(id => selectedIngredients[id]);
    
    // Składniki które użytkownik dodał (nie były w oryginalnym daniu)
    const addedIngredients = selectedIngredientIds
      .filter(id => !originalIngredients.some(orig => orig.id === id))
      .map(id => {
        const ingredient = selectedItemForConfig.ingredients?.find(i => i.id === id);
        return ingredient ? { id: ingredient.id, name: ingredient.name, quantity: 1 } : null;
      })
      .filter(Boolean) as {id: string, name: string, quantity: number}[];

    // Składniki które użytkownik usunął (były w oryginalnym daniu, ale nie zostały wybrane)
    const removedIngredients = originalIngredients
      .filter(orig => !selectedIngredientIds.includes(orig.id))
      .map(ingredient => ({ id: ingredient.id, name: ingredient.name }));

    // Przygotuj dodatki
    const addons = Object.entries(selectedAddons)
      .filter(([_, selected]) => selected)
      .map(([addonId, _]) => {
        const addonGroup = selectedItemForConfig.addonGroups?.find(group => 
          group.items.some(item => item.id === addonId)
        );
        const addonItem = addonGroup?.items.find(item => item.id === addonId);
        return addonItem ? {
          id: addonItem.id,
          name: addonItem.name,
          price: addonItem.price,
          quantity: addonCounts[addonId] || 1
        } : null;
      })
      .filter(Boolean) as {id: string, name: string, price: number, quantity: number}[];

    const basePrice = selectedSize ? selectedSize.price : selectedItemForConfig.price;
    const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    const totalPrice = basePrice + addonsTotal;

    const cartItem: CartItem = {
      id: `${selectedItemForConfig.id}-${Date.now()}`,
      name: selectedItemForConfig.name,
      price: totalPrice,
      quantity: itemQuantity,
      selectedSize: selectedSize ? { name: selectedSize.name, price: selectedSize.price } : undefined,
      addons,
      addedIngredients: addedIngredients.length > 0 ? addedIngredients : undefined,
      removedIngredients: removedIngredients.length > 0 ? removedIngredients : undefined,
      notes: itemNotes || undefined
    };

    setCart(prev => [...prev, cartItem]);
    setShowItemConfigModal(false);
  };

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCart(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const addonsTotal = item.addons.reduce((sum, addon) => sum + addon.price, 0) * item.quantity;
      return total + itemTotal + addonsTotal;
    }, 0);
  };

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      alert('Koszyk jest pusty!');
      return;
    }

    if (!customerName.trim()) {
      alert('Proszę podać imię i nazwisko!');
      return;
    }

    if (!customerPhone.trim()) {
      alert('Proszę podać numer telefonu!');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber.trim()) {
      alert('Proszę podać numer stolika!');
      return;
    }

    const orderData = {
      type: orderType,
      items: cart.map(item => ({
        name: item.name,
        price: item.price, // Price is already in złotówkach, system POS uses złotówki
        quantity: item.quantity,
        total: (item.price + item.addons.reduce((sum, addon) => sum + addon.price, 0)) * item.quantity,
        selectedSize: item.selectedSize,
        addons: item.addons,
        addedIngredients: item.addedIngredients,
        removedIngredients: item.removedIngredients,
        notes: item.notes
      })),
      customer: {
        name: customerName,
        phone: customerPhone,
        email: ''
      },
      tableNumber: orderType === 'DINE_IN' ? tableNumber : '',
      notes: notes || `Zamówienie ${orderType === 'DINE_IN' ? 'na miejscu' : 'na wynos'} z QR kodu`,
      promisedTime: 30,
      paymentMethod: paymentMethod
    };

    createOrderMutation.mutate(orderData);
  };

  const formatPrice = (price: number) => {
    // Price is already in złotówkach from the public API
    return `${price.toFixed(2)} zł`;
  };

  if (isLoading) {
    return (
      <div className="public-menu-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Ładowanie menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-menu-page">
      <header className="menu-header">
        <div className="restaurant-info">
          <h1>🍽️ Nasze Menu</h1>
          <p>Zamów online i ciesz się smakiem!</p>
        </div>
        <button 
          className="cart-button"
          onClick={() => setShowCart(true)}
        >
          🛒 Koszyk ({cart.length})
        </button>
      </header>

      <div className="menu-content">
        <nav className="category-nav">
          {menu.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </nav>

        <div className="menu-items">
          {menu
            .find(cat => cat.id === selectedCategory)
            ?.items.map(item => (
              <div key={item.id} className="menu-item">
                {item.imageUrl && (
                  <div className="item-image">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="item-info">
                  <h3>{item.name}</h3>
                  {item.description && <p className="item-description">{item.description}</p>}
                  <div className="item-price">
                    {item.sizes && item.sizes.length > 1 ? (
                      <div className="price-with-sizes">
                        <span className="price-range">
                          od {formatPrice(Math.min(...item.sizes.map(size => size.price)))}
                        </span>
                        <div className="sizes-preview">
                          {item.sizes.map(size => (
                            <span key={size.id} className="size-preview">
                              {size.name}
                            </span>
                          )).join(' • ')}
                        </div>
                      </div>
                    ) : (
                      formatPrice(item.price)
                    )}
                  </div>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => openItemConfig(item)}
                >
                  + Dodaj
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="cart-modal">
          <div className="cart-content">
            <div className="cart-header">
              <h2>🛒 Twój Koszyk</h2>
              <button 
                className="close-cart"
                onClick={() => setShowCart(false)}
              >
                ✕
              </button>
            </div>

            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="empty-cart">Koszyk jest pusty</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-details">
                      <h4>
                        {item.name}
                        {item.selectedSize && item.selectedSize.name && (
                          <span className="item-size-inline"> - {item.selectedSize.name}</span>
                        )}
                      </h4>
                      
                      {/* Wyświetl dodatki jeśli istnieją */}
                      {item.addons && item.addons.length > 0 && (
                        <div className="item-addons">
                          {item.addons.map((addon, index) => (
                            <div key={index} className="addon-item">
                              + {addon.name} {addon.quantity > 1 && `x${addon.quantity}`}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Wyświetl dodane składniki */}
                      {item.addedIngredients && item.addedIngredients.length > 0 && (
                        <div className="item-ingredients">
                          {item.addedIngredients.map((ingredient, index) => (
                            <div key={index} className="ingredient-item added">
                              + {ingredient.name} {ingredient.quantity && ingredient.quantity > 1 && `x${ingredient.quantity}`}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Wyświetl usunięte składniki */}
                      {item.removedIngredients && item.removedIngredients.length > 0 && (
                        <div className="item-ingredients">
                          {item.removedIngredients.map((ingredient, index) => (
                            <div key={index} className="ingredient-item removed">
                              - {ingredient.name}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="item-price">{formatPrice(item.price)}</div>
                    </div>
                    <div className="quantity-controls">
                      <button onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="cart-total">
                  <strong>Suma: {formatPrice(getTotalPrice())}</strong>
                </div>

                <div className="order-form">
                  <h3>Dane zamówienia</h3>
                  
                  {/* Order Type Selection */}
                  <div className="order-type-selection">
                    <h4>Typ zamówienia</h4>
                    <div className="order-type-buttons">
                      <button
                        type="button"
                        className={`order-type-btn ${orderType === 'DINE_IN' ? 'active' : ''}`}
                        onClick={() => setOrderType('DINE_IN')}
                      >
                        🍽️ Na miejscu
                      </button>
                      <button
                        type="button"
                        className={`order-type-btn ${orderType === 'TAKEAWAY' ? 'active' : ''}`}
                        onClick={() => setOrderType('TAKEAWAY')}
                      >
                        📦 Na wynos
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Imię i nazwisko *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Numer telefonu *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                  
                  {orderType === 'DINE_IN' && (
                    <input
                      type="text"
                      placeholder="Numer stolika *"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      required
                    />
                  )}
                  
                  <textarea
                    placeholder="Uwagi do zamówienia (opcjonalnie)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  {/* Payment Method Selection */}
                  <div className="payment-selection">
                    <h4>Forma płatności</h4>
                    <div className="payment-buttons">
                      <button
                        type="button"
                        className={`payment-btn ${paymentMethod === 'CASH' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('CASH')}
                      >
                        💰 Gotówka
                      </button>
                      <button
                        type="button"
                        className={`payment-btn ${paymentMethod === 'CARD' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('CARD')}
                      >
                        💳 Karta
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  className="submit-order-btn"
                  onClick={handleSubmitOrder}
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? 'Składanie...' : 'Złóż zamówienie'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Item Configuration Modal */}
      {showItemConfigModal && selectedItemForConfig && (
        <div className="item-config-modal">
          <div className="item-config-content">
            <div className="item-config-header">
              <h2>{selectedItemForConfig.name}</h2>
              <button 
                className="close-config"
                onClick={() => setShowItemConfigModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="item-config-body">
              {/* Rozmiary */}
              {selectedItemForConfig.sizes && selectedItemForConfig.sizes.length > 0 && (
                <div className="config-section">
                  <h3>Wybierz rozmiar *</h3>
                  <div className="sizes-grid">
                    {selectedItemForConfig.sizes.map(size => (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize({name: size.name, price: size.price})}
                        className={`size-button ${selectedSize?.name === size.name ? 'selected' : ''}`}
                      >
                        <span className="size-name">{size.name}</span>
                        <span className="size-price">+{formatPrice(size.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dodatki */}
              {selectedItemForConfig.addonGroups && selectedItemForConfig.addonGroups.length > 0 && (
                <div className="config-section">
                  <h3>Dodatki</h3>
                  {selectedItemForConfig.addonGroups.map(group => (
                    <div key={group.id} className="addon-group">
                      <h4>{group.name}</h4>
                      <div className="addons-grid">
                        {group.items.map(addon => (
                          <div key={addon.id} className="addon-item">
                            <label className="addon-checkbox-label">
                              <input
                                type="checkbox"
                                checked={selectedAddons[addon.id] || false}
                                onChange={(e) => setSelectedAddons(prev => ({
                                  ...prev,
                                  [addon.id]: e.target.checked
                                }))}
                              />
                              <span className="addon-name">{addon.name}</span>
                              <span className="addon-price">+{formatPrice(addon.price)}</span>
                            </label>
                            {selectedAddons[addon.id] && (
                              <div className="quantity-control">
                                <button onClick={() => setAddonCounts(prev => ({
                                  ...prev,
                                  [addon.id]: Math.max(1, (prev[addon.id] || 1) - 1)
                                }))}>-</button>
                                <span>{addonCounts[addon.id] || 1}</span>
                                <button onClick={() => setAddonCounts(prev => ({
                                  ...prev,
                                  [addon.id]: (prev[addon.id] || 1) + 1
                                }))}>+</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Składniki */}
              {selectedItemForConfig.ingredients && selectedItemForConfig.ingredients.length > 0 && (
                <div className="config-section">
                  <h3>Składniki</h3>
                  <div className="ingredients-grid">
                    {selectedItemForConfig.ingredients.map(ingredient => (
                      <label key={ingredient.id} className="ingredient-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedIngredients[ingredient.id] || false}
                          onChange={(e) => setSelectedIngredients(prev => ({
                            ...prev,
                            [ingredient.id]: e.target.checked
                          }))}
                        />
                        <span className="ingredient-name">{ingredient.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Ilość */}
              <div className="config-section">
                <h3>Ilość</h3>
                <div className="quantity-control">
                  <button onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}>-</button>
                  <span>{itemQuantity}</span>
                  <button onClick={() => setItemQuantity(itemQuantity + 1)}>+</button>
                </div>
              </div>

              {/* Uwagi */}
              <div className="config-section">
                <h3>Uwagi</h3>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Dodatkowe uwagi do dania..."
                  rows={3}
                />
              </div>
            </div>

            <div className="item-config-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowItemConfigModal(false)}
              >
                Anuluj
              </button>
              <button 
                className="add-to-cart-btn"
                onClick={addToCart}
              >
                Dodaj do koszyka
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenuPage;
