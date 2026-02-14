import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { deliveryZonesApi, DeliveryZone } from '../../api/deliveryZones';
import './DeliveryZoneManager.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// DeliveryZone interface is now imported from API

interface DeliveryZoneManagerProps {
  onZonesChange?: (zones: DeliveryZone[]) => void;
}

// Custom icon for drawing points
const squareIcon = L.divIcon({
  className: 'custom-square-icon',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

const DeliveryZoneManager: React.FC<DeliveryZoneManagerProps> = ({ onZonesChange }) => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<DeliveryZone | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [tempCoordinates, setTempCoordinates] = useState<[number, number][]>([]);
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const mapRef = useRef<L.Map>(null);

  // Słupsk coordinates
  const center: [number, number] = [54.4642, 17.0285];

  // Load zones from API
  const loadZones = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await deliveryZonesApi.getZones();
      if (response.success && response.data) {
        setZones(response.data);
        if (onZonesChange) {
          onZonesChange(response.data);
        }
      } else {
        setError('Failed to load delivery zones');
      }
    } catch (err) {
      console.error('Error loading zones:', err);
      setError('Failed to load delivery zones');
    } finally {
      setLoading(false);
    }
  };

  // Save zone to API
  const saveZone = async (zone: DeliveryZone) => {
    try {
      if (zone.id && zones.find(z => z.id === zone.id)) {
        // Update existing zone - only send updatable fields
        const updateData = {
          name: zone.name,
          coordinates: zone.coordinates,
          isActive: zone.isActive,
          deliveryPrice: zone.deliveryPrice,
          minOrderValue: zone.minOrderValue,
          freeDeliveryFrom: zone.freeDeliveryFrom,
          courierRate: zone.courierRate,
          area: zone.area,
          color: zone.color
        };
        const response = await deliveryZonesApi.updateZone(zone.id, updateData);
        if (response.success && response.data) {
          setZones(prevZones => 
            prevZones.map(z => z.id === zone.id ? response.data! : z)
          );
          return response.data;
        }
      } else {
        // Create new zone
        const createData = {
          name: zone.name,
          coordinates: zone.coordinates,
          isActive: zone.isActive,
          deliveryPrice: zone.deliveryPrice,
          minOrderValue: zone.minOrderValue,
          freeDeliveryFrom: zone.freeDeliveryFrom,
          courierRate: zone.courierRate,
          area: zone.area,
          color: zone.color
        };
        const response = await deliveryZonesApi.createZone(createData);
        if (response.success && response.data) {
          setZones(prevZones => [...prevZones, response.data!]);
          return response.data;
        }
      }
      throw new Error('Failed to save zone');
    } catch (err) {
      console.error('Error saving zone:', err);
      setError('Failed to save delivery zone');
      throw err;
    }
  };

  // Delete zone from API
  const deleteZone = async (zoneId: string) => {
    try {
      const response = await deliveryZonesApi.deleteZone(zoneId);
      if (response.success) {
        setZones(prevZones => prevZones.filter(z => z.id !== zoneId));
        if (selectedZone?.id === zoneId) {
          setSelectedZone(null);
          setEditingZone(null);
        }
      } else {
        throw new Error('Failed to delete zone');
      }
    } catch (err) {
      console.error('Error deleting zone:', err);
      setError('Failed to delete delivery zone');
      throw err;
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  useEffect(() => {
    if (onZonesChange) {
      onZonesChange(zones);
    }
  }, [zones, onZonesChange]);

  // Force map to resize when component mounts or updates
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [zones, selectedZone, isDrawing]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update editingZone when selectedZone changes
  useEffect(() => {
    if (selectedZone) {
      setEditingZone(selectedZone);
    }
  }, [selectedZone]);

  const calculateArea = (coordinates: [number, number][]): number => {
    if (coordinates.length < 3) return 0;
    
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to km² (rough approximation)
    return Math.round(area * 111 * 111 * Math.cos(center[0] * Math.PI / 180) * 100) / 100;
  };

  const generateZoneColor = (index: number): string => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    return colors[index % colors.length];
  };

  // Handle marker drag for temporary coordinates
  const handleMarkerDragEnd = useCallback((event: L.LeafletEvent, index: number) => {
    const { lat, lng } = event.target.getLatLng();
    setTempCoordinates((prev) => {
      const newCoords = [...prev];
      newCoords[index] = [lat, lng];
      return newCoords;
    });
  }, []);

  // Handle marker drag for selected zone coordinates
  const handleSelectedZoneMarkerDragEnd = useCallback(async (event: L.LeafletEvent, index: number) => {
    const { lat, lng } = event.target.getLatLng();
    
    if (!selectedZone) return;
    
    const newCoords = [...selectedZone.coordinates];
    newCoords[index] = [lat, lng];
    const updatedZone = { 
      ...selectedZone, 
      coordinates: newCoords,
      area: calculateArea(newCoords),
      updatedAt: new Date().toISOString()
    };
    
    setSelectedZone(updatedZone);
    
    // Also update the zones array
    setZones((prevZones) => 
      prevZones.map(zone => 
        zone.id === selectedZone.id ? updatedZone : zone
      )
    );

    // Save to API
    try {
      await saveZone(updatedZone);
    } catch (err) {
      console.error('Failed to save zone after drag:', err);
    }
  }, [selectedZone]);

  const startDrawing = () => {
    setIsDrawing(true);
    setTempCoordinates([]);
    setNewZoneName('');
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setTempCoordinates([]);
    setNewZoneName('');
  };

  const startAddingPoint = () => {
    if (!selectedZone) return;
    setIsAddingPoint(true);
    setIsDrawing(false);
  };

  const cancelAddingPoint = () => {
    setIsAddingPoint(false);
  };

  const addPointToZone = async (lat: number, lng: number) => {
    if (!selectedZone) return;
    
    const newCoords = [...selectedZone.coordinates];
    newCoords.push([lat, lng]);
    
    const updatedZone = {
      ...selectedZone,
      coordinates: newCoords,
      area: calculateArea(newCoords),
      updatedAt: new Date().toISOString()
    };
    
    setSelectedZone(updatedZone);
    setZones(zones.map(zone => 
      zone.id === selectedZone.id ? updatedZone : zone
    ));
    setIsAddingPoint(false);

    // Save to API
    try {
      await saveZone(updatedZone);
    } catch (err) {
      console.error('Failed to save zone after adding point:', err);
    }
  };

  const finishDrawing = async () => {
    if (tempCoordinates.length < 3 || !newZoneName.trim()) {
      alert('Proszę wprowadzić nazwę strefy i narysować co najmniej 3 punkty');
      return;
    }

    const newZone: DeliveryZone = {
      id: '', // Will be set by API
      name: newZoneName.trim(),
      coordinates: [...tempCoordinates, tempCoordinates[0]], // Close the polygon
      isActive: true,
      deliveryPrice: 700, // 7 zł in grosz
      minOrderValue: 3000, // 30 zł in grosz
      area: calculateArea(tempCoordinates),
      color: generateZoneColor(zones.length),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const savedZone = await saveZone(newZone);
      setSelectedZone(savedZone);
      setEditingZone(savedZone);
      setIsDrawing(false);
      setTempCoordinates([]);
      setNewZoneName('');
    } catch (err) {
      console.error('Failed to create zone:', err);
    }
  };

  const updateZone = async (updatedZone: DeliveryZone) => {
    try {
      // Recalculate area if coordinates changed
      const updatedZoneWithArea = {
        ...updatedZone,
        area: calculateArea(updatedZone.coordinates),
        updatedAt: new Date().toISOString()
      };
      
      const savedZone = await saveZone(updatedZoneWithArea);
      setEditingZone(savedZone);
    } catch (err) {
      console.error('Failed to update zone:', err);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      await deleteZone(zoneId);
    } catch (err) {
      console.error('Failed to delete zone:', err);
    }
  };

  const MapEvents = () => {
    const map = useMap();
    
    useMapEvents({
      click: (e) => {
        if (isDrawing) {
          const newCoord: [number, number] = [e.latlng.lat, e.latlng.lng];
          setTempCoordinates([...tempCoordinates, newCoord]);
        } else if (isAddingPoint) {
          addPointToZone(e.latlng.lat, e.latlng.lng);
        }
      }
    });

    // Force map to resize when component mounts
    useEffect(() => {
      if (map) {
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }
    }, [map]);

    return null;
  };

  if (loading) {
    return (
      <div className="delivery-zone-manager">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Ładowanie stref dostaw...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="delivery-zone-manager">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={loadZones} className="retry-btn">
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="delivery-zone-manager">
      <div className="zone-controls">
        <div className="zone-header">
          <h2>Strefy dostaw</h2>
          <button 
            className="add-zone-btn"
            onClick={startDrawing}
            disabled={isDrawing}
          >
            + Dodaj nową strefę
          </button>
        </div>

        <div className="zone-sort">
          <label>Sortuj według:</label>
          <select>
            <option>Obszar</option>
            <option>Nazwa</option>
            <option>Cena dostawy</option>
          </select>
          <div className="sort-arrows">
            <button>↑</button>
            <button>↓</button>
          </div>
        </div>

        {isDrawing && (
          <div className="drawing-controls">
            <input
              type="text"
              placeholder="Nazwa strefy"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
            />
            <div className="drawing-actions">
              <button onClick={finishDrawing} className="save-btn">✓ Zapisz</button>
              <button onClick={cancelDrawing} className="cancel-btn">× Anuluj</button>
            </div>
            <p>Kliknij na mapie, aby narysować strefę dostaw</p>
          </div>
        )}

        {editingZone && (
          <div className="zone-edit-panel">
            <div className="zone-edit-header">
              <input
                type="text"
                value={editingZone.name}
                onChange={(e) => setEditingZone({...editingZone, name: e.target.value})}
                className="zone-name-input"
              />
              <div className="zone-edit-actions">
                <button 
                  onClick={() => updateZone(editingZone)}
                  className="save-btn"
                >
                  ✓ Zapisz
                </button>
                <button 
                  onClick={() => setEditingZone(null)}
                  className="cancel-btn"
                >
                  × Anuluj
                </button>
              </div>
            </div>
            
            <div className="zone-point-controls">
              <button 
                onClick={startAddingPoint}
                className="add-point-btn"
                disabled={isAddingPoint}
              >
                + Dodaj punkt
              </button>
              {isAddingPoint && (
                <div className="adding-point-info">
                  <p>Kliknij na mapie, aby dodać nowy punkt do strefy</p>
                  <button onClick={cancelAddingPoint} className="cancel-btn">
                    × Anuluj
                  </button>
                </div>
              )}
            </div>

            <div className="zone-status">
              <label>
                <input
                  type="checkbox"
                  checked={editingZone.isActive}
                  onChange={(e) => setEditingZone({...editingZone, isActive: e.target.checked})}
                />
                Aktywna
              </label>
            </div>

            <div className="zone-pricing">
              <div className="pricing-row">
                <label>Cena dostawy:</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingZone.deliveryPrice / 100}
                  onChange={(e) => setEditingZone({...editingZone, deliveryPrice: Math.round(Number(e.target.value) * 100)})}
                />
                <span>zł</span>
              </div>
              <div className="pricing-row">
                <label>Minimalna wartość zamówienia:</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingZone.minOrderValue / 100}
                  onChange={(e) => setEditingZone({...editingZone, minOrderValue: Math.round(Number(e.target.value) * 100)})}
                />
                <span>zł</span>
              </div>
              <div className="pricing-row">
                <label>Darmowa dostawa od:</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingZone.freeDeliveryFrom ? editingZone.freeDeliveryFrom / 100 : ''}
                  onChange={(e) => setEditingZone({...editingZone, freeDeliveryFrom: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined})}
                />
                <span>zł</span>
              </div>
              <div className="pricing-row">
                <label>Stawka kuriera:</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingZone.courierRate ? editingZone.courierRate / 100 : ''}
                  onChange={(e) => setEditingZone({...editingZone, courierRate: e.target.value ? Math.round(Number(e.target.value) * 100) : undefined})}
                />
                <span>zł</span>
              </div>
            </div>
          </div>
        )}

        <div className="zones-list">
          {zones.map((zone) => (
            <div 
              key={zone.id} 
              className={`zone-item ${selectedZone?.id === zone.id ? 'selected' : ''}`}
              onClick={() => {
                setSelectedZone(zone);
                setEditingZone(zone);
              }}
            >
              <div className="zone-indicator" style={{ backgroundColor: zone.color }}></div>
              <div className="zone-info">
                <div className="zone-name">{zone.name}</div>
                <div className="zone-area">{zone.area} km²</div>
              </div>
              <div className="zone-actions">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteZone(zone.id);
                  }}
                  className="delete-btn"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="zone-map">
        <MapContainer
          key={`map-${zones.length}-${selectedZone?.id || 'none'}`}
          center={center}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <MapEvents />
          
          {zones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.coordinates}
              pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.3,
                weight: 2
              }}
              eventHandlers={{
                click: () => setSelectedZone(zone)
              }}
            />
          ))}
          
          {/* Render draggable markers for the temporary polygon */}
          {isDrawing && tempCoordinates.map((coord, index) => (
            <Marker
              key={`temp-marker-${index}`}
              position={coord}
              draggable={true}
              icon={squareIcon}
              eventHandlers={{
                dragend: (e) => handleMarkerDragEnd(e, index),
              }}
            />
          ))}

          {/* Render draggable markers for the selected zone */}
          {selectedZone && !isDrawing && selectedZone.coordinates.map((coord, index) => (
            <Marker
              key={`selected-marker-${selectedZone.id}-${index}`}
              position={coord}
              draggable={true}
              icon={squareIcon}
              eventHandlers={{
                dragend: (e) => handleSelectedZoneMarkerDragEnd(e, index),
              }}
            />
          ))}
          
          {isDrawing && tempCoordinates.length > 2 && (
            <Polygon
              key="temp-polygon"
              positions={tempCoordinates}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.2,
                weight: 2,
                dashArray: '5, 5'
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default DeliveryZoneManager;
