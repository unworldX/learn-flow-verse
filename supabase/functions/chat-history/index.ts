// Deno Edge Function: chat-history

// @ts-expect-error Deno URLs are resolved at runtime in Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Minimal JWT payload decode (no verify) to extract sub (user id)
function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64url = parts[1];
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (base64url.length % 4)) % 4);
    const json = atob(base64);
    const payload = JSON.parse(json);
    return typeof payload?.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// Declare Deno global for type-checking in editors that lack Deno types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Deno: any;

/**
 * Chat History API Documentation
 * ------------------------------------------------------------
 * All requests must be POST with a JSON body and include an Authorization header.
 * The API uses a consistent response envelope:
 * - Success: { ok: true, data: { ... } }
 * - Error:   { ok: false, error: { code: string, message: string, details?: any } }
 *
 * See individual handler functions for action-specific details.
 */

// Centralized CORS headers (broad to reduce preflight failures)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-authorization, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// --- Type Definitions ---
type Action =
  | 'listSessions'
  | 'getSession'
  | 'getMessages'
  | 'createSession'
  | 'appendMessages'
  | 'deleteSession'
  | 'updateSessionTitle'
  | 'health';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// IMPROVEMENT: A more specific and safe type for the incoming request body.
interface ApiRequestBody {
  action: Action;
  session_id?: string;
  messages?: ChatMessage[];
  title?: string;
  limit?: number;
  cursor?: string;
}

interface SessionSummary {
  id: string;
  user_id: string;
  derived_title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_at: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

// Some Supabase/PostgREST errors surface as Postgres code 42P01 (relation does not exist),
// but the REST gateway often uses its own code PGRST116 for missing tables/views.
const POSTGRES_RELATION_NOT_FOUND_ERROR = '42P01';
const POSTGREST_RELATION_NOT_FOUND_ERROR = 'PGRST116';
function isRelationNotFound(e: unknown) {
  const err = e as { code?: string; message?: string } | null | undefined;
  if (!err) return false;
  if (err.code === POSTGRES_RELATION_NOT_FOUND_ERROR) return true;
  if (err.code === POSTGREST_RELATION_NOT_FOUND_ERROR) return true;
  const msg = (err.message || '').toLowerCase();
  return msg.includes('relation') && msg.includes('does not exist')
    || msg.includes('not found') && msg.includes('table');
}

// --- Response Helpers ---
function createJsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...headers } });
}
const ok = <T>(data: T, status = 200, headers: Record<string,string> = {}) => createJsonResponse({ ok: true, data }, status, headers);
const err = (code: string, message: string, status = 400, details?: unknown) => createJsonResponse({ ok: false, error: { code, message, details } }, status);


// --- Action Handlers ---

/**
 * Lists chat sessions for the user, with pagination.
 * @param limit Max number of sessions to return (1-100).
 * @param cursor `updated_at` timestamp of the last session from the previous page to fetch older sessions.
 */
