/**
 * Real-time Service
 * Handles WebSocket connections and polling for real-time updates
 */

import { postsApi, conversationsApi, publishJobsApi } from './api-services';
import type { Post, Conversation, PublishJob } from '@/types/app';

export type RealtimeEventType =
  | 'post_created'
  | 'post_updated'
  | 'post_published'
  | 'post_failed'
  | 'conversation_created'
  | 'conversation_updated'
  | 'publish_job_updated'
  | 'oauth_connection_updated';

export interface RealtimeEvent {
  type: RealtimeEventType;
  payload: unknown;
  timestamp: Date;
}

export type RealtimeEventHandler = (event: RealtimeEvent) => void;

class RealtimeService {
  private ws: WebSocket | null = null;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<RealtimeEventType, Set<RealtimeEventHandler>> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isPolling = false;

  constructor() {
    const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || '';
    const apiBase = import.meta.env.VITE_API_BASE_PATH || '/api';
    this.wsUrl = wsBaseUrl || `${apiBase.replace('/api', '').replace('http', 'ws')}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(token?: string): Promise<void> {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:47',message:'Realtime connect start',data:{hasToken:!!token,wsUrl:this.wsUrl,isConnecting:this.isConnecting,readyState:this.ws?.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:50',message:'Realtime connect skipped',data:{reason:this.isConnecting?'connecting':'already_open'},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }

    this.isConnecting = true;

    try {
      const url = token ? `${this.wsUrl}?token=${token}` : this.wsUrl;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:57',message:'Realtime WebSocket creating',data:{url,hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:60',message:'Realtime WebSocket opened',data:{readyState:this.ws?.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:66',message:'Realtime message received',data:{dataLength:event.data?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:69',message:'Realtime event parsed',data:{eventType:data.type,hasPayload:!!data.payload},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          this.handleEvent(data);
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:73',message:'Realtime parse error',data:{error:error instanceof Error?error.message:String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:77',message:'Realtime WebSocket error',data:{readyState:this.ws?.readyState},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7fc858c1-7495-471e-9aa5-ff96e8b59c94',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'realtime-service.ts:82',message:'Realtime WebSocket closed',data:{reconnectAttempts:this.reconnectAttempts},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.attemptReconnect(token);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      throw error;
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnect(token?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(eventType: RealtimeEventType, handler: RealtimeEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.eventHandlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Handle incoming event
   */
  private handleEvent(event: RealtimeEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * Start polling for updates (fallback when WebSocket is unavailable)
   */
  startPolling(
    resource: 'posts' | 'conversations' | 'publish-jobs',
    interval = 30000, // 30 seconds default
    onUpdate?: (data: unknown) => void,
  ): () => void {
    if (this.isPolling) {
      return () => this.stopPolling(resource);
    }

    this.isPolling = true;
    const pollId = `${resource}-${Date.now()}`;

    const poll = async () => {
      try {
        let data: unknown;

        switch (resource) {
          case 'posts':
            data = await postsApi.list();
            break;
          case 'conversations':
            data = await conversationsApi.list();
            break;
          case 'publish-jobs':
            data = await publishJobsApi.list();
            break;
        }

        if (onUpdate) {
          onUpdate(data);
        }
      } catch (error) {
        console.error(`Polling error for ${resource}:`, error);
      }
    };

    // Initial poll
    poll();

    // Set up interval
    const intervalId = setInterval(poll, interval);
    this.pollingIntervals.set(pollId, intervalId);

    // Return stop function
    return () => {
      this.stopPolling(pollId);
    };
  }

  /**
   * Stop polling
   */
  stopPolling(pollId: string): void {
    const interval = this.pollingIntervals.get(pollId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(pollId);
    }

    if (this.pollingIntervals.size === 0) {
      this.isPolling = false;
    }
  }

  /**
   * Stop all polling
   */
  stopAllPolling(): void {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
    this.isPolling = false;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

/**
 * Hook for using real-time updates in React components
 */
export function useRealtimeUpdates() {
  return {
    connect: (token?: string) => realtimeService.connect(token),
    disconnect: () => realtimeService.disconnect(),
    subscribe: (eventType: RealtimeEventType, handler: RealtimeEventHandler) =>
      realtimeService.subscribe(eventType, handler),
    startPolling: (
      resource: 'posts' | 'conversations' | 'publish-jobs',
      interval?: number,
      onUpdate?: (data: unknown) => void,
    ) => realtimeService.startPolling(resource, interval, onUpdate),
    stopPolling: (pollId: string) => realtimeService.stopPolling(pollId),
    stopAllPolling: () => realtimeService.stopAllPolling(),
    isConnected: () => realtimeService.isConnected(),
  };
}
