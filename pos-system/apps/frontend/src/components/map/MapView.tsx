import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders';
import { settingsApi } from '../../api/settings';
import { employeesApi } from '../../api/employees';
import { Order } from '../../types/shared';

interface MapViewProps {
  selectedOrder?: Order | null;
  filterType?: string;
  onCancelOrder?: (order: Order) => void;
  onDeleteOrder?: (order: Order) => void;
  onEditOrder?: (order: Order) => void;
  onRestoreOrder?: (order: Order) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export const MapView: React.FC<MapViewProps> = ({ 
  selectedOrder,
  filterType = 'all',
  onCancelOrder,
  onDeleteOrder,
  onEditOrder,
  onRestoreOrder
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const driverMarkersRef = useRef<any[]>([]);

  const { data: ordersWithGeo, error: ordersError } = useQuery({
    queryKey: ['orders-geo'],
    queryFn: ordersApi.getOrdersWithGeo,
    refetchOnWindowFocus: false, // Disable refetch on focus for better performance
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchIntervalInBackground: true,
    refetchOnMount: true, // Ensure data loads on mount
    retry: 2, // Retry twice on failure
  });

  // Log errors for debugging
  useEffect(() => {
    if (ordersError) {
      console.error('❌ Error loading orders with geo:', ordersError);
    }
  }, [ordersError]);

  const { data: companySettings } = useQuery({
    queryKey: ['companySettings'],
    queryFn: settingsApi.getCompanySettings,
  });

  const { data: driverLocations, error: driverLocationsError, isLoading: driverLocationsLoading } = useQuery({
    queryKey: ['driverLocations'],
    queryFn: async () => {
      console.log('📍 Fetching driver locations...');
      const result = await employeesApi.getDriverLocations();
      console.log('📍 Driver locations fetched:', result);
      return result;
    },
    refetchInterval: 5000, // Refresh every 5 seconds for tighter live updates
    refetchOnWindowFocus: false, // Disable refetch on focus for better performance
    staleTime: 5 * 1000, // Cache for 5 seconds
    retry: 3, // Retry 3 times on failure
  });

  // Set up global functions for popup buttons
  useEffect(() => {
    if (onCancelOrder) {
      (window as any).cancelOrder = (orderId: string) => {
        const order = ordersWithGeo?.data?.find((o: Order) => o.id === orderId);
        if (order) {
          onCancelOrder(order);
        }
      };
    }
    
    if (onDeleteOrder) {
      (window as any).deleteOrder = (orderId: string) => {
        const order = ordersWithGeo?.data?.find((o: Order) => o.id === orderId);
        if (order) {
          onDeleteOrder(order);
        }
      };
    }

    if (onEditOrder) {
      (window as any).editOrder = (orderId: string) => {
        const order = ordersWithGeo?.data?.find((o: Order) => o.id === orderId);
        if (order) {
          onEditOrder(order);
        }
      };
    }

    if (onRestoreOrder) {
      (window as any).restoreOrder = (orderId: string) => {
        const order = ordersWithGeo?.data?.find((o: Order) => o.id === orderId);
        if (order) {
          onRestoreOrder(order);
        }
      };
    }

    // Cleanup on unmount
    return () => {
      delete (window as any).cancelOrder;
      delete (window as any).deleteOrder;
      delete (window as any).editOrder;
      delete (window as any).restoreOrder;
    };
  }, [onCancelOrder, onDeleteOrder, onEditOrder, onRestoreOrder, ordersWithGeo]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !companySettings?.data) return;

    // Initialize map
    const L = window.L;
    if (!L) {
      console.error('Leaflet not loaded');
      return;
    }

    const settings = companySettings.data;
    const lat = settings.latitude || 54.46;
    const lng = settings.longitude || 17.02;
    const address = settings.address || 'ul. Szczecinska 83, 76-200 Słupsk';

    // Center on restaurant location with wider zoom
    const map = L.map(mapRef.current).setView([lat, lng], 14);
    
    // Add restaurant marker
    const restaurantMarker = L.marker([lat, lng], {
      title: 'Restauracja'
    }).addTo(map);
    
    restaurantMarker.bindPopup(`
      <div style="min-width: 200px; font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
          🏪 Restauracja
        </h3>
        <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Adres:</strong> ${address}</p>
        <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Współrzędne:</strong> ${lat}, ${lng}</p>
      </div>
    `);
    
    restaurantMarker.setIcon(L.divIcon({
      className: 'restaurant-marker',
      html: `<div style="background-color: #1e40af; color: white; padding: 4px; border-radius: 6px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 12px; position: relative;">
        <div style="position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-bottom: 4px solid #1e40af;"></div>
        🏪
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 20],
    }));
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [companySettings]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Check if ordersWithGeo has valid data structure
    if (!ordersWithGeo || !ordersWithGeo.success || !Array.isArray(ordersWithGeo.data)) {
      console.warn('⚠️ Invalid orders data structure:', ordersWithGeo);
      return;
    }

    const L = window.L;
    if (!L) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter orders based on filterType
    let filteredOrders = ordersWithGeo.data;
    
    if (filterType === 'in_progress') {
      // Show only orders with assigned driver
      filteredOrders = ordersWithGeo.data.filter((order: Order) => 
        order.assignedEmployee && order.assignedEmployee.id
      );
    } else if (filterType === 'pending_acceptance') {
      filteredOrders = ordersWithGeo.data.filter((order: Order) =>
        order.status === 'PENDING' || order.status === 'PENDING_ACCEPTANCE'
      );
    } else if (filterType === 'DELIVERY') {
      // Show only delivery orders (they have geolocation)
      filteredOrders = ordersWithGeo.data.filter((order: Order) => 
        order.type === 'DELIVERY'
      );
    } else if (filterType !== 'all' && filterType !== 'delivery') {
      // For other filters (TAKEAWAY, DINE_IN), don't show any markers (only delivery orders have geolocation)
      filteredOrders = [];
    }

    // Add markers for orders with geolocation
    filteredOrders.forEach((order: Order) => {
      if (order.delivery?.address?.latitude && order.delivery?.address?.longitude) {
        const { latitude, longitude } = order.delivery.address;
        
        // Get color based on promised time (same logic as CountdownTimer)
        const getTimerColor = (order: Order): string => {
          if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
            return order.status === 'COMPLETED' ? '#059669' : '#ef4444';
          }
          
          if (!order.promisedTime) {
            return '#3b82f6'; // blue for orders without promised time
          }
          
          const orderTime = new Date(order.createdAt).getTime();
          const currentTime = new Date().getTime();
          const promisedTimeMs = order.promisedTime * 60 * 1000; // convert minutes to milliseconds
          const deadline = orderTime + promisedTimeMs;
          const remaining = deadline - currentTime;
          
          if (remaining <= 0) {
            return '#ef4444'; // red - expired
          }
          if (remaining <= 300000) { // 5 minutes in milliseconds
            return '#f59e0b'; // orange - warning
          }
          return '#10b981'; // green - on time
        };

        const getStatusText = (status: string): string => {
          switch (status) {
            case 'OPEN': return 'Otwarte';
            case 'IN_PROGRESS': return 'W realizacji';
            case 'READY': return 'Gotowe';
            case 'COMPLETED': return 'Zrealizowane';
            case 'CANCELLED': return 'Anulowane';
            default: return status;
          }
        };
        
        // Create custom marker
        const marker = L.marker([latitude, longitude], {
          title: order.orderNumber || order.id,
        }).addTo(map);

        // Add popup with more detailed information
        const popupContent = `
          <div style="min-width: 220px; font-family: Arial, sans-serif; cursor: pointer;" onclick="window.editOrder('${order.id}')">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${order.orderNumber || order.id}</h3>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Klient:</strong> ${order.customer?.name || 'Brak danych'}</p>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Status:</strong> ${getStatusText(order.status)}</p>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Wartość:</strong> ${order.total.toFixed(2)} zł</p>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Adres:</strong> ${order.delivery.address.street}, ${order.delivery.address.city}</p>
            ${order.assignedEmployee ? `<p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Kierowca:</strong> ${order.assignedEmployee.name}</p>` : ''}
            ${order.notes ? `<p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Uwagi:</strong> ${order.notes}</p>` : ''}
            <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
              ${order.status !== 'CANCELLED' && order.status !== 'COMPLETED' && onCancelOrder ? 
                `<button onclick="window.cancelOrder('${order.id}')" style="
                  background: #f59e0b; 
                  color: white; 
                  border: none; 
                  padding: 6px 12px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  font-size: 12px;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                " title="Anuluj zamówienie">
                  ⏹️ Anuluj
                </button>` : ''
              }
              ${(order.status === 'CANCELLED' || order.status === 'COMPLETED') && onRestoreOrder ? 
                `<button onclick="window.restoreOrder('${order.id}')" style="
                  background: #10b981; 
                  color: white; 
                  border: none; 
                  padding: 6px 12px; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  font-size: 12px;
                  display: flex;
                  align-items: center;
                  gap: 4px;
                " title="Przywróć zamówienie">
                  🔄 Przywróć
                </button>` : ''
              }
            </div>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        markersRef.current.push(marker);

        // Set marker style based on promised time and selection
        const timerColor = getTimerColor(order);
        const isSelected = selectedOrder && order.id === selectedOrder.id;
        
        if (isSelected) {
          // Selected marker - 20% smaller than before (26px -> 21px)
          marker.setIcon(L.divIcon({
            className: 'selected-marker',
            html: `<div style="background-color: ${timerColor}; color: white; padding: 6px; border-radius: 50%; width: 21px; height: 21px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 9px;">${(order.orderNumber || order.id).slice(-2)}</div>`,
            iconSize: [21, 21],
            iconAnchor: [10.5, 10.5],
          }));
          
          // Center map on selected order
          map.setView([latitude, longitude], 15);
        } else {
          // Default marker style - 20% smaller than before (26px -> 21px)
          marker.setIcon(L.divIcon({
            className: 'order-marker',
            html: `<div style="background-color: ${timerColor}; color: white; padding: 5px; border-radius: 50%; width: 21px; height: 21px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${(order.orderNumber || order.id).slice(-2)}</div>`,
            iconSize: [21, 21],
            iconAnchor: [10.5, 10.5],
          }));
        }
      }
    });

    // Note: Driver markers are handled in a separate useEffect below

    // Restaurant markers removed as requested
  }, [ordersWithGeo, selectedOrder, filterType]);

