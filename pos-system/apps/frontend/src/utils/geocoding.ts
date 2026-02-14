// Geocoding utility using Nominatim API (OpenStreetMap)
// Free and no API key required

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  address: {
    houseNumber?: string;
    road?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

export interface GeocodingError {
  error: string;
  message: string;
}

// Geocode an address to coordinates
export async function geocodeAddress(address: string, city: string = 'Słupsk'): Promise<GeocodingResult | GeocodingError> {
  try {
    // Try original address first, then parsed address
    const originalAddress = `${address.trim()}, ${city}, Poland`;
    const parsedAddress = parseAddress(address);
    const parsedFullAddress = `${parsedAddress}, ${city}, Poland`;
    
    console.log('Original address:', originalAddress);
    console.log('Parsed address:', parsedFullAddress);
    
    // Try with original address first
    let fullAddress = originalAddress;
    let encodedAddress = encodeURIComponent(fullAddress);
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=pl&addressdetails=1`;
    
    console.log('Trying URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RestaApp/1.0 (POS System)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('Geocoding response:', data);
    
    if (!data || data.length === 0) {
      console.warn('No results found for original address:', fullAddress);
      
      // Try with parsed address if original didn't work
      if (fullAddress === originalAddress && parsedFullAddress !== originalAddress) {
        console.log('Trying with parsed address:', parsedFullAddress);
        const parsedEncodedAddress = encodeURIComponent(parsedFullAddress);
        const parsedUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${parsedEncodedAddress}&limit=1&countrycodes=pl&addressdetails=1`;
        
        console.log('Trying parsed URL:', parsedUrl);
        
        const parsedResponse = await fetch(parsedUrl, {
          headers: {
            'User-Agent': 'RestaApp/1.0 (POS System)'
          }
        });
        
        if (parsedResponse.ok) {
          const parsedData = await parsedResponse.json();
          console.log('Parsed geocoding response:', parsedData);
          
          if (parsedData && parsedData.length > 0) {
            const result = parsedData[0];
            if (result.lat && result.lon) {
              const latitude = parseFloat(result.lat);
              const longitude = parseFloat(result.lon);
              
              console.log('Geocoding success with parsed address:', {
                address: parsedFullAddress,
                coordinates: { latitude, longitude },
                displayName: result.display_name
              });
              
              return {
                latitude,
                longitude,
                displayName: result.display_name,
                address: {
                  houseNumber: result.address?.house_number,
                  road: result.address?.road,
                  city: result.address?.city || result.address?.town || result.address?.village,
                  postcode: result.address?.postcode,
                  country: result.address?.country
                }
              };
            }
          }
        }
      }
      
      return {
        error: 'NOT_FOUND',
        message: 'Adres nie został znaleziony'
      };
    }
    
    const result = data[0];
    
    // Validate the result
    if (!result.lat || !result.lon) {
      return {
        error: 'INVALID_RESULT',
        message: 'Nieprawidłowe współrzędne z serwisu geolokalizacji'
      };
    }
    
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);
    
    // Check if coordinates are within Słupsk area
    if (!isWithinSlupsk(latitude, longitude)) {
      console.warn('Coordinates outside Słupsk area:', { latitude, longitude });
    }
    
    console.log('Geocoding success:', {
      address: fullAddress,
      coordinates: { latitude, longitude },
      displayName: result.display_name,
      houseNumber: result.address?.house_number,
      road: result.address?.road
    });
    
    return {
      latitude,
      longitude,
      displayName: result.display_name,
      address: {
        houseNumber: result.address?.house_number,
        road: result.address?.road,
        city: result.address?.city || result.address?.town || result.address?.village,
        postcode: result.address?.postcode,
        country: result.address?.country
      }
    };
    
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      error: 'NETWORK_ERROR',
      message: 'Błąd połączenia z serwisem geolokalizacji'
    };
  }
}

// Reverse geocoding - get address from coordinates
export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | GeocodingError> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RestaApp/1.0 (POS System)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.lat || !data.lon) {
      return {
        error: 'NOT_FOUND',
        message: 'Nie można znaleźć adresu dla podanych współrzędnych'
      };
    }
    
    return {
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      displayName: data.display_name,
      address: {
        houseNumber: data.address?.house_number,
        road: data.address?.road,
        city: data.address?.city || data.address?.town || data.address?.village,
        postcode: data.address?.postcode,
        country: data.address?.country
      }
    };
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      error: 'NETWORK_ERROR',
      message: 'Błąd połączenia z serwisem geolokalizacji'
    };
  }
}

// Parse and normalize address for better geocoding accuracy
export function parseAddress(address: string): string {
  // Remove extra spaces and normalize
  let normalized = address.trim().replace(/\s+/g, ' ');
  
  console.log('Original address:', address);
  console.log('Normalized address:', normalized);
  
  // Only add "ul." if the address doesn't already have a prefix and looks like a street name
  if (!normalized.toLowerCase().includes('ul.') && 
      !normalized.toLowerCase().includes('ulica') &&
      !normalized.toLowerCase().includes('al.') &&
      !normalized.toLowerCase().includes('aleja') &&
      !normalized.toLowerCase().includes('pl.') &&
      !normalized.toLowerCase().includes('plac') &&
      !normalized.toLowerCase().includes('os.') &&
      !normalized.toLowerCase().includes('osiedle')) {
    
    // Check if it looks like a street name (contains letters and possibly numbers)
    if (/[a-zA-Z]/.test(normalized)) {
      normalized = `ul. ${normalized}`;
    }
  }
  
  console.log('Final parsed address:', normalized);
  return normalized;
}

// Validate if coordinates are within Słupsk area
export function isWithinSlupsk(latitude: number, longitude: number): boolean {
  // Słupsk bounds (approximate)
  const minLat = 54.4;
  const maxLat = 54.5;
  const minLng = 16.9;
  const maxLng = 17.1;
  
  return latitude >= minLat && latitude <= maxLat && longitude >= minLng && longitude <= maxLng;
}

// Address suggestion interface
export interface AddressSuggestion {
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

// Search for address suggestions
export async function searchAddressSuggestions(query: string, city: string = 'Słupsk'): Promise<AddressSuggestion[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const fullQuery = `${query.trim()}, ${city}, Poland`;
    const encodedQuery = encodeURIComponent(fullQuery);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedQuery}&limit=5&countrycodes=pl&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RestaApp/1.0 (POS System)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return [];
    }
    
    const results = data as unknown as Array<{ lat?: string; lon?: string; display_name?: string; address?: { house_number?: string; road?: string; city?: string; town?: string; village?: string; postcode?: string; country?: string } }>;

    return results
      .filter((item) => item.lat && item.lon)
      .map((item) => ({
        displayName: item.display_name,
        address: {
          houseNumber: item.address?.house_number,
          road: item.address?.road,
          city: item.address?.city || item.address?.town || item.address?.village,
          postcode: item.address?.postcode,
          country: item.address?.country
        },
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon)
      }))
      .filter((suggestion: AddressSuggestion) => 
        isWithinSlupsk(suggestion.latitude, suggestion.longitude)
      );
      
  } catch (error) {
    console.error('Address suggestions error:', error);
    return [];
  }
}
