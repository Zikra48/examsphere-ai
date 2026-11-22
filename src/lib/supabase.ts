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

export function isBrowserSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && !isForbiddenSecretKey(supabaseAnonKey));
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
