const { createApp } = require('../dist/app');

// Initialize app asynchronously
async function initializeApp() {
  const app = await createApp();
  
  // Debug logging for Vercel
  console.log('🚀 Starting backend server on Vercel...');
  console.log('📍 Environment:', process.env.NODE_ENV);

  // Add debug middleware
  app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.path}`);
    next();
  });

  return app;
}

// Export the function that returns the app
module.exports = initializeApp;

