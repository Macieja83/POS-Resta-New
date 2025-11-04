'use client'

import Link from 'next/link'
import { useCart } from '@/lib/store/cart'
import { ShoppingCart, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { items, toggleCart } = useCart()
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">🍕 Restauracja</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/menu" className="text-sm font-medium hover:text-primary">
              Menu
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary">
              Kontakt
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCart}
            className="relative"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {itemCount}
              </span>
            )}
            <span className="ml-2 hidden sm:inline">Koszyk</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}









