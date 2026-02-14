import React, { useState, useEffect, useRef } from 'react';
import './AddressAutocomplete.css';

interface AddressData {
  street: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  onGeocodingComplete?: (coordinates: { latitude: number; longitude: number }) => void;
  onGeocodingError?: (error: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface AddressSuggestion {
  displayName: string;
  address: {
    houseNumber?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  latitude: number;
  longitude: number;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onGeocodingComplete,
  onGeocodingError,
  placeholder = "Wpisz adres...",
  disabled = false
}) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mapowanie polskich nazw ulic na angielskie
  const streetNameMapping: { [key: string]: string } = {
    'słowackiego': 'Slowackiego',
    'kościuszki': 'Kosciuszki',
    'armii krajowej': 'Armii Krajowej',
    'portowa': 'Portowa',
    'warszawska': 'Warszawska',
    'gdańska': 'Gdanska',
    'krakowska': 'Krakowska',
    'wrocławska': 'Wroclawska',
    'poznańska': 'Poznanska',
    'łódzka': 'Lodzka',
    'katowicka': 'Katowicka',
    'lubelska': 'Lubelska',
    'białostocka': 'Bialostocka',
    'rzeszowska': 'Rzeszowska',
    'szczecińska': 'Szczecinska',
    'olsztyńska': 'Olsztynska',
    'zielonogórska': 'Zielonogorska',
    'opolska': 'Opolska',
    'gorzowska': 'Gorzowska',
    'kielecka': 'Kielecka',
    'radomska': 'Radomska',
    'siedlecka': 'Siedlecka',
    'piotrkowska': 'Piotrkowska',
    'tomaszowska': 'Tomaszowska',
    'skierniewicka': 'Skierniewicka',
    'ostrołęcka': 'Ostrolecka',
    'ciechanowska': 'Ciechanowska',
    'płocka': 'Plocka',
    'suwalska': 'Suwalska',
    'łomżyńska': 'Lomzynska'
  };

  // Funkcja do tłumaczenia polskich nazw ulic na angielskie
  const translateStreetName = (streetName: string): string => {
    const lowerStreet = streetName.toLowerCase().trim();
    
    // Sprawdź czy ulica zaczyna się od "ul." lub "ulica"
    let cleanStreet = lowerStreet;
    if (cleanStreet.startsWith('ul. ')) {
      cleanStreet = cleanStreet.substring(4);
    } else if (cleanStreet.startsWith('ulica ')) {
      cleanStreet = cleanStreet.substring(6);
    }
    
    // Znajdź mapowanie
    for (const [polish, english] of Object.entries(streetNameMapping)) {
      if (cleanStreet.includes(polish)) {
        return cleanStreet.replace(polish, english);
      }
    }
    
    // Jeśli nie znaleziono mapowania, zwróć oryginalną nazwę
    return cleanStreet;
  };

  // Funkcja do wyszukiwania sugestii adresów
  const searchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      // Tłumacz polską nazwę ulicy na angielską
      const translatedQuery = translateStreetName(query.trim());
      const fullQuery = `${translatedQuery}, Slupsk, Poland`;
      const encodedQuery = encodeURIComponent(fullQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=10&countrycodes=pl&addressdetails=1`;
      
      console.log('Original query:', query);
      console.log('Translated query:', translatedQuery);
      console.log('Full query:', fullQuery);
      console.log('URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RestaApp/1.0 (POS System)',
          'Accept-Language': 'pl,en'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Nominatim response:', data);
      
      if (!data || data.length === 0) {
        return [];
      }
      
      return data
        .filter((item: any) => item.lat && item.lon)
        .map((item: any) => ({
          displayName: item.display_name,
          address: {
            houseNumber: item.address?.house_number,
            road: item.address?.road,
            city: item.address?.city || item.address?.town || item.address?.village || 'Słupsk',
            postcode: item.address?.postcode || '76-200',
            country: item.address?.country
          },
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon)
        }))
        .filter((suggestion: AddressSuggestion) => {
          // Filtruj tylko adresy w Słupsku (szerokie granice)
          const lat = suggestion.latitude;
          const lon = suggestion.longitude;
          return lat >= 54.3 && lat <= 54.6 && lon >= 16.8 && lon <= 17.2;
        });
        
    } catch (error) {
      console.error('Address suggestions error:', error);
      return [];
    }
  };

  // Funkcja do geocoding adresu
  const geocodeAddress = async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      // Tłumacz polską nazwę ulicy na angielską
      const translatedAddress = translateStreetName(address.trim());
      const fullAddress = `${translatedAddress}, Slupsk, Poland`;
      const encodedAddress = encodeURIComponent(fullAddress);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=pl&addressdetails=1`;
      
      console.log('Geocoding original address:', address);
      console.log('Geocoding translated address:', translatedAddress);
      console.log('Geocoding full address:', fullAddress);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RestaApp/1.0 (POS System)',
          'Accept-Language': 'pl,en'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Geocoding response:', data);
      
      if (!data || data.length === 0) {
        return null;
      }
      
      const result = data[0];
      if (!result.lat || !result.lon) {
        return null;
      }
      
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);
      
      // Sprawdź czy współrzędne są w Słupsku (szerokie granice)
      if (latitude < 54.3 || latitude > 54.6 || longitude < 16.8 || longitude > 17.2) {
        return null;
      }
      
      return { latitude, longitude };
      
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Obsługa wpisywania w polu input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    onChange({
      ...value,
      street: inputValue
    });

    // Wyczyść poprzedni timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Ustaw nowy timeout dla wyszukiwania
    const timeout = setTimeout(async () => {
      if (inputValue.length >= 2) {
        setIsLoadingSuggestions(true);
        try {
          const newSuggestions = await searchAddressSuggestions(inputValue);
          setSuggestions(newSuggestions);
          setShowSuggestions(newSuggestions.length > 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  // Obsługa wyboru sugestii
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    const street = suggestion.address.road && suggestion.address.houseNumber ? 
      `${suggestion.address.road} ${suggestion.address.houseNumber}` : 
      suggestion.displayName.split(',')[0];

    const newAddress: AddressData = {
      street: street,
      city: suggestion.address.city || 'Słupsk',
      postalCode: suggestion.address.postcode || '76-200',
      latitude: suggestion.latitude,
      longitude: suggestion.longitude
    };

    onChange(newAddress);
    setShowSuggestions(false);
    setSuggestions([]);

    // Wywołaj callback z koordinatami
    if (onGeocodingComplete) {
      onGeocodingComplete({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude
      });
    }
  };

  // Obsługa geocoding po wpisaniu adresu
  useEffect(() => {
    const performGeocoding = async () => {
      if (value.street && value.street.length >= 5 && !value.latitude) {
        setIsGeocoding(true);
        setGeocodingError(null);

        try {
          const coordinates = await geocodeAddress(value.street);
          if (coordinates) {
            onChange({
              ...value,
              latitude: coordinates.latitude,
              longitude: coordinates.longitude
            });

            if (onGeocodingComplete) {
              onGeocodingComplete(coordinates);
            }
          } else {
            setGeocodingError('Nie można zlokalizować adresu');
            if (onGeocodingError) {
              onGeocodingError('Nie można zlokalizować adresu');
            }
          }
        } catch (error) {
          const errorMessage = 'Błąd podczas geolokalizacji';
          setGeocodingError(errorMessage);
          if (onGeocodingError) {
            onGeocodingError(errorMessage);
          }
        } finally {
          setIsGeocoding(false);
        }
      }
    };

    const timeout = setTimeout(performGeocoding, 1000);
    return () => clearTimeout(timeout);
  }, [value.street, value.city, value.latitude, onChange, onGeocodingComplete, onGeocodingError]);

  // Obsługa kliknięcia poza komponentem
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="address-autocomplete-container" ref={inputRef}>
      <input
        ref={inputRef}
        type="text"
        value={value.street}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className="form-input address-input"
        autoComplete="off"
      />

      {/* Sugestie adresów */}
      {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
        <div className="address-suggestions">
          {isLoadingSuggestions && (
            <div className="suggestion-item loading">
              <span className="suggestion-icon">⏳</span>
              <span>Wyszukuję adresy...</span>
            </div>
          )}
          {!isLoadingSuggestions && suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <span className="suggestion-icon">📍</span>
              <div className="suggestion-content">
                <div className="suggestion-address">
                  {suggestion.address.road && suggestion.address.houseNumber ? 
                    `${suggestion.address.road} ${suggestion.address.houseNumber}` :
                    suggestion.displayName.split(',')[0]
                  }
                </div>
                <div className="suggestion-city">
                  {suggestion.address.city || 'Słupsk'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status geolokalizacji */}
      <div className="geocoding-status">
        {isGeocoding && (
          <div className="geocoding-indicator">
            <span className="geocoding-spinner">⏳</span>
            <span>Lokalizuję adres...</span>
          </div>
        )}

        {!isGeocoding && value.latitude && value.longitude && (
          <div className="geocoding-success">
            <span className="geocoding-icon">📍</span>
            <span>Adres zlokalizowany</span>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...value,
                  latitude: undefined,
                  longitude: undefined
                });
              }}
              className="geocoding-reset"
              title="Ponownie zlokalizuj adres"
            >
              🔄
            </button>
          </div>
        )}

        {geocodingError && (
          <div className="geocoding-error">
            <span className="geocoding-icon">⚠️</span>
            <span>{geocodingError}</span>
          </div>
        )}
      </div>
    </div>
  );
};