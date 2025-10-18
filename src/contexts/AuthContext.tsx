import { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { isAuthDebugEnabled } from '@/components/debug/authDebug';
import { useToast } from '@/hooks/use-toast';

interface AuthResult { error: unknown | null }
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const debug = isAuthDebugEnabled();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (debug) {
        console.groupCollapsed('[Auth] State Change', event);
        console.log('Session:', nextSession);
        console.log('User:', nextSession?.user);
        console.groupEnd();
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (debug) {
        console.info('[Auth] Initial session resolved', { hasSession: !!initial });
      }
      setSession(initial);
      setUser(initial?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [debug]);

  const signUp = async (email: string, password: string, username?: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: username ? { username } : undefined
        }
      });
      if (error) {
        if (debug) console.warn('[Auth] signUp error', error);
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
        return { error };
      }
      if (debug) console.info('[Auth] signUp success', { userId: data.user?.id });
      toast({ title: 'Account created', description: 'Please check your email to verify your account' });
      return { error: null };
    } catch (error) {
      if (debug) console.error('[Auth] signUp exception', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });
      if (error) {
        if (debug) console.warn('[Auth] signIn error', error);
        toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
        return { error };
      }
      if (debug) console.info('[Auth] signIn success', { userId: data.user?.id });
      toast({ title: 'Welcome back!', description: 'You have successfully signed in' });
      return { error: null };
    } catch (error) {
      if (debug) console.error('[Auth] signIn exception', error);
      return { error };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login`
      });
      if (error) {
        if (debug) console.warn('[Auth] resetPassword error', error);
        toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
        return { error };
      }
      toast({ title: 'Email sent', description: 'Check your inbox for reset link' });
      return { error: null };
    } catch (error) {
      if (debug) console.error('[Auth] resetPassword exception', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      if (debug) console.info('[Auth] signOut completed');
      toast({ title: 'Signed out', description: 'You have been signed out successfully' });
  navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = { user, session, loading, signUp, signIn, signOut, resetPassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth hook moved to separate file to keep this module focused for Fast Refresh