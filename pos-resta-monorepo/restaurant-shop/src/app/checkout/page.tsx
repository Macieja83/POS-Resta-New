export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Zamówienie</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Dane zamówienia</h2>
          
          <form className="space-y-6">
            {/* Delivery Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Typ dostawy</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input type="radio" name="delivery" value="delivery" className="mr-2" defaultChecked />
                  Dostawa
                </label>
                <label className="flex items-center">
                  <input type="radio" name="delivery" value="pickup" className="mr-2" />
                  Odbiór osobisty
                </label>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2">Adres dostawy</label>
              <input
                type="text"
                placeholder="Ulica i numer"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2233AA] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Miasto</label>
                <input
                  type="text"
                  placeholder="Miasto"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2233AA] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Kod pocztowy</label>
                <input
                  type="text"
                  placeholder="00-000"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2233AA] focus:border-transparent"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <label className="block text-sm font-medium mb-2">Numer telefonu</label>
              <input
                type="tel"
                placeholder="+48 123 456 789"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2233AA] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="email@example.com"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2233AA] focus:border-transparent"
              />
            </div>

            {/* Time Slot */}
            <div>
              <label className="block text-sm font-medium mb-2">Preferowany czas</label>
              <select className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#2233AA] focus:border-transparent">
                <option>Jak najszybciej</option>
                <option>12:00 - 12:30</option>
                <option>12:30 - 13:00</option>
                <option>13:00 - 13:30</option>
                <option>13:30 - 14:00</option>
              </select>
            </div>

            {/* Coupon */}
            <div>
              <label className="block text-sm font-medium mb-2">Kod rabatowy</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Wprowadź kod"
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-[#2233AA] focus:border-transparent"
                />
                <button
                  type="button"
                  className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600"
                >
                  Zastosuj
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Podsumowanie zamówienia</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Margherita (Mała)</span>
              <span>25,99 zł</span>
            </div>
            <div className="flex justify-between">
              <span>Classic Burger</span>
              <span>24,99 zł</span>
            </div>
            <div className="flex justify-between">
              <span>Sałatka Cezar</span>
              <span>18,99 zł</span>
            </div>
            
            <hr className="my-4" />
            
            <div className="flex justify-between">
              <span>Suma częściowa:</span>
              <span>69,97 zł</span>
            </div>
            <div className="flex justify-between">
              <span>Dostawa:</span>
              <span>9,99 zł</span>
            </div>
            
            <hr className="my-4" />
            
            <div className="flex justify-between text-lg font-semibold">
              <span>Razem:</span>
              <span>79,96 zł</span>
            </div>
          </div>

          <button className="w-full bg-[#2233AA] text-white py-3 rounded-lg hover:bg-[#1a2a8a] mt-6">
            Przejdź do płatności
          </button>
        </div>
      </div>
    </div>
  )
}