  // Separate useEffect for driver markers to ensure they update properly
  useEffect(() => {
    if (!mapInstanceRef.current) {
      console.log('📍 Map instance not ready yet');
      return;
    }

    const L = window.L;
    if (!L) {
      console.error('📍 Leaflet not available');
      return;
    }

    const map = mapInstanceRef.current;

    // Clear existing driver markers
    driverMarkersRef.current.forEach(marker => marker.remove());
    driverMarkersRef.current = [];

    // Check loading state
    if (driverLocationsLoading) {
      console.log('📍 Driver locations loading...');
      return;
    }

    // Check for error
    if (driverLocationsError) {
      console.error('❌ Error loading driver locations:', driverLocationsError);
      return;
    }

    // Add driver markers
    if (driverLocations && 'data' in driverLocations && Array.isArray(driverLocations.data)) {
      console.log('📍 Adding driver markers:', driverLocations.data.length);
      console.log('📍 Driver locations data:', JSON.stringify(driverLocations.data, null, 2));
      
      driverLocations.data.forEach((driver: any) => {
        if (!driver) {
          console.log('📍 Skipping null driver');
          return;
        }

        if (!driver.latitude || !driver.longitude) {
          console.log('📍 Skipping driver marker (missing coordinates):', {
            driverName: driver.driverName || 'Unknown',
            latitude: driver.latitude,
            longitude: driver.longitude,
            isActive: driver.isActive
          });
          return;
        }

        // Only skip if explicitly false or null, not if undefined (might be missing from response)
        if (driver.isActive === false || driver.isActive === null) {
          console.log('📍 Skipping driver marker (inactive):', {
            driverName: driver.driverName || 'Unknown',
            isActive: driver.isActive
          });
          return;
        }
        
        // If isActive is undefined, assume true (backwards compatibility)
        if (driver.isActive === undefined) {
          console.log('📍 Driver marker has undefined isActive, assuming active:', {
            driverName: driver.driverName || 'Unknown'
          });
        }

        console.log('📍 Adding driver marker:', {
          driverName: driver.driverName || 'Unknown',
          latitude: driver.latitude,
          longitude: driver.longitude,
          isActive: driver.isActive
        });

        const driverMarker = L.marker([driver.latitude, driver.longitude], {
          title: `Kierowca: ${driver.driverName || 'Unknown'}`,
        }).addTo(map);

        // Create driver popup
        const driverPopupContent = `
          <div style="min-width: 200px; font-family: Arial, sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px; display: flex; align-items: center; gap: 8px;">
              🚗 ${driver.driverName || 'Unknown'}
            </h3>
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Status:</strong> ${driver.orderId ? 'W drodze' : 'Dostępny'}</p>
            ${driver.orderId ? `<p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Zamówienie:</strong> ${driver.orderId}</p>` : ''}
            <p style="margin: 4px 0; color: #666; font-size: 14px;"><strong>Ostatnia aktualizacja:</strong> ${driver.timestamp ? new Date(driver.timestamp).toLocaleTimeString() : 'Nieznana'}</p>
          </div>
        `;
        
        driverMarker.bindPopup(driverPopupContent);
        
        // Set driver marker icon
        driverMarker.setIcon(L.divIcon({
          className: 'driver-marker',
          html: `<div style="background-color: #1e40af; color: white; padding: 4px; border-radius: 6px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); font-size: 12px; position: relative;">
            <div style="position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 3px solid transparent; border-right: 3px solid transparent; border-bottom: 4px solid #1e40af;"></div>
            🚗
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        }));
        
        driverMarkersRef.current.push(driverMarker);
      });
      
      console.log('✅ Driver markers added:', driverMarkersRef.current.length);
    } else if (driverLocationsError) {
      console.error('❌ Error loading driver locations:', driverLocationsError);
    } else {
      console.log('📍 No driver locations data available:', {
        hasDriverLocations: !!driverLocations,
        hasData: driverLocations && 'data' in driverLocations,
        dataType: driverLocations ? typeof driverLocations.data : 'null',
        isArray: driverLocations?.data ? Array.isArray(driverLocations.data) : false
      });
    }
  }, [driverLocations, driverLocationsError]);



  return (
    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
  );
};
