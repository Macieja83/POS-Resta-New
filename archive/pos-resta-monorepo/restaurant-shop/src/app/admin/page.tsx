export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Panel Administracyjny</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-600">Dzisiejsze zamówienia</h3>
          <p className="text-3xl font-bold text-[#2233AA]">24</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-600">Przychód dzisiaj</h3>
          <p className="text-3xl font-bold text-green-500">1,247 zł</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-600">Oczekujące</h3>
          <p className="text-3xl font-bold text-yellow-500">3</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-600">W przygotowaniu</h3>
          <p className="text-3xl font-bold text-blue-500">7</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Ostatnie zamówienia</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Numer</th>
                <th className="text-left py-3">Klient</th>
                <th className="text-left py-3">Typ</th>
                <th className="text-left py-3">Status</th>
                <th className="text-left py-3">Kwota</th>
                <th className="text-left py-3">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3">#ORD-001</td>
                <td className="py-3">Jan Kowalski</td>
                <td className="py-3">Dostawa</td>
                <td className="py-3">
                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">
                    Oczekujące
                  </span>
                </td>
                <td className="py-3">79,96 zł</td>
                <td className="py-3">
                  <button className="bg-[#2233AA] text-white px-3 py-1 rounded text-sm hover:bg-[#1a2a8a]">
                    Akceptuj
                  </button>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">#ORD-002</td>
                <td className="py-3">Anna Nowak</td>
                <td className="py-3">Odbiór</td>
                <td className="py-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                    W przygotowaniu
                  </span>
                </td>
                <td className="py-3">45,50 zł</td>
                <td className="py-3">
                  <button className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                    Gotowe
                  </button>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-3">#ORD-003</td>
                <td className="py-3">Piotr Wiśniewski</td>
                <td className="py-3">Dostawa</td>
                <td className="py-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                    W drodze
                  </span>
                </td>
                <td className="py-3">92,30 zł</td>
                <td className="py-3">
                  <button className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600">
                    Zakończ
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Zarządzanie produktami</h3>
          <p className="text-gray-600 mb-4">Dodaj, edytuj lub usuń produkty z menu</p>
          <button className="bg-[#2233AA] text-white px-4 py-2 rounded hover:bg-[#1a2a8a]">
            Zarządzaj produktami
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Ustawienia</h3>
          <p className="text-gray-600 mb-4">Konfiguruj godziny otwarcia, strefy dostaw</p>
          <button className="bg-[#2233AA] text-white px-4 py-2 rounded hover:bg-[#1a2a8a]">
            Otwórz ustawienia
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Raporty</h3>
          <p className="text-gray-600 mb-4">Zobacz statystyki i raporty sprzedaży</p>
          <button className="bg-[#2233AA] text-white px-4 py-2 rounded hover:bg-[#1a2a8a]">
            Zobacz raporty
          </button>
        </div>
      </div>
    </div>
  )
}

