import { createApp } from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);

// Initialize app asynchronously
async function startServer() {
  try {
    console.log('🚀 Starting backend server...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔧 Port:', PORT);

    const app = await createApp();

    // Add debug middleware
    app.use((req, _res, next) => {
      console.log(`🔍 ${req.method} ${req.path}`);
      next();
    });

    // For local development
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, '0.0.0.0', () => {
        console.log('✅ Backend server started successfully!');
        console.log(`🌐 Backend listening on port ${PORT} (all interfaces)`);
        console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
        console.log(`📊 Mobile access: http://172.20.10.4:${PORT}/api/health`);
        console.log(`📋 API docs: http://localhost:${PORT}/api/orders`);
        console.log('✅ Running with PostgreSQL database');
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${PORT} is already in use!`);
          console.error(`   Please stop the process using port ${PORT} or change PORT in .env`);
        } else {
          console.error('❌ Failed to start server:', err);
        }
        process.exit(1);
      });
    }

    return app;
  } catch (error) {
    console.error('❌ Failed to initialize backend:', error);
    console.error('Stack:', (error as Error).stack);
    process.exit(1);
  }
}

// For local development - start server
if (process.env.NODE_ENV !== 'production') {
  startServer().catch((error) => {
    console.error('❌ Unhandled error in startServer:', error);
    process.exit(1);
  });
}

// For Vercel - export handler function
module.exports = async (req: any, res: any) => {
  const app = await createApp();
  return app(req, res);
};
