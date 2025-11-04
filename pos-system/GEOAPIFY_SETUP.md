# 🌍 Konfiguracja Geoapify API dla autocomplete adresów

## 📋 Co zostało zaimplementowane

### ✅ Nowe funkcje:
- **Autocomplete adresów** z numerami budynków
- **Automatyczne kody pocztowe** po wybraniu adresu
- **Geolokalizacja** z dokładnymi współrzędnymi
- **Filtrowanie** tylko dla Polski i Słupska
- **Responsywny design** z pięknym UI

### 🔧 Komponenty:
- `AddressAutocomplete.tsx` - nowy komponent autocomplete
- `AddressAutocomplete.css` - style dla komponentu
- Zintegrowany z `OrderCreator.tsx`

## 🚀 Konfiguracja

### 1. Pobierz darmowy klucz API Geoapify
1. Idź na: https://www.geoapify.com/
2. Zarejestruj się (darmowe)
3. Skopiuj klucz API z dashboard

### 2. Dodaj klucz do environment variables
Utwórz plik `.env` w folderze `apps/frontend/`:

```env
# Geoapify API Key for address autocomplete
VITE_GEOAPIFY_API_KEY=your_actual_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:4000/api
```

### 3. Restart aplikacji
```bash
cd apps/frontend
npm run dev
```

## 🎯 Jak działa

### Autocomplete adresów:
1. **Wpisz adres** - np. "ul. Słowackiego 1"
2. **Zobacz sugestie** - lista adresów z numerami budynków
3. **Wybierz adres** - automatycznie uzupełni:
   - Ulicę z numerem budynku
   - Miasto (Słupsk)
   - Kod pocztowy (76-200)
   - Współrzędne geograficzne

### Fallback:
- Jeśli nie ma klucza API, pokazuje zwykłe pole input
- Zachowuje wszystkie funkcje geolokalizacji

## 💰 Limity darmowego tieru

- **3000 zapytań/miesiąc** - wystarczy dla małej restauracji
- **Brak opłat** za pierwsze 3000 zapytań
- **Płatne** po przekroczeniu limitu

## 🔧 Dostosowanie

### Zmiana miasta:
W `AddressAutocomplete.tsx` zmień:
```typescript
filters={{
  country: 'PL',
  city: 'TwojeMiasto'  // Zmień tutaj
}}
```

### Zmiana limitu sugestii:
```typescript
limit={10}  // Zwiększ z 5 do 10
```

## 🐛 Rozwiązywanie problemów

### Brak sugestii adresów:
1. Sprawdź czy klucz API jest poprawny
2. Sprawdź czy masz internet
3. Sprawdź konsolę przeglądarki

### Błędy geolokalizacji:
1. Sprawdź czy adres jest w Słupsku
2. Sprawdź czy adres ma numer budynku
3. Sprawdź czy kod pocztowy jest poprawny

## 📱 Responsywność

- **Desktop** - pełna funkcjonalność
- **Mobile** - zoptymalizowane dla dotyku
- **Tablet** - dostosowane rozmiary

## 🎨 Style

- **Minimalistyczny design** - zgodny z aplikacją
- **Animacje** - płynne przejścia
- **Ikony** - intuicyjne symbole
- **Kolory** - zgodne z paletą aplikacji

















