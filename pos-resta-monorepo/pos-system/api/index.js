const express = require('express');
const cors = require('cors');

// Create a simple Express app for Vercel
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug logging for Vercel
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    message: 'Vercel deployment working'
  });
});

// Try to load the main app, but fallback to simple endpoints if it fails
let mainApp = null;

try {
  const { createApp } = require('../apps/backend/dist/app');
  mainApp = createApp();
  console.log('✅ Main app loaded successfully');
} catch (error) {
  console.error('❌ Failed to load main app:', error.message);
  
  // Fallback endpoints
  app.get('/api/orders', (req, res) => {
    res.json({
      success: false,
      error: 'Backend not fully loaded. Check logs.',
      message: error.message
    });
  });
  
  app.patch('/api/orders/:id/status', (req, res) => {
    res.status(500).json({
      success: false,
      error: 'Backend not fully loaded. Check logs.',
      message: error.message
    });
  });
}

// If main app loaded successfully, use it
if (mainApp) {
  app.use('/', mainApp);
}

module.exports = app;


