'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store/cart'
import { useFormValidation } from '@/lib/hooks/use-form-validation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import { MapPin, Clock, CreditCard, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createOrder } from '@/lib/api'
import type { CreateOrderRequest, OrderType } from '@restaurant-shop/shared'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, deliveryFee, total, clearCart } = useCart()
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  })

  const validationRules = {
    firstName: { required: true, minLength: 2 },
    lastName: { required: true, minLength: 2 },
    email: { 
      required: true, 
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      custom: (value: string) => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Nieprawidłowy format email'
        }
        return null
      }
    },
    phone: { 
      required: true, 
      pattern: /^[0-9+\-\s()]+$/,
      custom: (value: string) => {
        if (!/^[0-9+\-\s()]+$/.test(value)) {
          return 'Nieprawidłowy format telefonu'
        }
        if (value.replace(/[^0-9]/g, '').length < 9) {
          return 'Numer telefonu musi mieć co najmniej 9 cyfr'
        }
        return null
      }
    },
    address: { required: fulfillment === 'delivery', minLength: 5 },
    city: { required: fulfillment === 'delivery', minLength: 2 },
    postalCode: { 
      required: fulfillment === 'delivery', 
      pattern: /^\d{2}-\d{3}$/,
      custom: (value: string) => {
        if (fulfillment === 'delivery' && !/^\d{2}-\d{3}$/.test(value)) {
          return 'Kod pocztowy musi być w formacie 00-000'
        }
        return null
      }
    }
  }

  const { errors, validateForm, setFieldError } = useFormValidation(validationRules)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setFieldError(name, null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(formData)) {
      return
    }

    if (items.length === 0) {
      setError('Koszyk jest pusty')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Map cart items to POS System format
      const orderItems = items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        addons: item.modifiers.map(mod => ({
          id: mod.id,
          name: mod.name,
          price: mod.price,
          quantity: 1
        })),
        selectedSize: item.variant ? {
          name: item.variant.name,
          price: item.variant.price
        } : undefined
      }))

      // Determine order type
      const orderType: OrderType = fulfillment === 'delivery' ? 'DELIVERY' : 'PICKUP'

      // Build order request
      const orderRequest: CreateOrderRequest = {
        type: orderType,
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
          email: formData.email,
          ...(fulfillment === 'delivery' && formData.address && {
            address: {
              street: formData.address,
              city: formData.city,
              postalCode: formData.postalCode
            }
          })
        },
        items: orderItems,
        ...(formData.notes && { notes: formData.notes }),
        promisedTime: 30 // Default 30 minutes
      }

      console.log('Submitting order to POS System:', orderRequest)

      // Send order to POS System
      const createdOrder = await createOrder(orderRequest)
      
      console.log('Order created successfully:', createdOrder)
      
      setOrderId(createdOrder.id)
      clearCart()
      setIsSuccess(true)
    } catch (err: any) {
      console.error('Failed to create order:', err)
      setError(err.message || 'Nie udało się złożyć zamówienia. Spróbuj ponownie.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Koszyk jest pusty</h1>
          <p className="text-muted-foreground mb-6">Dodaj produkty do koszyka, aby przejść do zamówienia</p>
          <Button asChild>
            <Link href="/menu">Przejdź do menu</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4 font-[var(--font-plus-jakarta)]">
            Zamówienie złożone!
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Dziękujemy za zamówienie. Otrzymasz potwierdzenie na adres email.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/menu">Zamów ponownie</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">Strona główna</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-6">
              <Link href="/menu" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Powrót do menu</span>
              </Link>
            </Button>
            <h1 className="text-4xl font-bold text-foreground mb-2 font-[var(--font-plus-jakarta)]">
              Składanie zamówienia
            </h1>
            <p className="text-muted-foreground text-lg">
              Uzupełnij dane i wybierz sposób odbioru
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Dane kontaktowe</span>
                  </CardTitle>
                  <CardDescription>
                    Podaj swoje dane kontaktowe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Imię *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={errors.firstName ? 'border-destructive' : ''}
                        />
                        {errors.firstName && (
                          <div className="flex items-center space-x-1 mt-1 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.firstName}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="lastName">Nazwisko *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={errors.lastName ? 'border-destructive' : ''}
                        />
                        {errors.lastName && (
                          <div className="flex items-center space-x-1 mt-1 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span>{errors.lastName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <div className="flex items-center space-x-1 mt-1 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && (
                        <div className="flex items-center space-x-1 mt-1 text-sm text-destructive">
                          <AlertCircle className="w-4 h-4" />
                          <span>{errors.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Fulfillment Type */}
                    <div>
                      <Label className="text-base font-semibold">Sposób odbioru *</Label>
                      <RadioGroup
                        value={fulfillment}
                        onValueChange={(value: 'delivery' | 'pickup') => setFulfillment(value)}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery" className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>Dostawa</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup" className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Odbiór osobisty</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Delivery Address */}
                    {fulfillment === 'delivery' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="address">Adres *</Label>
                          <Input
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="ul. Przykładowa 123"
                            className={errors.address ? 'border-destructive' : ''}
                          />
                          {errors.address && (
                            <div className="flex items-center space-x-1 mt-1 text-sm text-destructive">
                              <AlertCircle className="w-4 h-4" />
                              <span>{errors.address}</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">Miasto *</Label>
                            <Input
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              className={errors.city ? 'border-destructive' : ''}
                            />
                            {errors.city && (
                              <div className="flex items-center space-x-1 mt-1 text-sm text-destructive">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.city}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="postalCode">Kod pocztowy *</Label>
                            <Input
                              id="postalCode"
                              name="postalCode"
                              value={formData.postalCode}
                              onChange={handleInputChange}
                              placeholder="00-000"
                              className={errors.postalCode ? 'border-destructive' : ''}
                            />
                            {errors.postalCode && (
                              <div className="flex items-center space-x-1 mt-1 text-sm text-destructive">
                                <AlertCircle className="w-4 h-4" />
                                <span>{errors.postalCode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="notes">Notatki do zamówienia</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Dodatkowe informacje..."
                        rows={3}
                      />
                    </div>

                    {error && (
                      <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                        <div className="flex items-center space-x-2 text-destructive">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-medium">{error}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Przetwarzanie...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Złóż zamówienie</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Podsumowanie zamówienia</CardTitle>
                  <CardDescription>
                    {items.length} {items.length === 1 ? 'produkt' : 'produktów'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <span className="text-lg">🍽️</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product.name}</h4>
                          {item.variant && (
                            <p className="text-sm text-muted-foreground">
                              {item.variant.name}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Ilość: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Suma częściowa:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dostawa:</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Razem:</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Informacje o dostawie</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Czas dostawy: 30-45 minut</p>
                    <p>• Minimalna wartość zamówienia: {formatPrice(20)}</p>
                    <p>• Darmowa dostawa od {formatPrice(120)}</p>
                    <p>• Płatność gotówką lub kartą</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}