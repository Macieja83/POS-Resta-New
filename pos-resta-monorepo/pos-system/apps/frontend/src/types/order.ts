// Re-export from local shared types
export * from './shared';

// Legacy type alias for backward compatibility
import type { Customer } from './shared';
export type CustomerData = Customer;
