/**
 * Retry utility for API calls with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  onRetry?: (attempt: number, error: any) => void
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T | null> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry
  } = options
  
  let lastError: any
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on certain errors
      if (error.code === 401 || error.code === 403) {
        console.error(`Authentication error, not retrying: ${error.message}`)
        throw error
      }
      
      if (attempt === maxAttempts) {
        console.error(`Max retry attempts (${maxAttempts}) reached`)
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      )
      
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`)
      
      if (onRetry) {
        onRetry(attempt, error)
      }
      
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  console.error('All retry attempts failed:', lastError)
  return null
}

/**
 * Batch process items with error recovery
 */
export async function processBatchWithRecovery<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number
    continueOnError?: boolean
    onError?: (item: T, error: any) => void
  } = {}
): Promise<{ successful: R[]; failed: Array<{ item: T; error: any }> }> {
  const {
    batchSize = 5,
    continueOnError = true,
    onError
  } = options
  
  const successful: R[] = []
  const failed: Array<{ item: T; error: any }> = []
  
  // Process in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    const promises = batch.map(async (item) => {
      try {
        const result = await processor(item)
        successful.push(result)
        return { success: true, result }
      } catch (error: any) {
        console.error(`Error processing item:`, error)
        failed.push({ item, error })
        
        if (onError) {
          onError(item, error)
        }
        
        if (!continueOnError) {
          throw error
        }
        
        return { success: false, error }
      }
    })
    
    await Promise.all(promises)
  }
  
  return { successful, failed }
}

/**
 * Fetch with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`)
    }
    throw error
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(
  json: string,
  fallback: T
): T {
  try {
    return JSON.parse(json)
  } catch (error) {
    console.error('JSON parse error:', error)
    return fallback
  }
}

/**
 * Partial data save helper
 */
export async function savePartialData(
  saveFunction: (data: any) => Promise<void>,
  data: any,
  description: string
): Promise<boolean> {
  try {
    await saveFunction(data)
    console.log(`Successfully saved ${description}`)
    return true
  } catch (error) {
    console.error(`Failed to save ${description}:`, error)
    return false
  }
}