/**
 * OAuth Service
 * Handles OAuth flows for social platform integrations
 */

import { oauthApi } from './api-services';
import type { OAuthPlatform, OAuthConnection } from '@/types/app';

export interface OAuthInitiateResponse {
  authUrl: string;
  state: string;
}

/**
 * Start OAuth flow for a platform
 */
export async function initiateOAuthFlow(
  platform: OAuthPlatform,
  organizationId: string,
): Promise<OAuthInitiateResponse> {
  const response = await oauthApi.initiate(platform, organizationId);
  return response;
}

/**
 * Complete OAuth flow with callback
 */
export async function completeOAuthFlow(
  state: string,
  code: string,
): Promise<OAuthConnection> {
  const connection = await oauthApi.callback(state, code);
  return connection;
}

/**
 * Handle OAuth callback from redirect
 * Extracts state and code from URL and completes the flow
 */
export async function handleOAuthCallback(
  callbackUrl?: string,
): Promise<OAuthConnection | null> {
  const url = callbackUrl || window.location.href;
  const urlObj = new URL(url);
  const state = urlObj.searchParams.get('state');
  const code = urlObj.searchParams.get('code');
  const error = urlObj.searchParams.get('error');

  if (error) {
    throw new Error(`OAuth error: ${error}`);
  }

  if (!state || !code) {
    return null;
  }

  try {
    const connection = await completeOAuthFlow(state, code);
    
    // Clean up URL
    urlObj.searchParams.delete('state');
    urlObj.searchParams.delete('code');
    window.history.replaceState({}, document.title, urlObj.toString());
    
    return connection;
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
}

/**
 * Open OAuth popup window
 */
export function openOAuthPopup(
  authUrl: string,
  width = 600,
  height = 700,
): Window | null {
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  const popup = window.open(
    authUrl,
    'oauth',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
  );

  return popup;
}

/**
 * Wait for OAuth popup to complete (supports postMessage for Google OAuth)
 */
export function waitForOAuthPopup(
  popup: Window,
  timeout = 300000, // 5 minutes
  usePostMessage = false, // Use postMessage instead of polling URL
): Promise<{ state: string; code: string } | { success: boolean; integrationId?: string; error?: string }> {
  if (usePostMessage) {
    // Use postMessage listener for Google OAuth callback
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      
      const messageHandler = (event: MessageEvent) => {
        // Verify origin for security
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'oauth:complete') {
          window.removeEventListener('message', messageHandler);
          clearTimeout(timeoutId);
          
          if (popup && !popup.closed) {
            popup.close();
          }

          if (event.data.success) {
            resolve({ success: true, integrationId: event.data.integrationId });
          } else {
            reject(new Error(event.data.error || 'OAuth failed'));
          }
        }
      };

      window.addEventListener('message', messageHandler);

      timeoutId = setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        if (popup && !popup.closed) {
          popup.close();
        }
        reject(new Error('OAuth flow timed out'));
      }, timeout);
    });
  }

  // Original URL polling method
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          reject(new Error('OAuth popup was closed'));
          return;
        }

        // Check if popup has navigated to callback URL
        const popupUrl = popup.location.href;
        if (popupUrl.includes('/oauth/callback') || popupUrl.includes('?code=')) {
          const url = new URL(popupUrl);
          const state = url.searchParams.get('state');
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            popup.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (state && code) {
            clearInterval(checkInterval);
            clearTimeout(timeoutId);
            popup.close();
            resolve({ state, code });
          }
        }
      } catch (e) {
        // Cross-origin error - popup hasn't navigated yet
        // Continue polling
      }
    }, 500);

    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      popup.close();
      reject(new Error('OAuth flow timed out'));
    }, timeout);
  });
}

/**
 * Complete OAuth flow with popup
 */
export async function initiateOAuthFlowWithPopup(
  platform: OAuthPlatform,
  organizationId: string,
): Promise<OAuthConnection> {
  // Initiate OAuth flow
  const { authUrl, state } = await initiateOAuthFlow(platform, organizationId);

  // Open popup
  const popup = openOAuthPopup(authUrl);
  if (!popup) {
    throw new Error('Failed to open OAuth popup. Please check popup blockers.');
  }

  try {
    // Wait for popup to complete
    const result = await waitForOAuthPopup(popup);
    
    // Handle different return types
    if ('code' in result) {
      // URL polling method returns { state, code }
      const connection = await completeOAuthFlow(result.state, result.code);
      return connection;
    } else {
      // PostMessage method returns { success, integrationId }
      // This is handled by the postMessage listener, so we shouldn't reach here
      throw new Error('Unexpected OAuth result format');
    }
  } catch (error) {
    popup.close();
    throw error;
  }
}

/**
 * Refresh OAuth token
 */
export async function refreshOAuthToken(connectionId: string): Promise<OAuthConnection> {
  return oauthApi.refresh(connectionId);
}

/**
 * Disconnect OAuth connection
 */
export async function disconnectOAuth(connectionId: string): Promise<void> {
  return oauthApi.disconnect(connectionId);
}

/**
 * Start Google OAuth flow with popup (brand-scoped)
 */
export async function initiateGoogleOAuthFlow(brandId: string): Promise<{ success: boolean; integrationId?: string }> {
  try {
    // Get OAuth start URL from backend
    const response = await fetch(`/api/oauth/google/start?brandId=${encodeURIComponent(brandId)}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to start Google OAuth');
    }

    const { authUrl } = await response.json();

    // Open popup
    const popup = openOAuthPopup(authUrl);
    if (!popup) {
      throw new Error('Failed to open OAuth popup. Please check popup blockers.');
    }

    // Wait for popup to complete (using postMessage)
    const result = await waitForOAuthPopup(popup, 300000, true);
    return result as { success: boolean; integrationId?: string };
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
}