async function handleListSessions(supabase: any, userId: string, limit = 50, cursor?: string) {
  const effectiveLimit = Math.min(Math.max(limit, 1), 100);
  let query = supabase
    .from('chat_session_summaries') // This should be a view for performance
    .select('*')
  .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(effectiveLimit + 1);

  if (cursor) {
    query = query.lt('updated_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    // Fallback if the 'chat_session_summaries' view doesn't exist.
    if (isRelationNotFound(error)) {
      console.warn('Fallback triggered: chat_session_summaries view not found. Consider creating it for performance.');
      const sessions = await generateSummariesManually(supabase, userId, effectiveLimit + 1, cursor);
      const hasMore = sessions.length > effectiveLimit;
      const sliced = hasMore ? sessions.slice(0, effectiveLimit) : sessions;
      const nextCursor = hasMore ? sliced[sliced.length - 1].updated_at : null;
      return ok({ sessions: sliced, next_cursor: nextCursor }, 200, { 'X-Fallback': 'manual-summaries' });
    }
    throw error; // Re-throw other database errors
  }

  const hasMore = (data?.length || 0) > effectiveLimit;
  const sliced = hasMore ? data!.slice(0, effectiveLimit) : data;
  const nextCursor = hasMore ? sliced![sliced!.length - 1].updated_at : null;
  return ok({ sessions: sliced, next_cursor: nextCursor });
}

/**
 * [FALLBACK] Manually generates session summaries.
 * WARNING: This causes an N+1 query problem and is very slow. See recommendation below for a SQL function.
 */
async function generateSummariesManually(supabase: any, userId: string, limit: number, cursor?: string): Promise<SessionSummary[]> {
    // Apply pagination on updated_at when the view is unavailable
    let base = supabase
      .from('chat_sessions')
      .select('id, user_id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      base = base.lt('updated_at', cursor);
    }

    const { data: sessions, error: sessionsError } = await base;

    if (sessionsError) throw sessionsError;
    if (!sessions) return [];

  const summaryPromises = sessions.map(async (session: SessionRow) => {
        const { count } = await supabase.from('chat_messages').select('id', { count: 'exact', head: true }).eq('session_id', session.id);
        const { data: firstMsg } = await supabase.from('chat_messages').select('content').eq('session_id', session.id).order('created_at', { ascending: true }).limit(1).single();

        return {
            id: session.id,
            user_id: session.user_id,
            derived_title: session.title || firstMsg?.content?.slice(0, 80) || 'Untitled Chat',
            created_at: session.created_at,
            updated_at: session.updated_at,
            message_count: count ?? 0,
            last_message_at: session.updated_at,
        };
    });

    return Promise.all(summaryPromises);
}

/** Fetches a single session and all its messages. */
async function handleGetSession(supabase: any, userId: string, sessionId: string) {
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', sessionId)
  .eq('user_id', userId)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session) return err('not_found', 'Session not found', 404);

  const { data: messages, error: msgError } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
  .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (msgError) throw msgError;

  return ok({ session, messages });
}

/** Creates a new session with initial messages. */
async function handleCreateSession(supabase: any, userId: string, messages: ChatMessage[], title?: string) {
  if (!messages || messages.length === 0) {
    return err('messages_required', '`messages` array must not be empty.');
  }

  const { data: newSession, error: sessionError } = await supabase
    .from('chat_sessions')
  .insert({ user_id: userId, title: title || null })
    .select()
    .single();

  if (sessionError) throw sessionError;

  const messageRows = messages.map(m => ({
    session_id: newSession.id,
    user_id: userId,
    role: m.role,
    content: m.content
  }));
  const { error: msgError } = await supabase.from('chat_messages').insert(messageRows);
  if (msgError) throw msgError;

  return ok({ session_id: newSession.id }, 201);
}

/** Appends messages to an existing session. */
async function handleAppendMessages(supabase: any, userId: string, sessionId: string, messages: ChatMessage[]) {
  if (!messages || messages.length === 0) {
    return err('messages_required', '`messages` array must not be empty.');
  }

  // Verify session exists and belongs to the user
  const { data: sess, error: existErr } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (existErr || !sess) return err('not_found', 'Session not found or permission denied.', 404);

  const messageRows = messages.map(m => ({
    session_id: sessionId,
    user_id: userId,
    role: m.role,
    content: m.content
  }));
  const { error: insertError } = await supabase.from('chat_messages').insert(messageRows);
  if (insertError) throw insertError;

  // Also update the session's updated_at timestamp
  await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);

  return ok({ status: 'ok', session_id: sessionId });
}

/** Deletes a session and its messages (via database cascade). */
async function handleDeleteSession(supabase: any, userId: string, sessionId: string) {
  const { error } = await supabase.from('chat_sessions').delete().eq('id', sessionId).eq('user_id', userId);
  if (error) throw error;
  return ok({ status: 'deleted', session_id: sessionId });
}

/** Fetches a paginated list of messages for a session. */
async function handleGetMessages(supabase: any, userId: string, sessionId: string, limit = 100, cursor?: string) {
  const effectiveLimit = Math.min(Math.max(limit, 1), 200);
  const { data: sess, error: sessErr } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();
  if (sessErr || !sess) return err('not_found', 'Session not found or permission denied.', 404);

  let query = supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(effectiveLimit + 1);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data: descMessages, error: msgErr } = await query;
  if (msgErr) throw msgErr;

  const hasMore = (descMessages?.length || 0) > effectiveLimit;
  const sliced = hasMore ? descMessages!.slice(0, effectiveLimit) : (descMessages || []);
  
  // Reverse to return in ascending chronological order for the client
  const messages = sliced.slice().reverse();
  
  // The next cursor is the created_at of the oldest message in this batch (which is now at index 0 after reversing)
  // This seems incorrect. The cursor should be from the DESC ordered list.
  const nextCursor = hasMore ? sliced[sliced.length - 1].created_at : null;

  return ok({ messages, next_cursor: nextCursor, session_id: sessionId });
}

