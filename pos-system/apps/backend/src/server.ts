import path from 'path';
import { createApp } from './app';
import dotenv from 'dotenv';
import { dlog } from './lib/logger';

// Load .env from backend directory (works when started from monorepo root or from apps/backend)
const backendDir = path.resolve(process.cwd(), 'apps', 'backend');
const envPath = path.join(backendDir, '.env');
dotenv.config({ path: envPath });
dotenv.config();

const PORT = parseInt(process.env.PORT || '4000', 10);

// Initialize app asynchronously
async function startServer() {
  try {
    dlog('🚀 Starting backend server...');
    dlog('📍 Environment:', process.env.NODE_ENV || 'development');
    dlog('🔧 Port:', PORT);

    const app = await createApp();

    // Add debug middleware (only when DEBUG_LOGS=1)
    app.use((req, _res, next) => {
      dlog(`🔍 ${req.method} ${req.path}`);
      next();
    });

    // Always listen when this file is executed as a server process.
    app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Backend server started successfully!');
      console.log(`🌐 Backend listening on port ${PORT} (all interfaces)`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📋 API docs: http://localhost:${PORT}/api/orders`);
    }).on('error', (err: unknown) => {
      const e = err as { code?: string };
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error(`   Please stop the process using port ${PORT} or change PORT in .env`);
      } else {
        console.error('❌ Failed to start server:', err);
      }
      process.exit(1);
    });

    return app;
  } catch (error) {
    console.error('❌ Failed to initialize backend:', error);
    console.error('Stack:', (error as Error).stack);
    process.exit(1);
  }
}

// Start server when executed directly (systemd / node dist/server.js)
if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Unhandled error in startServer:', error);
    process.exit(1);
  });
}

// For Vercel / serverless - export handler function
module.exports = async (req: unknown, res: unknown) => {
  const app = await createApp();
  return (app as unknown as (req: unknown, res: unknown) => unknown)(req, res);
};
