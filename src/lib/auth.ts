import { supabase } from '@/integrations/supabase/client';

/**
 * Get the current authenticated user's ID
 * @throws Error if user is not authenticated
 * @returns User ID (UUID)
 */
export async function getCurrentUid(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
  
  if (!data?.user?.id) {
    throw new Error('Not authenticated');
  }
  
  return data.user.id;
}

/**
 * Get the current authenticated user's email
 * @throws Error if user is not authenticated
 * @returns User email
 */
export async function getCurrentEmail(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    throw new Error(`Authentication error: ${error.message}`);
  }
  
  if (!data?.user?.email) {
    throw new Error('User email not found');
  }
  
  return data.user.email;
}

/**
 * Check if user is currently authenticated
 * @returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return !!data?.user?.id;
}

/**
 * Handle RLS errors with user-friendly messages
 * @param error Supabase error object
 * @returns User-friendly error message
 */
export function handleRLSError(error: any): string {
  const code = error?.code;
  const message = error?.message || '';

  switch (code) {
    case '42501':
      return 'Permission denied. You do not have access to this resource.';
    case '42P17':
      return 'Database configuration error. Please contact support.';
    case '23505':
      return 'This record already exists.';
    case '23503':
      return 'Related record not found.';
    case 'PGRST116':
      return 'No data found or access denied.';
    default:
      if (message.includes('infinite recursion')) {
        return 'Database configuration error. Please refresh and try again.';
      }
      if (message.includes('violates row-level security')) {
        return 'You do not have permission to perform this action.';
      }
      if (message.includes('Not Acceptable')) {
        return 'Invalid request format. Please try again.';
      }
      return message || 'An unexpected error occurred.';
  }
}
