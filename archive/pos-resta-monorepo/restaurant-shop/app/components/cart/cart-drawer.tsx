'use client'

import { useCart } from '@/lib/store/cart'
import { Button } from '@/components/ui/button'
import { X, Plus, Minus, Trash2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

export function CartDrawer() {
  const { 
    isOpen, 
    toggleCart, 
    items, 
    updateQuantity, 
    removeItem, 
    subtotal, 
    deliveryFee, 
    total 
  } = useCart()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={toggleCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Koszyk</h2>
            <Button variant="ghost" size="sm" onClick={toggleCart}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Koszyk jest pusty</p>
                <Button asChild className="mt-4">
                  <Link href="/menu">Przejdź do menu</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant.name}
                        </p>
                      )}
                      {item.modifiers.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {item.modifiers.map((mod) => mod.name).join(', ')}
                        </div>
                      )}
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Suma częściowa:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dostawa:</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Razem:</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              
              <Button asChild className="w-full">
                <Link href="/checkout">Przejdź do zamówienia</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



