/**
 * API Retry Utility
 * Handles transient failures with exponential backoff
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any) => {
    // Retry on network errors, 5xx errors, and rate limiting
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
      return true;
    }
    if (error?.response?.status >= 500) {
      return true;
    }
    if (error?.response?.status === 429) { // Rate limit
      return true;
    }
    if (error?.message?.includes('quota')) {
      return false; // Don't retry quota errors
    }
    return false;
  }
};

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or error is not retryable
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt),
        opts.maxDelay
      );


      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if error is a Google API quota error
 */
export function isQuotaError(error: any): boolean {
  if (error?.code === 429) return true;
  if (error?.message?.toLowerCase().includes('quota')) return true;
  if (error?.response?.data?.error?.message?.toLowerCase().includes('quota')) return true;
  return false;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || error?.code === 'ENOTFOUND') {
    return true;
  }

  // Server errors (5xx)
  if (error?.response?.status >= 500 && error?.response?.status < 600) {
    return true;
  }

  // Rate limiting (but not quota exceeded)
  if (error?.response?.status === 429 && !isQuotaError(error)) {
    return true;
  }

  return false;
}

/**
 * Extract error message for logging
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.response?.data?.error?.message) return error.response.data.error.message;
  if (error?.response?.statusText) return error.response.statusText;
  return 'Unknown error';
}
