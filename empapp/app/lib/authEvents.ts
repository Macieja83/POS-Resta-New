export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

type AuthListener = (state: AuthState) => void;

const listeners = new Set<AuthListener>();

let currentState: AuthState = {
  isAuthenticated: false,
  token: null,
};

export function notifyAuthChange(state: AuthState): void {
  currentState = state;
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error('authEvents listener error:', error);
    }
  });
}

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);

  // Immediately send current state so subscriber stays in sync
  try {
    listener(currentState);
  } catch (error) {
    console.error('authEvents initial listener error:', error);
  }

  return () => {
    listeners.delete(listener);
  };
}

export function getCurrentAuthState(): AuthState {
  return currentState;
}

