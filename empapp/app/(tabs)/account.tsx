import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Switch, Platform } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from '../hooks/useLocation';

export default function AccountScreen() {
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const router = useRouter();
  const { 
    isTracking, 
    isEnabled, 
    error: locationError,
    startTracking, 
    stopTracking 
  } = useLocation();
  const [switchValue, setSwitchValue] = useState(isTracking);

  // Sync switch value with isTracking state
  useEffect(() => {
    setSwitchValue(isTracking);
  }, [isTracking]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShouldRedirect(true);
    }
  }, [isAuthenticated, authLoading]);

  const performLogout = async () => {
    console.log('🔄 [LOGOUT] Starting logout process...');
    setLoggingOut(true);
    
    try {
      // Stop location tracking before logout
      if (isTracking) {
        console.log('📍 [LOGOUT] Stopping location tracking...');
        stopTracking();
      }

      // Call logout function - this clears token and user state
      console.log('🚪 [LOGOUT] Calling logout function...');
      await logout();
      console.log('✅ [LOGOUT] Logout function completed');
      
      // Force immediate redirect flag
      setShouldRedirect(true);
      
      // For web, use hard redirect immediately to ensure complete state reset
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.log('🌐 [LOGOUT] Web platform detected - using hard redirect');
        console.log('🌐 [LOGOUT] Current window.location:', window.location.href);
        
        // Verify localStorage is cleared before redirect
        const hasAuthToken = localStorage.getItem('authToken');
        const hasUser = localStorage.getItem('user');
        console.log('🌐 [LOGOUT] localStorage check - authToken:', hasAuthToken, 'user:', hasUser);
        
        // Small delay to ensure state updates propagate, then force hard redirect
        setTimeout(() => {
          console.log('🌐 [LOGOUT] Executing hard redirect to "/"...');
          try {
            // Force full page reload to reset all state
            window.location.href = '/';
          } catch (err) {
            console.error('❌ [LOGOUT] Error during redirect:', err);
            // Fallback: try replacing
            try {
              window.location.replace('/');
            } catch (err2) {
              console.error('❌ [LOGOUT] Fallback redirect also failed:', err2);
            }
          }
        }, 100);
      } else {
        // For native, use router
        console.log('📱 [LOGOUT] Native platform - using router');
        setTimeout(() => {
          console.log('📱 [LOGOUT] Navigating to login...');
          router.replace('/(auth)/login');
        }, 100);
      }
    } catch (error) {
      console.error('❌ [LOGOUT] Error during logout:', error);
      // Even on error, try to clear state and redirect
      try {
        await logout();
      } catch (logoutError) {
        console.error('❌ [LOGOUT] Error during logout cleanup:', logoutError);
      }
      setShouldRedirect(true);
      
      // Force redirect even on error
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/';
        }, 50);
      } else {
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 100);
      }
    }
  };

  const handleLogout = () => {
    console.log('🔘 [LOGOUT] Logout button clicked');
    
    // On web, use window.confirm for better compatibility and immediate action
    if (Platform.OS === 'web') {
      console.log('🌐 [LOGOUT] Web platform - showing confirm dialog');
      const confirmed = window.confirm('Czy na pewno chcesz się wylogować?');
      console.log('🌐 [LOGOUT] User response:', confirmed);
      if (confirmed) {
        console.log('🌐 [LOGOUT] User confirmed - starting logout');
        performLogout();
      } else {
        console.log('🚫 [LOGOUT] User cancelled logout');
      }
    } else {
      // On mobile, use Alert.alert
      console.log('📱 [LOGOUT] Mobile platform - showing Alert');
      Alert.alert(
        'Wylogowanie',
        'Czy na pewno chcesz się wylogować?',
        [
          { 
            text: 'Anuluj', 
            style: 'cancel', 
            onPress: () => {
              console.log('🚫 [LOGOUT] User cancelled');
            }
          },
          {
            text: 'Wyloguj',
            style: 'destructive',
            onPress: () => {
              console.log('📱 [LOGOUT] User confirmed - starting logout');
              performLogout();
            },
          },
        ]
      );
    }
  };

  // Redirect if not authenticated
  if (shouldRedirect || (!authLoading && !isAuthenticated)) {
    return <Redirect href="/(auth)/login" />;
  }

  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Konto</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Użytkownik'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          {user?.phone && (
            <Text style={styles.phone}>{user.phone}</Text>
          )}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'EMPLOYEE'}</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <View style={[styles.menuItem, isTracking && styles.locationItemActive]}>
            <View style={styles.locationItemContent}>
              <Text style={styles.menuItemText}>
                📍 Śledzenie lokalizacji
              </Text>
              {isTracking && (
                <View style={styles.trackingIndicator}>
                  <View style={styles.trackingDot} />
                  <Text style={styles.trackingText}>Aktywne</Text>
                </View>
              )}
            </View>
            <Switch
              value={switchValue}
              onValueChange={async (value) => {
                // Optimistically update switch
                setSwitchValue(value);
                
                if (value) {
                  // Turning ON - start tracking immediately, it will request permission
                  console.log('📍 [SWITCH] User enabled location tracking');
                  
                  // On web, use window.confirm for better compatibility
                  if (Platform.OS === 'web') {
                    const confirmed = window.confirm(
                      'Aplikacja potrzebuje dostępu do Twojej lokalizacji, aby śledzić pozycję kierowcy.\n\nCzy zezwalasz na dostęp do lokalizacji?'
                    );
                    
                    if (!confirmed) {
                      // Revert switch if user denies
                      setSwitchValue(false);
                      console.log('📍 [SWITCH] User denied location permission');
                      return;
                    }
                    
                    console.log('📍 [SWITCH] User confirmed - starting tracking...');
                    // Now request actual browser permission via startTracking
                    const success = await startTracking();
                    if (!success) {
                      // Revert switch if failed
                      setSwitchValue(false);
                      if (locationError) {
                        window.alert(locationError);
                      } else {
                        window.alert(
                          'Nie udało się uzyskać dostępu do lokalizacji.\n\nProszę:\n1. Kliknij ikonę kłódki obok adresu strony\n2. Zezwól na dostęp do lokalizacji\n3. Spróbuj ponownie'
                        );
                      }
                    } else {
                      // Success - show confirmation
                      window.alert('Śledzenie włączone\n\nTwoja lokalizacja będzie aktualizowana co 10 sekund.');
                    }
                  } else {
                    // Mobile: use Alert.alert
                    Alert.alert(
                      'Dostęp do lokalizacji',
                      'Aplikacja potrzebuje dostępu do Twojej lokalizacji, aby śledzić pozycję kierowcy.\n\nCzy zezwalasz na dostęp do lokalizacji?',
                      [
                        {
                          text: 'Nie',
                          style: 'cancel',
                          onPress: () => {
                            // Revert switch if user denies
                            setSwitchValue(false);
                            console.log('📍 [SWITCH] User denied location permission');
                          }
                        },
                        {
                          text: 'Tak, zezwalaj',
                          onPress: async () => {
                            console.log('📍 [SWITCH] User granted permission - starting tracking...');
                            // Now request actual browser permission
                            const success = await startTracking();
                            if (!success) {
                              // Revert switch if failed
                              setSwitchValue(false);
                              if (locationError) {
                                Alert.alert('Błąd', locationError);
                              } else {
                                Alert.alert(
                                  'Brak uprawnień',
                                  'Nie udało się uzyskać dostępu do lokalizacji.\n\nProszę:\n1. Kliknij ikonę kłódki obok adresu strony\n2. Zezwól na dostęp do lokalizacji\n3. Spróbuj ponownie',
                                  [{ text: 'OK' }]
                                );
                              }
                            } else {
                              // Success - show confirmation
                              Alert.alert(
                                'Śledzenie włączone',
                                'Twoja lokalizacja będzie aktualizowana co 10 sekund.',
                                [{ text: 'OK' }]
                              );
                            }
                          }
                        }
                      ]
                    );
                  }
                } else {
                  // Turning OFF - ask for confirmation
                  Alert.alert(
                    'Zatrzymać śledzenie lokalizacji?',
                    'Twoja lokalizacja przestanie być aktualizowana.',
                    [
                      { 
                        text: 'Anuluj', 
                        onPress: () => {
                          // Revert switch to ON if cancelled
                          setSwitchValue(true);
                        }, 
                        style: 'cancel' 
                      },
                      {
                        text: 'Zatrzymaj',
                        style: 'destructive',
                        onPress: () => {
                          stopTracking();
                        },
                      },
                    ]
                  );
                }
              }}
              trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
              thumbColor={switchValue ? '#fff' : '#f4f3f4'}
              ios_backgroundColor="#e0e0e0"
            />
          </View>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Ustawienia</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Pomoc</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>O aplikacji</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.logoutButtonText}>Wyloguj się</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationItem: {
    // Background color set dynamically based on isTracking state
  },
  locationItemActive: {
    backgroundColor: '#e8f5e9',
  },
  locationItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  trackingText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#999',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

