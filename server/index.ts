import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { centralErrorHandler, notFoundApiHandler } from './middleware/errorHandler.js';
import { examsRouter } from './routes/exams.js';
import { healthRouter } from './routes/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');

export function createApp() {
  const app = express();

  // Required behind Cloud Run / reverse proxies
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/exams', examsRouter);

  // Unmatched API endpoints return structured JSON 404
  app.use('/api', notFoundApiHandler);

  // Serve built React frontend in production
  if (env.isProduction) {
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));

      // SPA fallback for React Router client-side routes on page refresh
      app.get('*', (req: Request, res: Response, next: NextFunction) => {
        if (req.path.startsWith('/api')) {
          return next();
        }
        res.sendFile(path.join(distDir, 'index.html'));
      });
    } else {
      console.warn(
        `[ExamSphere Server] Production dist directory not found at ${distDir}. Run "npm run build" first.`
      );
    }
  }

  // Centralized error handler
  app.use(centralErrorHandler);

  return app;
}

const app = createApp();
const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(
    `[ExamSphere Server] Listening on http://0.0.0.0:${env.port} (${env.nodeEnv})`
  );
});

function shutdown(signal: string) {
  console.log(`[ExamSphere Server] Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
