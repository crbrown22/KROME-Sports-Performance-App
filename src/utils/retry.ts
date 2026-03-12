export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check if error is 503 (Unavailable) or 429 (Resource Exhausted)
    const isRetryable = 
      error?.code === 503 || error?.status === 503 || error?.message?.includes('503') ||
      error?.code === 429 || error?.status === 429 || error?.message?.includes('429');
    
    if (retries > 0 && isRetryable) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}
