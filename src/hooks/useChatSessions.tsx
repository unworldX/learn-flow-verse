import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { useToast } from '@/hooks/use-toast';
import { handleRLSError } from '@/lib/auth';
import { ChatSessionSummary, ChatSessionDetail, PersistedChatMessage } from '@/types/ai';

type FnError = { code?: string; message: string; details?: unknown };
type FnEnvelope<T> =
  | { ok: true; data: T; error?: never }
  | { ok: false; error: FnError; data?: never };

function parseEnvelope<T>(raw: unknown): FnEnvelope<T> | null {
  if (!raw || typeof raw !== 'object') return null;
  const env = raw as { ok?: boolean; data?: unknown; error?: FnError };
  if (env.ok === true) return { ok: true, data: env.data as T };
  if (env.ok === false && env.error) return { ok: false, error: env.error };
  return null;
}

const LOCAL_KEY = 'guest-chat-sessions-v1';

export function useChatSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load guest sessions from localStorage
  const loadGuestSessions = (): ChatSessionSummary[] => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as { summaries: ChatSessionSummary[] };
      return parsed.summaries || [];
    } catch { return []; }
  };

  const persistGuestSessions = (summaries: ChatSessionSummary[], full?: Record<string, PersistedChatMessage[]>) => {
    try {
      const existingRaw = localStorage.getItem(LOCAL_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      localStorage.setItem(LOCAL_KEY, JSON.stringify({
        summaries,
        messages: { ...(existing.messages || {}), ...(full || {}) }
      }));
    } catch {/* ignore */ }
  };

  const loadGuestSessionDetail = (id: string): ChatSessionDetail | null => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const messages = parsed.messages?.[id] || [];
      const summary = (parsed.summaries as ChatSessionSummary[]).find(s => s.id === id);
      if (!summary) return null;
      const session = {
        id: summary.id,
        title: summary.derived_title,
        created_at: summary.created_at,
        updated_at: summary.updated_at,
      };
      return { session, messages };
    } catch { return null; }
  };

  const listSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      if (!user) {
        setSessions(loadGuestSessions());
        return;
      }
      // Delay until access token available to reduce 401 race
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('chat-history', {
        body: { action: 'listSessions' },
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (error) throw error;
      const env = parseEnvelope<{ sessions: ChatSessionSummary[] }>(data);
      if (env && env.ok) {
        setSessions(env.data.sessions);
      } else if (env && !env.ok) {
        throw new Error(env.error?.message || 'Server error while listing sessions');
      }
    } catch (e: unknown) {
      const msg = handleRLSError(e);
      toast({ title: 'Load failed', description: msg, variant: 'destructive' });
    } finally {
      setLoadingSessions(false);
    }
  }, [user, toast]);

  // Auto-load sessions only when user state is resolved to avoid 401 spam
  useEffect(() => {
    if (user !== undefined) {
      listSessions();
    }
  }, [user, listSessions]);

  const loadSession = useCallback(async (sessionId: string): Promise<ChatSessionDetail | null> => {
    setLoadingMessages(true);
    try {
      if (!user) {
        return loadGuestSessionDetail(sessionId);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('chat-history', {
        body: { action: 'getSession', session_id: sessionId },
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (error) throw error;
      const env = parseEnvelope<ChatSessionDetail>(data);
      if (env && env.ok) return env.data;
      if (env && !env.ok) throw new Error(env.error?.message || 'Server error while loading session');
      throw new Error('Invalid response');
    } catch (e: unknown) {
      const msg = handleRLSError(e);
      toast({ title: 'Load failed', description: msg, variant: 'destructive' });
      return null;
    } finally {
      setLoadingMessages(false);
    }
  }, [user, toast]);

  const createSession = useCallback(async (initialMessages: Omit<PersistedChatMessage, 'session_id'>[]): Promise<string | null> => {
    if (!initialMessages.length) return null;
    setSaving(true);
    try {
      const newSessionId = crypto.randomUUID();
      if (!user) {
        const first = initialMessages.find(m => m.role === 'user');
        const summary: ChatSessionSummary = {
          id: newSessionId,
          derived_title: first ? first.content.slice(0, 80) : 'New Session',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          message_count: initialMessages.length,
          last_message_at: new Date().toISOString()
        };
        const fullMessages = initialMessages.map(m => ({ ...m, session_id: newSessionId }));
        const updatedSummaries = [summary, ...sessions];
        setSessions(updatedSummaries);
        persistGuestSessions(updatedSummaries, { [newSessionId]: fullMessages });
        return newSessionId;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const payload = { action: 'createSession', title: undefined, messages: initialMessages.map(m => ({ role: m.role, content: m.content, id: m.id, created_at: m.created_at })) };
      const { data, error } = await supabase.functions.invoke('chat-history', {
        body: payload,
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (error) throw error;
      const env = parseEnvelope<{ session_id: string }>(data);
      if (env && env.ok && env.data?.session_id) {
        await listSessions();
        return env.data.session_id;
      }
      if (env && !env.ok) throw new Error(env.error?.message || 'Server error while creating session');
      throw new Error('Failed to parse createSession response');
    } catch (e: unknown) {
      const msg = handleRLSError(e);
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
      return null;
    } finally { setSaving(false); }
  }, [user, sessions, listSessions, toast]);

  const appendMessages = useCallback(async (messages: Omit<PersistedChatMessage, 'session_id'>[]) => {
    if (!messages.length || !currentSessionId) return;
    setSaving(true);
    try {
      if (!user) {
        const sessionDetail = loadGuestSessionDetail(currentSessionId);
        if (!sessionDetail) throw new Error("Guest session not found");

        const fullMessages = messages.map(m => ({ ...m, session_id: currentSessionId }));
        const newMsgs = [...sessionDetail.messages, ...fullMessages];

        const updatedSummaries = sessions.map(s => s.id === currentSessionId ? { ...s, message_count: newMsgs.length, updated_at: new Date().toISOString(), last_message_at: new Date().toISOString() } : s);
        setSessions(updatedSummaries);
        persistGuestSessions(updatedSummaries, { [currentSessionId]: newMsgs });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const payload = { action: 'appendMessages', session_id: currentSessionId, messages: messages.map(m => ({ role: m.role, content: m.content, id: m.id, created_at: m.created_at })) };
      const { data, error } = await supabase.functions.invoke('chat-history', {
        body: payload,
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (error) throw error;
      const env = parseEnvelope<{ status: string }>(data);
      if (env && env.ok) await listSessions();
      else if (env && !env.ok) throw new Error(env.error?.message || 'Server error while appending messages');
    } catch (e: unknown) {
      const msg = handleRLSError(e);
      toast({ title: 'Append failed', description: msg, variant: 'destructive' });
    } finally { setSaving(false); }
  }, [user, currentSessionId, sessions, listSessions, toast]);

  const deleteSession = useCallback(async (id: string) => {
    try {
      if (!user) {
        const filtered = sessions.filter(s => s.id !== id);
        setSessions(filtered);
        const existingRaw = localStorage.getItem(LOCAL_KEY);
        if (existingRaw) {
          const existing = JSON.parse(existingRaw);
          delete existing.messages[id];
          persistGuestSessions(filtered, existing.messages);
        }
        if (currentSessionId === id) {
          setCurrentSessionId(null);
        }
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('chat-history', {
        body: { action: 'deleteSession', session_id: id },
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (error) throw error;
      const env = parseEnvelope<{ status: string }>(data);
      if (env && env.ok) await listSessions();
      else if (env && !env.ok) throw new Error(env.error?.message || 'Server error while deleting session');
      if (currentSessionId === id) { setCurrentSessionId(null); }
    } catch (e: unknown) {
      const msg = handleRLSError(e);
      toast({ title: 'Delete failed', description: msg, variant: 'destructive' });
    }
  }, [user, sessions, currentSessionId, listSessions, toast]);

  return {
    sessions,
    listSessions,
    loadSession,
    deleteSession,
    createSession,
    appendMessages,
    currentSessionId,
    setCurrentSessionId,
    loadingSessions,
    loadingMessages,
    saving
  };
}