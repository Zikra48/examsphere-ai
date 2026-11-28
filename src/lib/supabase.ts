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

function normalizeEnvValue(raw: string | undefined): string {
  const trimmed = (raw || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const supabaseUrl = normalizeEnvValue(import.meta.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
const supabaseAnonKey = normalizeEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

let browserClient: SupabaseClient | null = null;
let hasLoggedConfigError = false;

function decodeJwtPayload(key: string): Record<string, unknown> | null {
  const parts = key.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isForbiddenSecretKey(key: string): boolean {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;
  const payload = decodeJwtPayload(key);
  return payload?.role === 'service_role';
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

function getKeyFormatLabel(key: string): string {
  if (!key) return 'missing';
  if (key.startsWith('sb_publishable_')) return 'publishable (sb_publishable_)';
  if (key.startsWith('sb_secret_')) return 'secret (blocked)';
  const payload = decodeJwtPayload(key);
  if (payload) {
    return typeof payload.role === 'string' ? `jwt (role: ${payload.role})` : 'jwt';
  }
  return 'unrecognized format';
}

function getJwtProjectRefMismatch(url: URL | null, key: string): string | null {
  if (!url || !key) return null;
  const payload = decodeJwtPayload(key);
  const jwtRef = typeof payload?.ref === 'string' ? payload.ref : null;
  if (!jwtRef) return null;
  const urlHostRef = url.hostname.split('.')[0];
  if (urlHostRef && jwtRef !== urlHostRef) {
    return `Supabase project mismatch: VITE_SUPABASE_URL points to "${urlHostRef}", but VITE_SUPABASE_ANON_KEY belongs to "${jwtRef}".`;
  }
  return null;
}

export function getSupabaseBrowserConfigError(): string | null {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  const parsedUrl = parseHttpUrl(supabaseUrl);
  let errorMsg: string | null = null;

  if (missing.length > 0) {
    errorMsg = `Supabase is not configured: missing ${missing.join(' / ')}`;
  } else if (!parsedUrl) {
    errorMsg =
      'Supabase URL configuration is invalid: VITE_SUPABASE_URL must be a valid https:// project URL.';
  } else if (isForbiddenSecretKey(supabaseAnonKey)) {
    errorMsg =
      'Unsafe Supabase key detected in browser configuration. Only the public publishable/anon key is permitted.';
  } else {
    errorMsg = getJwtProjectRefMismatch(parsedUrl, supabaseAnonKey);
  }

  if (errorMsg && !hasLoggedConfigError) {
    hasLoggedConfigError = true;
    console.error(`[ExamSphere Supabase] ${errorMsg}`, {
      hasViteSupabaseUrl: Boolean(supabaseUrl),
      hasViteSupabaseAnonKey: Boolean(supabaseAnonKey),
      keyFormat: getKeyFormatLabel(supabaseAnonKey),
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
  keyFormat: string;
  configError: string | null;
}

export function getSupabaseEnvDiagnostics(): SupabaseEnvDiagnostics {
  const parsed = parseHttpUrl(supabaseUrl);
  return {
    hasViteSupabaseUrl: Boolean(supabaseUrl),
    hasViteSupabaseAnonKey: Boolean(supabaseAnonKey),
    supabaseUrlHost: parsed ? parsed.host : null,
    keyFormat: getKeyFormatLabel(supabaseAnonKey),
    configError: getSupabaseBrowserConfigError(),
  };
}

export async function verifySupabaseGatewayKey(): Promise<string> {
  const configError = getSupabaseBrowserConfigError();
  if (configError) {
    return `Skipped (${configError})`;
  }
  const parsed = parseHttpUrl(supabaseUrl);
  if (!parsed) {
    return 'Invalid URL';
  }
  try {
    const headers: Record<string, string> = { apikey: supabaseAnonKey };
    if (supabaseAnonKey.split('.').length === 3) {
      headers.Authorization = `Bearer ${supabaseAnonKey}`;
    }
    const res = await fetch(`${parsed.origin}/auth/v1/settings`, {
      method: 'GET',
      headers,
    });
    if (res.ok) {
      return `Accepted by ${parsed.host} (HTTP ${res.status})`;
    }
    const body = (await res.json().catch(() => null)) as { msg?: string; message?: string } | null;
    const detail = body?.msg || body?.message || res.statusText;
    return `Rejected by ${parsed.host} (HTTP ${res.status}: ${detail})`;
  } catch (err) {
    return err instanceof Error ? `Network error: ${err.message}` : 'Network error';
  }
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
