/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_SUPABASE_PROJECT_ID?: string;
	readonly VITE_SUPABASE_URL?: string;
	readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
	readonly VITE_SUPABASE_ANON_KEY?: string;
	readonly VITE_SUPABASE_EMAIL?: string;
	readonly VITE_SUPABASE_PASSWORD?: string;
	readonly VITE_RESOURCE_BASE_URL?: string;
}
interface ImportMeta {
	readonly env: ImportMetaEnv;
}
