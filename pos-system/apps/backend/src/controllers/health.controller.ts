import { Request, Response } from 'express';
import { prisma } from '../lib/database';

export class HealthController {
  async getHealth(req: Request, res: Response) {
    try {
      console.log('🏥 Health check requested:', req.path, req.method);
      
      // Check database connection
      let dbStatus = 'disconnected';
      try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch (dbError) {
        console.error('Database health check failed:', dbError);
        dbStatus = 'error';
      }
      
      const response = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        db: dbStatus,
        environment: process.env.NODE_ENV || 'development',
        path: req.path,
        method: req.method
      };
      
      console.log('✅ Health check response:', response);
      res.json(response);
    } catch (error) {
      console.error('❌ Health check error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        db: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
