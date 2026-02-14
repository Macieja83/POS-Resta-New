export const isDebugEnabled = (): boolean => {
  // Enable debug logs only when explicitly requested.
  // Usage: DEBUG_LOGS=1 pnpm dev
  return process.env.DEBUG_LOGS === '1';
};

export const dlog = (...args: unknown[]) => {
  if (!isDebugEnabled()) return;
  console.log(...args);
};
