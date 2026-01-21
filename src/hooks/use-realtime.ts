/**
 * React hook for real-time updates
 * Integrates WebSocket and polling for real-time data synchronization
 */

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAuthTokenAsync } from '@/sdk/core/auth';
import { realtimeService, type RealtimeEventType, type RealtimeEventHandler } from '@/sdk/services/realtime-service';

/**
 * Hook for managing real-time updates
 */
export function useRealtime() {
  const queryClient = useQueryClient();
  const handlersRef = useRef<Array<() => void>>([]);

  // Connect on mount
  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const token = await getAuthTokenAsync();
        await realtimeService.connect(token || undefined);
      } catch (error) {
        console.error('Failed to connect to real-time service:', error);
        // Fallback to polling if WebSocket fails
      }
    };

    connect();

    return () => {
      mounted = false;
      // Cleanup handlers
      handlersRef.current.forEach((unsubscribe) => unsubscribe());
      handlersRef.current = [];
      realtimeService.disconnect();
    };
  }, []);

  /**
   * Subscribe to real-time events
   */
  const subscribe = useCallback(
    (eventType: RealtimeEventType, handler: RealtimeEventHandler) => {
      const unsubscribe = realtimeService.subscribe(eventType, (event) => {
        handler(event);

        // Auto-invalidate relevant queries based on event type
        switch (eventType) {
          case 'post_created':
          case 'post_updated':
          case 'post_published':
          case 'post_failed':
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            break;
          case 'conversation_created':
          case 'conversation_updated':
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            break;
          case 'publish_job_updated':
            queryClient.invalidateQueries({ queryKey: ['publish-jobs'] });
            break;
          case 'oauth_connection_updated':
            queryClient.invalidateQueries({ queryKey: ['oauth-connections'] });
            break;
        }
      });

      handlersRef.current.push(unsubscribe);
      return unsubscribe;
    },
    [queryClient],
  );

  /**
   * Start polling as fallback
   */
  const startPolling = useCallback(
    (
      resource: 'posts' | 'conversations' | 'publish-jobs',
      interval?: number,
      onUpdate?: (data: unknown) => void,
    ) => {
      return realtimeService.startPolling(resource, interval, onUpdate);
    },
    [],
  );

  return {
    subscribe,
    startPolling,
    isConnected: () => realtimeService.isConnected(),
  };
}

/**
 * Hook for subscribing to specific real-time events
 */
export function useRealtimeEvent<T = unknown>(
  eventType: RealtimeEventType,
  handler: (payload: T) => void,
) {
  const { subscribe } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe(eventType, (event) => {
      handler(event.payload as T);
    });

    return unsubscribe;
  }, [eventType, handler, subscribe]);
}
