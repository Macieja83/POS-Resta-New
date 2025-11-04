import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Leaflet
global.L = {
  map: vi.fn(() => ({
    setView: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    invalidateSize: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    setIcon: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    on: vi.fn(),
  })),
  divIcon: vi.fn(() => ({})),
  icon: vi.fn(() => ({})),
} as any;
