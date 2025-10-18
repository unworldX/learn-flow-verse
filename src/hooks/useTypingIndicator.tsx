import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TypingUser { id: string; ts: number }

interface UseTypingIndicatorParams {
  channelKey: string; // unique per chat (direct: sorted user ids, group: group id)
  currentUserId?: string;
  mode: 'direct' | 'group';
}

interface TypingState {
  typingUsers: TypingUser[];
  sendTyping: () => void;
}

// Typing events expire after this many ms
const EXPIRY_MS = 5000;
const THROTTLE_MS = 2500;

export function useTypingIndicator({ channelKey, currentUserId, mode }: UseTypingIndicatorParams): TypingState {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef<number>(0);

  // Broadcast that current user is typing (throttled)
  const sendTyping = useCallback(() => {
    if (!currentUserId) return;
    const now = Date.now();
    if (now - lastSentRef.current < THROTTLE_MS) return;
    lastSentRef.current = now;
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, ts: now, mode }
    });
  }, [currentUserId, mode]);

  // Subscribe once per channelKey
  useEffect(() => {
    if (!channelKey) return;
    const channel = supabase.channel(`typing:${channelKey}`);
    channel
      .on('broadcast', { event: 'typing' }, payload => {
        const data = payload.payload as { userId?: string; ts?: number } | null;
        if (!data?.userId || !data.ts) return;
        if (data.userId === currentUserId) return; // ignore self
        setTypingUsers(prev => {
          const without = prev.filter(u => u.id !== data.userId);
          return [...without, { id: data.userId!, ts: data.ts! }];
        });
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); channelRef.current = null; };
  }, [channelKey, currentUserId]);

  // Expire stale typing users
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => prev.filter(u => now - u.ts < EXPIRY_MS));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return { typingUsers, sendTyping };
}
