import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  product: {
    id: string
    name: string
    imageUrl?: string
  }
  variant?: {
    id: string
    name: string
  }
  modifiers: Array<{
    id: string
    name: string
    price: number
  }>
  quantity: number
  price: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  subtotal: number
  deliveryFee: number
  total: number
  addItem: (item: Omit<CartItem, 'id'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  toggleCart: () => void
  clearCart: () => void
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      subtotal: 0,
      deliveryFee: 9.99,
      total: 0,

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find(
          (i) =>
            i.product.id === item.product.id &&
            i.variant?.id === item.variant?.id &&
            JSON.stringify(i.modifiers) === JSON.stringify(item.modifiers)
        )

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === existingItem.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({
            items: [...items, { ...item, id: Math.random().toString(36).substr(2, 9) }],
          })
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }

        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },

      clearCart: () => {
        set({ items: [] })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

// Calculate totals whenever items change
useCart.subscribe((state) => {
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const deliveryFee = subtotal >= 120 ? 0 : state.deliveryFee
  const total = subtotal + deliveryFee

  if (subtotal !== state.subtotal || deliveryFee !== state.deliveryFee || total !== state.total) {
    useCart.setState({ subtotal, deliveryFee, total })
  }
})









