import { useState, useEffect } from 'react';
import { authApi, LoginResponse } from '../lib/api';
import type { User } from '../lib/api';
import { notifyAuthChange } from '../lib/authEvents';

// Helper to use localStorage (for web platform)
async function getStorageItem(key: string): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
}

async function removeStorageItem(key: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
    // Force synchronous removal on web
    // Verify removal to ensure it worked
    if (localStorage.getItem(key) !== null) {
      console.warn(`Warning: Failed to remove ${key} from localStorage`);
      // Try again
      localStorage.removeItem(key);
    }
  }
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAuth();
  }, []);

  async function loadAuth() {
    try {
      const storedToken = await getStorageItem('authToken');
      const storedUser = await getStorageItem('user');

      if (storedToken) {
        setToken(storedToken);
      }
      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      notifyAuthChange({
        isAuthenticated: !!storedToken,
        token: storedToken,
      });
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(loginCode?: string, email?: string): Promise<boolean> {
    try {
      setError(null);
      const response = await authApi.login(loginCode, email);
      
      if (response.success && response.token && response.data) {
        await setStorageItem('authToken', response.token);
        await setStorageItem('user', JSON.stringify(response.data));
        setToken(response.token);
        setUser(response.data);

        notifyAuthChange({
          isAuthenticated: true,
          token: response.token,
        });
        return true;
      } else {
        const errorMsg = response.error || 'Nieprawidłowy kod logowania lub email';
        setError(errorMsg);
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Błąd podczas logowania';
      setError(errorMsg);
      return false;
    }
  }

  async function logout(): Promise<void> {
    console.log('🚪 [useAuth] Logout called - starting cleanup...');
    
    // Clear state IMMEDIATELY - this is critical for navigation
    console.log('🚪 [useAuth] Clearing state (token, user, error)...');
    setToken(null);
    setUser(null);
    setError(null);
    console.log('🚪 [useAuth] State cleared');
    
    // Remove from storage SYNCHRONOUSLY on web to prevent race conditions
    if (typeof window !== 'undefined') {
      try {
        console.log('🚪 [useAuth] Clearing localStorage...');
        
        // Clear all possible auth-related keys
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Verify all keys are cleared
        const remainingKeys = ['authToken', 'user', 'token'].filter(
          key => localStorage.getItem(key) !== null
        );
        
        if (remainingKeys.length > 0) {
          console.warn('⚠️ [useAuth] Some keys still exist after removal:', remainingKeys);
          // Force remove again
          remainingKeys.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🚪 [useAuth] Force removed: ${key}`);
          });
        } else {
          console.log('✅ [useAuth] All localStorage keys cleared successfully');
        }
      } catch (err) {
        console.error('❌ [useAuth] Error removing storage items:', err);
      }
    } else {
      console.log('🚪 [useAuth] Not web platform, skipping localStorage');
    }
    
    // Try to call logout API (but don't wait or fail if it doesn't work)
    // This is non-blocking - we clear state first
    console.log('🚪 [useAuth] Calling logout API (non-blocking)...');
    authApi.logout().catch(err => {
      console.error('⚠️ [useAuth] Logout API error (non-critical):', err);
    });
    
    notifyAuthChange({
      isAuthenticated: false,
      token: null,
    });
    
    console.log('✅ [useAuth] Logout complete - token and user cleared');
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    logout,
  };
}
