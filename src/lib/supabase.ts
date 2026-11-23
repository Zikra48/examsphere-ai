import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client configuration.
 *
 * Security boundary:
 * - Only publishable/anon keys exposed via `VITE_SUPABASE_URL` and
 *   `VITE_SUPABASE_ANON_KEY` may be bundled into the browser.
 * - Never place `service_role` or `sb_secret_` keys in frontend code or `VITE_*` vars.
 * - Stage-1 mock/localStorage workflows remain active until database tables and
 *   Row Level Security (RLS) policies are approved and deployed.
 */

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

let browserClient: SupabaseClient | null = null;
let hasLoggedConfigError = false;

function isForbiddenSecretKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;
  const parts = key.split('.');
  if (parts.length === 3) {
    try {
      const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(json) as { role?: string };
      return payload.role === 'service_role';
    } catch {
      return false;
    }
  }
  return false;
}

function parseHttpUrl(value: string): URL | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed : null;
  } catch {
    return null;
  }
}

export function getSupabaseBrowserConfigError(): string | null {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  let errorMsg: string | null = null;

  if (missing.length > 0) {
    errorMsg = `Supabase is not configured: missing ${missing.join(' / ')}`;
  } else if (!parseHttpUrl(supabaseUrl)) {
    errorMsg =
      'Supabase URL configuration is invalid: VITE_SUPABASE_URL must be a valid https:// project URL.';
  } else if (isForbiddenSecretKey(supabaseAnonKey)) {
    errorMsg =
      'Unsafe Supabase key detected in browser configuration. Only the public publishable/anon key is permitted.';
  }

  if (errorMsg && !hasLoggedConfigError) {
    hasLoggedConfigError = true;
    console.error(`[ExamSphere Supabase] ${errorMsg}`, {
      hasViteSupabaseUrl: Boolean(supabaseUrl),
      hasViteSupabaseAnonKey: Boolean(supabaseAnonKey),
    });
  }

  return errorMsg;
}

export function isBrowserSupabaseConfigured(): boolean {
  return getSupabaseBrowserConfigError() === null;
}

export interface SupabaseEnvDiagnostics {
  hasViteSupabaseUrl: boolean;
  hasViteSupabaseAnonKey: boolean;
  supabaseUrlHost: string | null;
  configError: string | null;
}

export function getSupabaseEnvDiagnostics(): SupabaseEnvDiagnostics {
  const parsed = parseHttpUrl(supabaseUrl);
  return {
    hasViteSupabaseUrl: Boolean(supabaseUrl),
    hasViteSupabaseAnonKey: Boolean(supabaseAnonKey),
    supabaseUrlHost: parsed ? parsed.host : null,
    configError: getSupabaseBrowserConfigError(),
  };
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isBrowserSupabaseConfigured()) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}

export function requireSupabaseBrowserClient(): SupabaseClient {
  const configError = getSupabaseBrowserConfigError();
  if (configError) {
    throw new Error(configError);
  }
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error('Supabase authentication client could not be initialized.');
  }
  return client;
}

export interface ClientConnectionCheckResult {
  backendReachable: boolean;
  backendSupabaseConnected: boolean;
  browserClientConfigured: boolean;
  message: string;
}

/**
 * Runs a basic connection test through the Express backend (`/api/health/supabase`)
 * and checks whether the optional browser client (`VITE_SUPABASE_*`) is initialized.
 */
export async function testSupabaseConnection(): Promise<ClientConnectionCheckResult> {
  const browserClientConfigured = isBrowserSupabaseConfigured();

  try {
    const response = await fetch('/api/health/supabase', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const data = (await response.json().catch(() => null)) as {
      connected?: boolean;
      message?: string;
    } | null;

    return {
      backendReachable: true,
      backendSupabaseConnected: Boolean(response.ok && data?.connected),
      browserClientConfigured,
      message:
        data?.message ||
        (response.ok ? 'Supabase connection verified.' : 'Backend Supabase check returned non-OK.'),
    };
  } catch {
    return {
      backendReachable: false,
      backendSupabaseConnected: false,
      browserClientConfigured,
      message: 'Unable to reach /api/health/supabase.',
    };
  }
}