/** Updates the title of a session. */
async function handleUpdateSessionTitle(supabase: any, userId: string, sessionId: string, title?: string) {
  const sanitizedTitle = title && title.trim().length > 0 ? title.trim().slice(0, 255) : null;
  
  const { error } = await supabase
    .from('chat_sessions')
    .update({ title: sanitizedTitle })
    .eq('id', sessionId)
  .eq('user_id', userId);
    
  if (error) {
    // Check if the row didn't exist, which might be a better error than a generic one.
    if (error.code === 'PGRST204') { // PostgREST code for "No rows found"
        return err('not_found', 'Session not found or permission denied.', 404);
    }
    throw error;
  }
  
  return ok({ status: 'updated', session_id: sessionId, title: sanitizedTitle });
}


/** Diagnostics: checks presence/access of expected tables/views and returns errors if any. */
async function handleHealth(supabase: any) {
  const probes: Record<string, unknown> = {};

  type PgError = { code?: string; message?: string; details?: unknown };
  type PgResp = { data?: unknown; error?: PgError };
  const probe = async (name: string, exec: () => Promise<PgResp>) => {
    try {
      const { data, error } = await exec();
      probes[name] = error
        ? { ok: false, error: { code: error.code, message: error.message, details: error.details } }
        : { ok: true, sample: Array.isArray(data) ? data.slice(0, 1) : data };
    } catch (e) {
      const err = e as Error & { code?: string };
      probes[name] = { ok: false, exception: { code: err.code, message: err.message } };
    }
  };

  await probe('view_chat_session_summaries', async (): Promise<PgResp> => (
    await supabase.from('chat_session_summaries').select('id, updated_at').limit(1)
  ));
  await probe('table_chat_sessions', async (): Promise<PgResp> => (
    await supabase.from('chat_sessions').select('id, updated_at').limit(1)
  ));
  await probe('table_chat_messages', async (): Promise<PgResp> => (
    await supabase.from('chat_messages').select('id, session_id, created_at').limit(1)
  ));

  return ok({ probes });
}


// --- Main Server Handler ---
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) {
      console.error('Server misconfigured: missing Supabase credentials.');
      return err('server_misconfigured', 'Server is not configured correctly.', 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return err('unauthorized', 'Missing or invalid Authorization header.', 401);
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const userId = decodeJwtSub(token);
    if (!userId) return err('invalid_token', 'Invalid token: no subject', 401);

    // Lazy-load supabase client to avoid boot-time esm import issues
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    // Use service role for DB access, but scope all queries by userId
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    if (req.method !== 'POST') {
      return err('method_not_allowed', 'Only POST method is supported.', 405);
    }

    // IMPROVEMENT: Safer JSON parsing and parameter handling
    const body: ApiRequestBody = await req.json().catch(() => ({ action: null }));
  const { action, session_id, messages, title, limit, cursor } = body;

    switch (action) {
      case 'listSessions':
        return await handleListSessions(supabase, userId, limit, cursor);

      case 'getSession':
        if (!session_id) return err('session_id_required', '`session_id` is required.');
  return await handleGetSession(supabase, userId, session_id);

      case 'getMessages':
        if (!session_id) return err('session_id_required', '`session_id` is required.');
  return await handleGetMessages(supabase, userId, session_id, limit, cursor);

      case 'createSession':
  return await handleCreateSession(supabase, userId, messages ?? [], title);

      case 'appendMessages':
        if (!session_id) return err('session_id_required', '`session_id` is required.');
  return await handleAppendMessages(supabase, userId, session_id, messages ?? []);

      case 'deleteSession':
        if (!session_id) return err('session_id_required', '`session_id` is required.');
  return await handleDeleteSession(supabase, userId, session_id);

      case 'updateSessionTitle':
        if (!session_id) return err('session_id_required', '`session_id` is required.');
  return await handleUpdateSessionTitle(supabase, userId, session_id, title);

      case 'health':
        return await handleHealth(supabase);

      default:
        return err('unknown_action', 'Unknown or missing `action`.');
    }
  } catch (e) {
    const errObj = e as Error & { code?: string };
    console.error('chat-history-error:', { message: errObj.message, stack: errObj.stack, code: errObj.code });
    return err('server_error', 'An unexpected server error occurred.', 500, { code: errObj.code });
  }
});