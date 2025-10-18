import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResult { error: unknown | null }
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);