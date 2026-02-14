'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCart } from '@/lib/store/cart'
import { Button } from '@/components/ui/button'
import { Plus, Minus, ShoppingCart, Clock, AlertTriangle, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  image?: string
  variants: { name: string; price: number }[]
  allergens: string[]
  prepTime?: string
  categoryId: string
}

type MenuCategory = {
  id: string
  name: string
  items: MenuItem[]
}

export default function MenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<{ name: string; price: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/menu', { cache: 'no-store' })
        if (!res.ok) throw new Error('POS unavailable')
        const data = await res.json()
        const cats: MenuCategory[] = data.categories ?? []
        setCategories(cats)
        setActiveCategoryId(cats[0]?.id ?? '')
      } catch (e) {
        setError('Nie udało się pobrać menu z POS. Spróbuj ponownie później.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId),
    [categories, activeCategoryId]
  )

  const handleAddToCart = (product: MenuItem) => {
    const variant = selectedVariant || product.variants[0] || { name: 'Standard', price: product.price }
    
    addItem({
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.image
      },
      variant: {
        id: variant.name,
        name: variant.name,
        price: variant.price
      },
      modifiers: [],
      quantity: 1,
      price: variant.price
    })
    
    setSelectedProduct(null)
    setSelectedVariant(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 font-[var(--font-plus-jakarta)]">
            Nasze Menu
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Wybierz z naszej szerokiej oferty pysznych dań przygotowanych z najświeższych składników
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground text-lg">Ładowanie menu...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Błąd ładowania</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Brak danych menu</h3>
            <p className="text-muted-foreground">Menu nie jest obecnie dostępne</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Categories Sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="glass rounded-2xl p-6 sticky top-8 shadow-soft">
                <h2 className="text-xl font-semibold text-foreground mb-6 font-[var(--font-plus-jakarta)]">Kategorie</h2>
                <nav className="space-y-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 group ${
                        activeCategoryId === category.id
                          ? 'bg-primary text-primary-foreground shadow-medium transform scale-105'
                          : 'hover:bg-muted/50 border border-transparent hover:border-border/50'
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        activeCategoryId === category.id
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {category.items.length}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2 font-[var(--font-plus-jakarta)]">
                  {activeCategory?.name}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {activeCategory?.items.length ?? 0} {(activeCategory?.items.length ?? 0) === 1 ? 'produkt' : 'produktów'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {activeCategory?.items.map((product, index) => (
                  <div
                    key={product.id}
                    className="glass rounded-2xl overflow-hidden hover:shadow-medium transition-all duration-300 hover:-translate-y-2 group animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="h-56 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                      <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                        {product.image ? '🖼️' : '🍽️'}
                      </span>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-foreground font-[var(--font-plus-jakarta)] group-hover:text-primary transition-colors duration-200">
                          {product.name}
                        </h3>
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                      
                      <p className="text-muted-foreground mb-6 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                      
                      <div className="space-y-4 mb-6">
                        {product.variants?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">Warianty:</h4>
                            <div className="space-y-2">
                              {product.variants.map((variant, index) => (
                                <div key={index} className="text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                                  {variant.name} - {formatPrice(variant.price)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          {product.prepTime && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{product.prepTime}</span>
                            </div>
                          )}
                          {product.allergens?.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <AlertTriangle className="w-4 h-4" />
                              <span>alergeny</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => setSelectedProduct(product)}
                        className="w-full group-hover:shadow-medium transition-all duration-200 transform group-hover:scale-105"
                        size="lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Dodaj do koszyka
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-strong animate-scale-in">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-4xl font-bold text-foreground font-[var(--font-plus-jakarta)]">
                  {selectedProduct.name}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedProduct(null)
                    setSelectedVariant(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              
              <div className="h-80 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl flex items-center justify-center mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                <span className="text-9xl relative z-10">
                  {selectedProduct.image ? '🖼️' : '🍽️'}
                </span>
              </div>
              
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                {selectedProduct.description}
              </p>
              
              {selectedProduct.variants?.length > 0 && (
                <div className="space-y-6 mb-8">
                  <h3 className="text-xl font-semibold text-foreground font-[var(--font-plus-jakarta)]">
                    Wybierz wariant:
                  </h3>
                  <div className="space-y-3">
                    {selectedProduct.variants.map((variant, index) => (
                      <label 
                        key={index} 
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedVariant?.name === variant.name
                            ? 'border-primary bg-primary/5 shadow-soft'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input 
                            type="radio" 
                            name="variant" 
                            value={index}
                            checked={selectedVariant?.name === variant.name}
                            onChange={() => setSelectedVariant(variant)}
                            className="text-primary focus:ring-primary"
                          />
                          <span className="text-foreground font-medium">{variant.name}</span>
                        </div>
                        <span className="text-primary font-bold text-lg">
                          {formatPrice(variant.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProduct(null)
                    setSelectedVariant(null)
                  }}
                  className="flex-1"
                  size="lg"
                >
                  Anuluj
                </Button>
                <Button
                  onClick={() => handleAddToCart(selectedProduct)}
                  className="flex-1"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj do koszyka - {formatPrice(selectedVariant?.price || selectedProduct.price)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}