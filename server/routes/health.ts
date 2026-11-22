import { Router, Request, Response } from 'express';
import { env } from '../config/env.js';
import { isSupabaseConfigured, testSupabaseConnection } from '../lib/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'examsphere-backend',
    environment: env.nodeEnv,
    supabaseConfigured: isSupabaseConfigured(),
    timestamp: new Date().toISOString(),
    uptimeSeconds: Number(process.uptime().toFixed(2)),
  });
});

healthRouter.get('/supabase', async (_req: Request, res: Response, next) => {
  try {
    const result = await testSupabaseConnection();
    const httpStatus = result.connected ? 200 : 503;

    res.status(httpStatus).json({
      service: 'supabase',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
