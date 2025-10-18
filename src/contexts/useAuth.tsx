// Re-exported hook to avoid Fast Refresh warning by keeping AuthContext file focused on provider component.
import { useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import React from 'react';
import type { } from 'react';
// We import the context from AuthContext file
import { AuthContext } from './AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export type { User, Session };