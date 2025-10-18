/**
 * Supabase Helper Utilities
 * 
 * Handles common issues like 406 errors from browser extensions
 */

/**
 * Retry a Supabase query if it fails with certain error codes
 * Helps work around browser extension interference
 */
export async function retryQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries: number = 2,
  delayMs: number = 100
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      // If successful or non-retryable error, return immediately
      if (!result.error) {
        return result;
      }
      
      // Check if it's a retryable HTTP error (406, 408, 429, 5xx)
      const statusCode = result.error?.status || result.error?.code;
      const isRetryable = 
        statusCode === 406 || 
        statusCode === 408 || 
        statusCode === 429 || 
        (statusCode >= 500 && statusCode < 600);
      
      if (!isRetryable) {
        // Non-retryable error, return immediately
        return result;
      }
      
      lastError = result.error;
      
      // If not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        console.warn(
          `[supabaseHelpers] Retrying query (attempt ${attempt + 1}/${maxRetries + 1}) after error:`,
          result.error?.message || result.error
        );
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.warn(
          `[supabaseHelpers] Retrying query (attempt ${attempt + 1}/${maxRetries + 1}) after exception:`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }
  
  // All retries failed
  console.error(
    `[supabaseHelpers] Query failed after ${maxRetries + 1} attempts:`,
    lastError
  );
  
  return { data: null, error: lastError };
}

/**
 * Suppress specific error types (like achievements table 404s)
 * Returns null data with no error if the error should be suppressed
 */
export function suppressExpectedErrors<T>(
  result: { data: T | null; error: any },
  options: {
    suppress404?: boolean;
    suppress406?: boolean;
    tableNames?: string[];
  } = {}
): { data: T | null; error: any } {
  const { suppress404 = false, suppress406 = false, tableNames = [] } = options;
  
  if (!result.error) {
    return result;
  }
  
  const statusCode = result.error?.status || result.error?.code;
  const errorMessage = result.error?.message || '';
  
  // Check if this error should be suppressed
  const shouldSuppress404 = suppress404 && statusCode === 404;
  const shouldSuppress406 = suppress406 && statusCode === 406;
  const isTargetTable = tableNames.length === 0 || 
    tableNames.some(table => errorMessage.includes(table));
  
  if ((shouldSuppress404 || shouldSuppress406) && isTargetTable) {
    console.debug(
      `[supabaseHelpers] Suppressing expected ${statusCode} error:`,
      errorMessage
    );
    return { data: null, error: null };
  }
  
  return result;
}
