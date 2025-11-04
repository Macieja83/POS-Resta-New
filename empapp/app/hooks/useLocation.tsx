import { useState, useEffect, useRef, useCallback, createContext, useContext, ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import { driverApi } from '../lib/api';
import { subscribeAuth, getCurrentAuthState, AuthState } from '../lib/authEvents';

// Helper to use localStorage (for web platform)
async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
}

async function removeStorageItem(key: string): Promise<void> {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function calculateDistanceInMeters(a: Coordinates, b: Coordinates): number {
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const deltaLat = toRadians(b.latitude - a.latitude);
  const deltaLng = toRadians(b.longitude - a.longitude);

  const sinDeltaLat = Math.sin(deltaLat / 2);
  const sinDeltaLng = Math.sin(deltaLng / 2);

  const haversine = sinDeltaLat * sinDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinDeltaLng * sinDeltaLng;
  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_METERS * arc;
}

// Conditional import - expo-location only works on native platforms
let Location: typeof import('expo-location') | null = null;
if (Platform.OS !== 'web') {
  try {
    Location = require('expo-location');
  } catch (e) {
    console.warn('expo-location not available:', e);
  }
}

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  isEnabled: boolean;
  isTracking: boolean;
  error: string | null;
}

interface LocationContextValue extends LocationState {
  startTracking: () => Promise<boolean>;
  stopTracking: () => void;
  setCurrentOrderId: (orderId: string | null) => void;
  requestLocationPermission: () => Promise<boolean>;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const BASE_LOCATION: Coordinates = { latitude: 54.46, longitude: 17.02 };
const MAX_DISTANCE_FROM_BASE_METERS = 80_000; // 80 km radius around restaurant
const MAX_ACCURACY_METERS = 50; // ignore inaccurate GPS readings (~50m for high precision)
const LAST_LOCATION_STORAGE_KEY = 'driverLastLocation';

function isAccuracyAcceptable(accuracy?: number | null): boolean {
  if (accuracy === null || accuracy === undefined || Number.isNaN(accuracy)) {
    return true;
  }
  return accuracy <= MAX_ACCURACY_METERS;
}

function isWithinServiceArea(location: Coordinates): boolean {
  return calculateDistanceInMeters(BASE_LOCATION, location) <= MAX_DISTANCE_FROM_BASE_METERS;
}

async function getLastKnownLocationFromStorage(): Promise<Coordinates | null> {
  const raw = await getStorageItem(LAST_LOCATION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  } catch (error) {
    console.error('❌ Error parsing stored driver location:', error);
  }

  return null;
}

async function saveLastKnownLocation(location: Coordinates): Promise<void> {
  await setStorageItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(location));
}

