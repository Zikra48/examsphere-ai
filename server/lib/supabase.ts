import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export interface SupabaseConnectionResult {
  configured: boolean;
  connected: boolean;
  status: 'connected' | 'not_configured' | 'invalid_config' | 'unreachable';
  latencyMs: number | null;
  message: string;
}

let cachedClient: SupabaseClient | null = null;

function isValidHttpUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function isSecretOrServiceRoleKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
      const payload = JSON.parse(payloadJson) as { role?: string };
      if (payload.role === 'service_role') {
        return true;
      }
    } catch {
      // Non-JWT publishable key format (e.g. sb_publishable_...)
    }
  }
  return false;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!isValidHttpUrl(env.supabaseUrl)) {
    return null;
  }
  if (isSecretOrServiceRoleKey(env.supabaseAnonKey)) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return cachedClient;
}

/**
 * Performs a lightweight, non-destructive connectivity check against the configured
 * Supabase project without querying or requiring any database tables, and without
 * exposing any URLs, keys, or database credentials in the return payload.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionResult> {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      connected: false,
      status: 'not_configured',
      latencyMs: null,
      message: 'Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are not set.',
    };
  }

  const parsedUrl = isValidHttpUrl(env.supabaseUrl);
  if (!parsedUrl) {
    return {
      configured: true,
      connected: false,
      status: 'invalid_config',
      latencyMs: null,
      message: 'SUPABASE_URL must be a valid http(s) URL.',
    };
  }

  if (isSecretOrServiceRoleKey(env.supabaseAnonKey)) {
    return {
      configured: true,
      connected: false,
      status: 'invalid_config',
      latencyMs: null,
      message:
        'SUPABASE_ANON_KEY must be the public anon/publishable key, not a service_role or secret key.',
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      configured: true,
      connected: false,
      status: 'invalid_config',
      latencyMs: null,
      message: 'Unable to initialize Supabase client.',
    };
  }

  const startedAt = Date.now();
  try {
    // 1. Verify Supabase JS client auth module responds cleanly
    const { error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      return {
        configured: true,
        connected: false,
        status: 'unreachable',
        latencyMs: Date.now() - startedAt,
        message: 'Supabase auth client check failed.',
      };
    }

    // 2. Verify live network reachability & anon/publishable key acceptance.
    // Note: Modern Supabase publishable keys (`sb_publishable_...`) must be sent via
    // `apikey` header rather than `Authorization: Bearer <jwt>`.
    const headers: Record<string, string> = {
      apikey: env.supabaseAnonKey,
    };
    if (env.supabaseAnonKey.split('.').length === 3) {
      headers.Authorization = `Bearer ${env.supabaseAnonKey}`;
    }

    const gatewayCheck = await fetch(`${parsedUrl.origin}/auth/v1/settings`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - startedAt;

    if (!gatewayCheck.ok) {
      return {
        configured: true,
        connected: false,
        status: 'unreachable',
        latencyMs,
        message: `Supabase gateway returned HTTP ${gatewayCheck.status}.`,
      };
    }

    return {
      configured: true,
      connected: true,
      status: 'connected',
      latencyMs,
      message: 'Supabase project is reachable and publishable/anon key was accepted.',
    };
  } catch {
    return {
      configured: true,
      connected: false,
      status: 'unreachable',
      latencyMs: Date.now() - startedAt,
      message: 'Network request to Supabase timed out or failed.',
    };
  }
}
