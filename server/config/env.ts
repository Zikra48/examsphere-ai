import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

for (const envFile of ['.env', '.env.local']) {
  const fullPath = path.resolve(process.cwd(), envFile);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: true });
  }
}

const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const isProduction = nodeEnv === 'production';

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

export const env = {
  nodeEnv,
  isProduction,
  /**
   * In production (including Google Cloud Run), listen on process.env.PORT (default 8080).
   * In development, listen on BACKEND_PORT (default 3001) so Vite can occupy port 3000.
   */
  port: isProduction
    ? parsePort(process.env.PORT, 8080)
    : parsePort(process.env.BACKEND_PORT, 3001),
  appUrl: process.env.APP_URL || '',
  supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
  supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || '').trim(),
};
