import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, CompanySettings, UpdateCompanySettingsRequest } from '../../api/settings';
import './CompanySettingsForm.css';

interface CompanySettingsFormProps {
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

export const CompanySettingsForm: React.FC<CompanySettingsFormProps> = ({ onLocationUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: ''
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['companySettings'],
    queryFn: settingsApi.getCompanySettings,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: settingsApi.updateCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companySettings'] });
    },
  });

  useEffect(() => {
    if (settingsData?.data) {
      const settings = settingsData.data;
      setFormData({
        name: settings.name,
        address: settings.address,
        latitude: settings.latitude?.toString() || '',
        longitude: settings.longitude?.toString() || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || ''
      });
    }
  }, [settingsData]);

  const geocodeAddress = async (address: string) => {
    if (!address.trim()) return;

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      // Using OpenStreetMap Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=pl`
      );
      
      if (!response.ok) {
        throw new Error('Błąd podczas geokodowania adresu');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lon.toString()
        }));

        // Notify parent component about location update
        if (onLocationUpdate) {
          onLocationUpdate(lat, lon);
        }
      } else {
        setGeocodingError('Nie znaleziono adresu. Sprawdź poprawność adresu.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setGeocodingError('Błąd podczas geokodowania adresu. Spróbuj ponownie.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressBlur = () => {
    if (formData.address.trim() && (!formData.latitude || !formData.longitude)) {
      geocodeAddress(formData.address);
    }
  };

  const handleGeocodeClick = () => {
    if (formData.address.trim()) {
      geocodeAddress(formData.address);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Nazwa i adres są wymagane');
      return;
    }

    const updateData: UpdateCompanySettingsRequest = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      phone: formData.phone.trim() || undefined,
      email: formData.email.trim() || undefined,
      website: formData.website.trim() || undefined,
    };

    try {
      await updateSettingsMutation.mutateAsync(updateData);
      alert('Ustawienia firmy zostały zaktualizowane');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Błąd podczas aktualizacji ustawień');
    }
  };

  if (isLoading) {
    return (
      <div className="company-settings-loading">
        <div className="loading-spinner"></div>
        <p>Ładowanie ustawień firmy...</p>
      </div>
    );
  }

  return (
    <div className="company-settings-form">
      <h4>🏢 Informacje o firmie</h4>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nazwa firmy *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Wprowadź nazwę firmy"
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Adres firmy *</label>
          <div className="address-input-group">
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              onBlur={handleAddressBlur}
              required
              placeholder="Wprowadź pełny adres firmy"
            />
            <button
              type="button"
              onClick={handleGeocodeClick}
              disabled={isGeocoding || !formData.address.trim()}
              className="geocode-btn"
              title="Automatycznie znajdź współrzędne adresu"
            >
              {isGeocoding ? '🔄' : '📍'}
            </button>
          </div>
          {geocodingError && (
            <div className="geocoding-error">{geocodingError}</div>
          )}
        </div>

        <div className="coordinates-group">
          <div className="form-group">
            <label htmlFor="latitude">Szerokość geograficzna</label>
            <input
              type="number"
              id="latitude"
              name="latitude"
              value={formData.latitude}
              onChange={handleInputChange}
              step="any"
              placeholder="np. 52.2297"
            />
          </div>

          <div className="form-group">
            <label htmlFor="longitude">Długość geograficzna</label>
            <input
              type="number"
              id="longitude"
              name="longitude"
              value={formData.longitude}
              onChange={handleInputChange}
              step="any"
              placeholder="np. 21.0122"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="phone">Telefon</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="np. +48 123 456 789"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="np. kontakt@restauracja.pl"
          />
        </div>

        <div className="form-group">
          <label htmlFor="website">Strona internetowa</label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            placeholder="np. https://www.restauracja.pl"
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="save-btn"
          >
            {updateSettingsMutation.isPending ? 'Zapisywanie...' : '💾 Zapisz ustawienia'}
          </button>
        </div>
      </form>
    </div>
  );
};
