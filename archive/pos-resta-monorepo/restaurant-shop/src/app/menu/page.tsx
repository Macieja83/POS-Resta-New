'use client'

import { useEffect, useMemo, useState } from 'react'

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  image?: string
  variants: { name: string; price: number }[]
  allergens: string[]
  prepTime?: string
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Nasze Menu</h1>
          <p className="text-gray-600 text-lg">Wybierz z naszej szerokiej oferty pysznych dań</p>
        </div>

        {loading ? (
          <div className="text-gray-600">Ładowanie menu…</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : categories.length === 0 ? (
          <div className="text-gray-600">Brak danych menu.</div>
        ) : (
          <div className="flex gap-8">
            {/* Categories Sidebar */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Kategorie</h2>
                <nav className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategoryId(category.id)}
                      className={`w-full flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 ${
                        activeCategoryId === category.id
                          ? 'bg-blue-50 border-2 border-blue-200 shadow-md transform scale-105'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{category.name}</span>
                      <span className="ml-auto text-sm text-gray-500">{category.items.length}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {activeCategory?.name}
                </h2>
                <p className="text-gray-600">
                  {activeCategory?.items.length ?? 0} {(activeCategory?.items.length ?? 0) === 1 ? 'produkt' : 'produktów'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeCategory?.items.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <span className="text-5xl">{product.image ? '🖼️' : '🍽️'}</span>
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                        <span className="text-2xl font-bold text-[#2233AA]">{product.price} zł</span>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                      
                      <div className="space-y-3">
                        {product.variants?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Warianty:</h4>
                            <div className="space-y-1">
                              {product.variants.map((variant, index) => (
                                <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                                  {variant.name} ({variant.price} zł)
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          {product.prepTime && <span>⏱️ {product.prepTime}</span>}
                          {product.allergens?.length > 0 && <span>⚠️ alergeny</span>}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="w-full mt-6 bg-gradient-to-r from-[#2233AA] to-[#1a2a8a] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#1a2a8a] hover:to-[#112277] transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Dodaj do koszyka
                      </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-3xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-9xl">{selectedProduct.image ? '🖼️' : '🍽️'}</span>
              </div>
              
              <p className="text-gray-600 text-lg mb-6">{selectedProduct.description}</p>
              
              {selectedProduct.variants?.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Wybierz wariant:</h3>
                    <div className="space-y-2">
                      {selectedProduct.variants.map((variant, index) => (
                        <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input type="radio" name="variant" value={index} className="text-[#2233AA]" />
                          <span className="text-gray-900">{variant.name} ({variant.price} zł)</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Anuluj
                </button>
                <button className="flex-1 bg-gradient-to-r from-[#2233AA] to-[#1a2a8a] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#1a2a8a] hover:to-[#112277] transition-all duration-200">
                  Dodaj do koszyka - {selectedProduct.price} zł
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}