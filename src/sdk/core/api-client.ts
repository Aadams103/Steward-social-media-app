/**
 * API Client with enhanced error handling and retry logic
 * Provides a centralized way to make authenticated API calls with automatic retries
 */

import { platformRequest, PlatformRequestError } from './request';

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatusCodes?: number[];
  exponentialBackoff?: boolean;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  exponentialBackoff: true,
};

/**
 * Check if an error is retryable based on status code
 */
function isRetryableError(statusCode: number, retryableStatusCodes: number[]): boolean {
  return retryableStatusCodes.includes(statusCode);
}

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(attempt: number, baseDelay: number, exponentialBackoff: boolean): number {
  if (!exponentialBackoff) return baseDelay;
  return Math.min(baseDelay * Math.pow(2, attempt), 30000); // Max 30 seconds
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Enhanced fetch with retry logic and error handling
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {},
  retryConfig: RetryConfig = {},
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await platformRequest(url, options);

      // Handle successful responses (platformRequest only returns ok responses)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const jsonData = await response.json();
        return jsonData;
      }
      const textData = await response.text();
      return textData as T;
    } catch (error) {
      // Convert PlatformRequestError to ApiRequestError for consistent handling
      if (error instanceof PlatformRequestError) {
        const apiError: ApiError = {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
        };
        lastError = new ApiRequestError(apiError);
        
        // Check if error is retryable
        if (error.statusCode && attempt < config.maxRetries && isRetryableError(error.statusCode, config.retryableStatusCodes)) {
          const delay = calculateRetryDelay(attempt, config.retryDelay, config.exponentialBackoff);
          console.warn(
            `API request failed (attempt ${attempt + 1}/${config.maxRetries + 1}): ${error.statusCode}. Retrying in ${delay}ms...`,
          );
          await sleep(delay);
          continue;
        }
        // Not retryable or max retries reached - will throw at end
      } else if (error instanceof ApiRequestError) {
        lastError = error;
        // Check if error is retryable
        if (error.statusCode && attempt < config.maxRetries && isRetryableError(error.statusCode, config.retryableStatusCodes)) {
          const delay = calculateRetryDelay(attempt, config.retryDelay, config.exponentialBackoff);
          console.warn(
            `API request failed (attempt ${attempt + 1}/${config.maxRetries + 1}): ${error.statusCode}. Retrying in ${delay}ms...`,
          );
          await sleep(delay);
          continue;
        }
        // Not retryable or max retries reached - will throw at end
      } else {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Network errors are always retryable
        if (error instanceof TypeError && error.message.includes('fetch') && attempt < config.maxRetries) {
          const delay = calculateRetryDelay(attempt, config.retryDelay, config.exponentialBackoff);
          console.warn(`Network error (attempt ${attempt + 1}/${config.maxRetries + 1}). Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        // Not a network error or max retries reached - will throw at end
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Custom error class for API requests
 */
export class ApiRequestError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.code = error.code;
    this.statusCode = error.statusCode;
    this.details = error.details;
  }
}

/**
 * API client with common HTTP methods
 */
export const apiClient = {
  get: <T = unknown>(url: string, options?: RequestInit, retryConfig?: RetryConfig) =>
    apiRequest<T>(url, { ...options, method: 'GET' }, retryConfig),

  post: <T = unknown>(url: string, data?: unknown, options?: RequestInit, retryConfig?: RetryConfig) =>
    apiRequest<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      retryConfig,
    ),

  put: <T = unknown>(url: string, data?: unknown, options?: RequestInit, retryConfig?: RetryConfig) =>
    apiRequest<T>(
      url,
      {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      retryConfig,
    ),

  patch: <T = unknown>(url: string, data?: unknown, options?: RequestInit, retryConfig?: RetryConfig) =>
    apiRequest<T>(
      url,
      {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      retryConfig,
    ),

  delete: <T = unknown>(url: string, options?: RequestInit, retryConfig?: RetryConfig) =>
    apiRequest<T>(url, { ...options, method: 'DELETE' }, retryConfig),
};
