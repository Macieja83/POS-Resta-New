// Database abstraction layer with Supabase and mock data fallback
import { PrismaClient } from '@prisma/client';
import { testSupabaseConnection } from './supabase';

let prisma: PrismaClient | null = null;
let useMockData = false;

// Initialize Prisma Client for Supabase with error handling
try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    errorFormat: 'pretty',
  });
  console.log('✅ Prisma Client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  useMockData = true;
  console.log('⚠️ Falling back to mock data');
}

export { prisma, useMockData };

// Test Prisma connection (without disconnecting - Prisma manages pool automatically)
export async function testPrismaConnection(): Promise<boolean> {
  if (!prisma) return false;
  
  try {
    // Simple query to test connection without disrupting the pool
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.warn('Prisma connection test failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    console.log('✅ Database connection closed');
  }
}

// Initialize database connection on startup with retry logic
export async function initializeDatabase(): Promise<void> {
  if (prisma && !useMockData) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Test Supabase connection first
        const supabaseConnected = await testSupabaseConnection();
        if (!supabaseConnected) {
          throw new Error('Supabase connection test failed');
        }
        
        // Test Prisma connection with a simple query (with timeout)
        await Promise.race([
          prisma.$queryRaw`SELECT 1`,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database connection timeout')), 5000)
          )
        ]);
        console.log('✅ Database connected successfully to Supabase');
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Database connection attempt ${attempt}/${maxRetries} failed:`, errorMessage);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        } else {
          console.error('❌ All database connection attempts failed. Falling back to mock data.');
          console.error('⚠️ Server will continue running, but will use mock data instead.');
          useMockData = true;
          // Don't throw error - let server start anyway
          return;
        }
      }
    }
  } else {
    console.log('⚠️ Using mock data (Prisma not initialized or already using mock data)');
  }
}

