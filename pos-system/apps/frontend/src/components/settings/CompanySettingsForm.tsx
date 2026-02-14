import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi, UpdateCompanySettingsRequest } from '../../api/settings';
import { AddressAutocomplete } from '../orders/AddressAutocomplete';
import './CompanySettingsForm.css';

interface CompanySettingsFormProps {
  onLocationUpdate?: (latitude: number, longitude: number) => void;
}

function formatAddressLine(street: string, postalCode: string, city: string): string {
  const parts = [street];
  if (postalCode || city) {
    parts.push([postalCode, city].filter(Boolean).join(' '));
  }
  return parts.filter(Boolean).join(', ');
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

  const [addressData, setAddressData] = useState({
    street: '',
    city: 'Słupsk',
    postalCode: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined
  });

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
      setAddressData({
        street: settings.address || '',
        city: 'Słupsk',
        postalCode: '',
        latitude: settings.latitude,
        longitude: settings.longitude
      });
    }
  }, [settingsData]);

  const handleAddressChange = (address: { street: string; city: string; postalCode: string; latitude?: number; longitude?: number }) => {
    setAddressData({
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      latitude: address.latitude,
      longitude: address.longitude
    });
    setFormData(prev => ({
      ...prev,
      address: formatAddressLine(address.street, address.postalCode, address.city),
      latitude: address.latitude?.toString() ?? prev.latitude,
      longitude: address.longitude?.toString() ?? prev.longitude
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
          <label htmlFor="address">Adres lokalu *</label>
          <AddressAutocomplete
            value={addressData}
            onChange={handleAddressChange}
            onGeocodingComplete={(coordinates) => {
              setFormData(prev => ({
                ...prev,
                latitude: coordinates.latitude.toString(),
                longitude: coordinates.longitude.toString()
              }));
              if (onLocationUpdate) {
                onLocationUpdate(coordinates.latitude, coordinates.longitude);
              }
            }}
            placeholder="Wpisz adres z numerem budynku..."
            disabled={false}
          />
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