function useProvideLocation(): LocationContextValue {
  const [authState, setAuthState] = useState<AuthState>(() => getCurrentAuthState());
  const [locationState, setLocationState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    isEnabled: false,
    isTracking: false,
    error: null,
  });
  
  const webWatchIdRef = useRef<number | null>(null);
  const nativeWatchSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const currentOrderIdRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const hasRestoredTrackingRef = useRef<boolean>(false);
  const cachedPositionRef = useRef<{ latitude: number; longitude: number; accuracy?: number | null } | null>(null);
  const lastLocationRef = useRef<Coordinates | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;

    const refreshAuthState = async () => {
      try {
        const storedToken = (await getStorageItem('authToken')) || (await getStorageItem('token'));
        if (!isMounted) return;

        setAuthState({
          isAuthenticated: !!storedToken,
          token: storedToken,
        });
      } catch (error) {
        console.error('❌ Error refreshing auth state for location tracking:', error);
      }
    };

    const unsubscribe = subscribeAuth((state) => {
      if (isMounted) {
        setAuthState(state);
      }
    });

    void refreshAuthState();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const { isAuthenticated, token } = authState;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    getLastKnownLocationFromStorage()
      .then((storedLocation) => {
        if (storedLocation && isWithinServiceArea(storedLocation)) {
          lastLocationRef.current = storedLocation;
          if (!locationState.latitude || !locationState.longitude) {
            setLocationState(prev => ({
              ...prev,
              latitude: storedLocation.latitude,
              longitude: storedLocation.longitude,
            }));
          }
        }
      })
      .catch((error) => {
        console.error('❌ Error loading last known driver location:', error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Send location to backend
  const sendLocationToBackend = useCallback(
    async (latitude: number, longitude: number, options?: { force?: boolean }) => {
      const now = Date.now();
      if (!options?.force && now - lastSentRef.current < 5_000) {
        return;
      }

      lastSentRef.current = now;

      try {
        const orderId = currentOrderIdRef.current || undefined;

        console.log('📍 Sending location to backend:', {
          latitude,
          longitude,
          orderId,
          force: options?.force ?? false
        });
        const response = await driverApi.updateLocation(latitude, longitude, orderId);
        
        if (response.success) {
          console.log('✅ Location successfully sent to backend:', { latitude, longitude });
        } else {
          console.error('❌ Backend returned error:', response.error);
        }
      } catch (error) {
        lastSentRef.current = 0; // Allow quick retry after failure
        const message = error instanceof Error ? error.message : String(error);
        console.error('❌ Error sending location to backend:', {
          message,
          latitude,
          longitude,
          error
        });
      }
    },
    []
  );

  // Request location permissions - always asks for permission each time
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLocationState(prev => ({ ...prev, error: null }));

      // Web platform uses browser geolocation API
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert(
            'Lokalizacja niedostępna',
            'Twoja przeglądarka nie obsługuje geolokalizacji',
            [{ text: 'OK' }]
          );
          setLocationState(prev => ({ 
            ...prev, 
            error: 'Geolokalizacja nie jest obsługiwana' 
          }));
          return false;
        }
        
        // On web, always try to get position to trigger permission prompt
        // Note: Browser will only show permission prompt if:
        // - Permission was never asked (first time)
        // - Permission was denied (will show again)
        // If permission was already granted, browser won't show prompt (security feature)
        // Store position in ref to avoid double call
        return new Promise<boolean>((resolve) => {
          console.log('📍 [PERMISSION] Requesting location permission on web...');
          console.log('📍 [PERMISSION] This will trigger browser permission prompt if needed');
          
          // Check permission status first (optional - for better UX)
          if ('permissions' in navigator) {
            navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
              console.log('📍 [PERMISSION] Current permission status:', result.state);
              
              if (result.state === 'denied') {
                // Permission was explicitly denied - show instructions
                Alert.alert(
                  'Brak uprawnień do lokalizacji',
                  'Dostęp do lokalizacji został zablokowany.\n\nAby włączyć:\n1. Kliknij ikonę kłódki (🔒) obok adresu strony\n2. Zmień ustawienie lokalizacji na "Zezwalaj"\n3. Odśwież stronę i spróbuj ponownie',
                  [{ text: 'OK' }]
                );
                setLocationState(prev => ({ 
                  ...prev, 
                  error: 'Brak uprawnień do lokalizacji',
                  isEnabled: false
                }));
                resolve(false);
                return;
              }
              
              // Permission is "prompt" (not yet asked) or "granted" (already allowed)
              // Continue with getCurrentPosition - browser will show prompt if needed
              console.log('📍 [PERMISSION] Permission status:', result.state, '- requesting position...');
              requestPosition();
            }).catch((err) => {
              // Permissions API not supported or error - continue anyway
              console.log('📍 [PERMISSION] Permissions API not available, requesting position directly...');
              requestPosition();
            });
          } else {
            // Permissions API not available - go directly to getCurrentPosition
            // Browser will show prompt automatically if permission not granted
            console.log('📍 [PERMISSION] Permissions API not available, requesting position directly...');
            requestPosition();
          }
          
          function requestPosition() {
            console.log('📍 [PERMISSION] Calling navigator.geolocation.getCurrentPosition()...');
            console.log('📍 [PERMISSION] This SHOULD trigger browser permission prompt if not granted');
            
            navigator.geolocation.getCurrentPosition(
              (position) => {
                console.log('✅ [PERMISSION] Location permission granted on web:', {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                });
                console.log('✅ [PERMISSION] Browser permission was already granted or user just granted it');
                
                // Permission granted - store position for later use in startTracking
                cachedPositionRef.current = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: typeof position.coords.accuracy === 'number'
                    ? position.coords.accuracy
                    : null,
                };
                setLocationState(prev => ({ ...prev, isEnabled: true }));
                resolve(true);
              },
              (error) => {
                console.error('❌ [PERMISSION] Location permission error on web:', {
                  code: error.code,
                  message: error.message
                });
                
                // Permission denied or error
                if (error.code === 1 || error.code === error.PERMISSION_DENIED) {
                  Alert.alert(
                    'Brak uprawnień do lokalizacji',
                    'Aplikacja potrzebuje uprawnień do lokalizacji, aby śledzić Twoją pozycję.\n\nProszę:\n1. Kliknij ikonę kłódki obok adresu strony\n2. Zezwól na dostęp do lokalizacji\n3. Odśwież stronę',
                    [{ text: 'OK' }]
                  );
                  setLocationState(prev => ({ 
                    ...prev, 
                    error: 'Brak uprawnień do lokalizacji',
                    isEnabled: false
                  }));
                  resolve(false);
                } else if (error.code === 2 || error.code === error.POSITION_UNAVAILABLE) {
                  Alert.alert(
                    'Lokalizacja niedostępna',
                    'Nie udało się uzyskać Twojej lokalizacji. Sprawdź czy GPS jest włączony.',
                    [{ text: 'OK' }]
                  );
                  setLocationState(prev => ({ 
                    ...prev, 
                    error: 'Lokalizacja niedostępna',
                    isEnabled: false
                  }));
                  resolve(false);
                } else if (error.code === 3 || error.code === error.TIMEOUT) {
                  Alert.alert(
                    'Timeout',
                    'Pobieranie lokalizacji trwa zbyt długo. Spróbuj ponownie.',
                    [{ text: 'OK' }]
                  );
                  setLocationState(prev => ({ 
                    ...prev, 
                    error: 'Timeout pobierania lokalizacji',
                    isEnabled: false
                  }));
                  resolve(false);
                } else {
                  Alert.alert(
                    'Błąd lokalizacji',
                    `Nie udało się uzyskać lokalizacji: ${error.message || 'Nieznany błąd'}`,
                    [{ text: 'OK' }]
                  );
                  setLocationState(prev => ({ 
                    ...prev, 
                    error: error.message || 'Błąd podczas uzyskiwania lokalizacji',
                    isEnabled: false
                  }));
                  resolve(false);
                }
              },
              {
                enableHighAccuracy: true, // Request high accuracy for most precise location
                timeout: 20000, // Longer timeout to allow GPS to get precise position
                maximumAge: 0, // Always get fresh position, never use cached
              }
            );
          }
        });
      }

      // Native platforms use expo-location
      if (!Location) {
        Alert.alert(
          'Błąd',
          'Moduł lokalizacji nie jest dostępny',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Lokalizacja wyłączona',
          'Proszę włączyć usługi lokalizacji w ustawieniach urządzenia',
          [{ text: 'OK' }]
        );
        setLocationState(prev => ({ 
          ...prev, 
          error: 'Usługi lokalizacji są wyłączone' 
        }));
        return false;
      }

      // Always request permissions - even if previously granted
      // This ensures user is prompted each time
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Brak uprawnień',
          'Aplikacja potrzebuje uprawnień do lokalizacji, aby śledzić Twoją pozycję',
          [{ text: 'OK' }]
        );
        setLocationState(prev => ({ 
          ...prev, 
          error: 'Brak uprawnień do lokalizacji',
          isEnabled: false
        }));
        return false;
      }

      setLocationState(prev => ({ ...prev, isEnabled: true }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error requesting location permission:', error);
      setLocationState(prev => ({ 
        ...prev, 
        error: message || 'Błąd podczas żądania uprawnień',
        isEnabled: false
      }));
      return false;
    }
  }, []);

  // Start location tracking - always requests permission first
  const startTracking = useCallback(async (): Promise<boolean> => {
    console.log('📍 [START] startTracking called', { 
      isAuthenticated, 
      hasToken: !!token,
      platform: Platform.OS 
    });
    
    if (!isAuthenticated || !token) {
      Alert.alert('Błąd', 'Musisz być zalogowany, aby śledzić lokalizację');
      console.warn('📍 [START] Cannot start tracking: not authenticated');
      return false;
    }

    // Always request permission first - this will prompt user if needed
    console.log('📍 [START] Requesting location permission...');
    const hasPermission = await requestLocationPermission();
    console.log('📍 [START] Permission result:', hasPermission);
    
    if (!hasPermission) {
      console.warn('📍 [START] Cannot start tracking: permission denied');
      Alert.alert(
        'Brak uprawnień',
        'Nie można rozpocząć śledzenia lokalizacji bez uprawnień. Proszę zezwolić na dostęp w ustawieniach przeglądarki.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      let initialLocation: Coordinates;
      let initialAccuracy: number | null = null;

      // Get initial location - different methods for web and native
      if (Platform.OS === 'web') {
        // Web: Check if we already got position during permission request
        if (cachedPositionRef.current) {
          // Use cached position from permission request to avoid double call
          initialLocation = {
            latitude: cachedPositionRef.current.latitude,
            longitude: cachedPositionRef.current.longitude,
          };
          initialAccuracy = cachedPositionRef.current.accuracy ?? null;
          cachedPositionRef.current = null; // Clear cache after use
        } else {
          // Fallback: Get position again if not cached
          let fallbackAccuracy: number | null = null;
          initialLocation = await new Promise<Coordinates>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                fallbackAccuracy = typeof position.coords.accuracy === 'number'
                  ? position.coords.accuracy
                  : null;
                console.log('📍 Initial location (fallback):', {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy
                });
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                });
              },
              (error) => {
                console.error('❌ Error getting initial location (fallback):', error);
                reject(new Error(`Geolocation error: ${error.message}`));
              },
              {
                enableHighAccuracy: true, // Use high accuracy for precise location
                timeout: 15000, // Longer timeout for high accuracy
                maximumAge: 0, // Always get fresh position
              }
            );
          });
          initialAccuracy = fallbackAccuracy;
        }
      } else {
        // Native: Use expo-location (permission already requested above)
        if (!Location) {
          throw new Error('expo-location nie jest dostępny');
        }
        const preciseAccuracy = Location.Accuracy?.BestForNavigation
          ?? Location.Accuracy?.Highest
          ?? Location.Accuracy?.High;
        const location = await Location.getCurrentPositionAsync({
          accuracy: preciseAccuracy,
          maximumAge: 0,
          timeout: 20000,
        });
        initialLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        initialAccuracy = typeof location.coords.accuracy === 'number'
          ? location.coords.accuracy
          : null;
      }

      if (!isAccuracyAcceptable(initialAccuracy) || !isWithinServiceArea(initialLocation)) {
        console.warn('⚠️ Initial location outside service area or inaccurate, using fallback', {
          initialLocation,
          initialAccuracy,
        });

        const storedLocation =
          (lastLocationRef.current && isWithinServiceArea(lastLocationRef.current))
            ? lastLocationRef.current
            : await getLastKnownLocationFromStorage();

        if (storedLocation && isWithinServiceArea(storedLocation)) {
          console.log('📍 Using last known driver location from storage');
          initialLocation = storedLocation;
        } else {
          console.log('📍 Falling back to base restaurant location');
          initialLocation = BASE_LOCATION;
        }

        initialAccuracy = null;
      }

      lastLocationRef.current = {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      };
      void saveLastKnownLocation(lastLocationRef.current).catch(error => {
        console.error('⚠️ Error saving last known location:', error);
      });

      setLocationState(prev => ({
        ...prev,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        isTracking: true,
        error: null,
      }));

      // Send initial location immediately (bypass throttle)
      await sendLocationToBackend(
        initialLocation.latitude,
        initialLocation.longitude,
        { force: true }
      );

      // Persist enabled state for future sessions
      void setStorageItem('locationTrackingEnabled', 'true').catch(err => {
        console.error('⚠️ Error saving tracking state:', err);
      });

      // Use watchPosition for continuous tracking instead of interval with getCurrentPosition
      // This provides better accuracy and real-time updates
      if (Platform.OS === 'web') {
        // Web: Use watchPosition for continuous, accurate tracking
        if (webWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(webWatchIdRef.current);
          webWatchIdRef.current = null;
        }

        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (!isMountedRef.current || !isAuthenticated) {
              navigator.geolocation.clearWatch(watchId);
              webWatchIdRef.current = null;
              return;
            }

            const currentLocation: Coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            const accuracy = typeof position.coords.accuracy === 'number'
              ? position.coords.accuracy
              : null;

            if (!isAccuracyAcceptable(accuracy)) {
              console.warn('⚠️ Skipping location update due to low accuracy', {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                accuracy,
              });
              return;
            }

            if (!isWithinServiceArea(currentLocation)) {
              console.warn('⚠️ Skipping location update outside service area', currentLocation);
              return;
            }

            console.log('📍 Location update (web watchPosition):', {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy,
              altitude: position.coords.altitude,
              heading: position.coords.heading,
              speed: position.coords.speed,
              timestamp: new Date(position.timestamp).toISOString()
            });

            setLocationState(prev => ({
              ...prev,
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              isTracking: true,
              error: null,
            }));

            const previousLocation = lastLocationRef.current;
            lastLocationRef.current = currentLocation;

            void saveLastKnownLocation(currentLocation).catch(error => {
              console.error('⚠️ Error saving last known location (watch):', error);
            });

            const hasMovedSignificantly = previousLocation
              ? calculateDistanceInMeters(previousLocation, currentLocation) > 8
              : true;

            void sendLocationToBackend(
              currentLocation.latitude,
              currentLocation.longitude,
              { force: hasMovedSignificantly }
            );
          },
          (error) => {
            console.error('❌ Error in watchPosition:', {
              code: error.code,
              message: error.message,
              PERMISSION_DENIED: error.PERMISSION_DENIED,
              POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
              TIMEOUT: error.TIMEOUT
            });
            
            setLocationState(prev => ({
              ...prev,
              error: error.message || 'Błąd podczas śledzenia lokalizacji',
              isTracking: false,
            }));
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
          }
        );

        webWatchIdRef.current = watchId;
        } else {
        // Native: Use watchPosition for continuous updates with best accuracy
        if (!Location) {
          throw new Error('expo-location nie jest dostępny');
        }

        if (nativeWatchSubscriptionRef.current) {
          nativeWatchSubscriptionRef.current.remove();
          nativeWatchSubscriptionRef.current = null;
            }

        const preciseAccuracy = Location.Accuracy?.BestForNavigation
          ?? Location.Accuracy?.Highest
          ?? Location.Accuracy?.High;

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: preciseAccuracy,
            timeInterval: 5000,
            distanceInterval: 5,
            mayShowUserSettingsDialog: true,
          },
          (location) => {
          if (!isMountedRef.current || !isAuthenticated) {
              if (nativeWatchSubscriptionRef.current) {
                nativeWatchSubscriptionRef.current.remove();
                nativeWatchSubscriptionRef.current = null;
            }
            return;
          }

            const currentLocation: Coordinates = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            const accuracy = typeof location.coords.accuracy === 'number'
              ? location.coords.accuracy
              : null;

            if (!isAccuracyAcceptable(accuracy)) {
              console.warn('⚠️ Skipping native location update due to low accuracy', {
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
                accuracy,
              });
              return;
            }

            if (!isWithinServiceArea(currentLocation)) {
              console.warn('⚠️ Skipping native location update outside service area', currentLocation);
              return;
            }

            console.log('📍 Location update (native watch):', {
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              accuracy,
              altitude: location.coords.altitude,
              heading: location.coords.heading,
              speed: location.coords.speed,
              timestamp: new Date(location.timestamp).toISOString()
            });

            setLocationState(prev => ({
              ...prev,
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }));

            const previousLocation = lastLocationRef.current;
            lastLocationRef.current = currentLocation;

            void saveLastKnownLocation(currentLocation).catch(error => {
              console.error('⚠️ Error saving last known location (native watch):', error);
            });

            const hasMovedSignificantly = previousLocation
              ? calculateDistanceInMeters(previousLocation, currentLocation) > 8
              : true;

            void sendLocationToBackend(
              currentLocation.latitude,
              currentLocation.longitude,
              { force: hasMovedSignificantly }
            );
          }
        );

        nativeWatchSubscriptionRef.current = subscription;
      }

      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current as any);
      }

      heartbeatRef.current = setInterval(() => {
        if (!isMountedRef.current || !isAuthenticated) {
          if (heartbeatRef.current) {
            clearInterval(heartbeatRef.current as any);
            heartbeatRef.current = null;
              }
          return;
        }

        if (lastLocationRef.current) {
          sendLocationToBackend(
            lastLocationRef.current.latitude,
            lastLocationRef.current.longitude,
            { force: true }
          );
        }
      }, 20_000);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error starting location tracking:', error);
      setLocationState(prev => ({ 
        ...prev, 
        error: message || 'Błąd podczas rozpoczynania śledzenia lokalizacji',
        isTracking: false,
      }));
      return false;
    }
  }, [isAuthenticated, token, requestLocationPermission, sendLocationToBackend]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    console.log('🛑 Stopping location tracking...');
    
    if (Platform.OS === 'web' && webWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(webWatchIdRef.current);
      console.log('🛑 Cleared watchPosition:', webWatchIdRef.current);
      webWatchIdRef.current = null;
    }
    
    if (nativeWatchSubscriptionRef.current) {
      nativeWatchSubscriptionRef.current.remove();
      nativeWatchSubscriptionRef.current = null;
      console.log('🛑 Cleared native watchPosition subscription');
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current as any);
      heartbeatRef.current = null;
    }

    lastLocationRef.current = null;
    lastSentRef.current = 0;
    cachedPositionRef.current = null;

    void setStorageItem('locationTrackingEnabled', 'false').catch(error => {
      console.error('⚠️ Error storing disabled tracking state:', error);
    });

    void driverApi.stopLocation().catch(error => {
      console.error('⚠️ Error notifying backend about stopped tracking:', error);
    });

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
    }));
    
    console.log('✅ Location tracking stopped');
  }, []);

  // Load saved tracking state from localStorage
  useEffect(() => {
    const loadTrackingState = async () => {
      if (hasRestoredTrackingRef.current) return;
      hasRestoredTrackingRef.current = true;

      try {
        const savedState = await getStorageItem('locationTrackingEnabled');
        console.log('📍 Checking saved tracking state:', savedState, 'isAuthenticated:', isAuthenticated);

        if (!isAuthenticated || !token) {
          return;
        }

        if (savedState === 'false') {
          console.log('📍 Location tracking previously disabled by user; skipping auto-start');
          return;
        }

        if (savedState === 'true' || savedState === null) {
          console.log('📍 Auto-starting location tracking', savedState === null ? '(first session)' : '(restored state)');
          // Small delay to ensure auth is fully ready
          setTimeout(() => {
            startTracking().catch(err => {
              console.error('❌ Error auto-starting location tracking:', err);
            });
          }, 1000); // Increased delay to ensure everything is ready
        }
      } catch (error) {
        console.error('❌ Error loading tracking state:', error);
      }
    };

    if (isAuthenticated && token) {
      loadTrackingState();
    }
  }, [isAuthenticated, token, startTracking]);

  // Save tracking state to localStorage whenever it changes
  useEffect(() => {
    const saveTrackingState = async () => {
      try {
        if (locationState.isTracking) {
          await setStorageItem('locationTrackingEnabled', 'true');
          console.log('📍 Saved location tracking state: enabled');
        } else {
          // Only remove if we're not in the process of restoring
          if (hasRestoredTrackingRef.current) {
            await setStorageItem('locationTrackingEnabled', 'false');
            console.log('📍 Saved location tracking state: disabled');
          }
        }
      } catch (error) {
        console.error('❌ Error saving tracking state:', error);
      }
    };

    // Only save if we've restored the initial state (avoid saving on initial mount)
    if (hasRestoredTrackingRef.current) {
      saveTrackingState();
    }
  }, [locationState.isTracking]);

  // Set current order ID (for tracking location with specific order)
  const setCurrentOrderId = (orderId: string | null) => {
    currentOrderIdRef.current = orderId;
  };

  // Cleanup on unmount or when auth changes
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (webWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(webWatchIdRef.current);
        webWatchIdRef.current = null;
      }
      if (nativeWatchSubscriptionRef.current) {
        nativeWatchSubscriptionRef.current.remove();
        nativeWatchSubscriptionRef.current = null;
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current as any);
        heartbeatRef.current = null;
      }
    };
  }, []);

  // Stop tracking if user logs out and clear saved state
  useEffect(() => {
    if (!isAuthenticated) {
      if (locationState.isTracking || webWatchIdRef.current !== null || nativeWatchSubscriptionRef.current) {
        stopTracking();
      }
      // Clear saved tracking state on logout
      removeStorageItem('locationTrackingEnabled').catch(err => {
        console.error('Error clearing tracking state on logout:', err);
      });
      // Reset restoration flag on logout
      hasRestoredTrackingRef.current = false;
    }
  }, [isAuthenticated, stopTracking, locationState.isTracking]);

  return {
    ...locationState,
    startTracking,
    stopTracking,
    setCurrentOrderId,
    requestLocationPermission,
  };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const value = useProvideLocation();

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }

  return context;
}
