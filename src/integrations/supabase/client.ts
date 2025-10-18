import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create a type that allows any table name to avoid TypeScript errors
// since many tables aren't in the generated types
type SupabaseClient = ReturnType<typeof createClient<Database>>;

const env = import.meta.env;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Read configuration from Vite envs so builds and environments don't hard-code secrets.
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

// Debug logging to diagnose 406 errors
console.log('[supabase] Environment check:', {
	hasUrl: !!SUPABASE_URL,
	urlValue: SUPABASE_URL,
	hasKey: !!SUPABASE_KEY,
	keyPreview: SUPABASE_KEY ? `${SUPABASE_KEY.slice(0, 20)}...` : 'MISSING',
	usingPublishable: !!env.VITE_SUPABASE_PUBLISHABLE_KEY,
	usingAnon: !!env.VITE_SUPABASE_ANON_KEY,
});

if (!SUPABASE_URL || !SUPABASE_KEY) {
	// Warn instead of throwing to avoid breaking static builds; the app will surface auth errors at runtime.
	// Ensure your .env (or hosting env) defines VITE_SUPABASE_URL and either VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.
	console.error('[supabase] ❌ CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_* key in environment.');
	console.error('[supabase] This will cause 406 errors with message: "No API key found in request"');
	console.error('[supabase] Fix: Restart Vite dev server after creating/updating .env file');
}

export const supabase = createClient<Database>(
	SUPABASE_URL ?? '', 
	SUPABASE_KEY ?? '',
	{
		global: {
			headers: {
				'Accept': 'application/json',
			},
		},
		auth: {
			persistSession: true,
			autoRefreshToken: true,
		},
	}
) as any; // Type assertion to allow accessing tables not in generated types