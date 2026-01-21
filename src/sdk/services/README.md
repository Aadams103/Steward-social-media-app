# API Services & Integration Guide

This directory contains the API service layer that replaces mock data with real backend API calls.

## Overview

The application now includes:

1. **API Client** (`api-client.ts`) - Enhanced HTTP client with retry logic and error handling
2. **API Services** (`api-services.ts`) - Centralized API endpoints for all resources
3. **OAuth Service** (`oauth-service.ts`) - OAuth flow handlers for social platform connections
4. **Real-time Service** (`realtime-service.ts`) - WebSocket and polling for real-time updates

## Usage

### API Hooks (React Query)

Use the hooks from `@/hooks/use-api` to fetch and mutate data:

```tsx
import { usePosts, useCreatePost, useUpdatePost } from '@/hooks/use-api';

function PostsList() {
  const { data, isLoading, error } = usePosts({ status: 'published' });
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.posts.map(post => (
        <div key={post.id}>{post.content}</div>
      ))}
    </div>
  );
}
```

### OAuth Flow

Use the OAuth service to connect social accounts:

```tsx
import { initiateOAuthFlowWithPopup } from '@/sdk/services/oauth-service';

async function connectTwitter() {
  try {
    const connection = await initiateOAuthFlowWithPopup('twitter', organizationId);
    console.log('Connected:', connection);
  } catch (error) {
    console.error('OAuth error:', error);
  }
}
```

### Real-time Updates

Use the real-time hook to subscribe to updates:

```tsx
import { useRealtime } from '@/hooks/use-realtime';

function Dashboard() {
  const { subscribe, isConnected } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe('post_created', (event) => {
      console.log('New post created:', event.payload);
    });

    return unsubscribe;
  }, [subscribe]);

  return <div>WebSocket: {isConnected() ? 'Connected' : 'Disconnected'}</div>;
}
```

## Migration from Mock Data

### Before (Mock Data)

```tsx
import { useAppStore } from '@/store/app-store';

function PostsList() {
  const posts = useAppStore((state) => state.posts);
  // ...
}
```

### After (Real API)

```tsx
import { usePosts } from '@/hooks/use-api';

function PostsList() {
  const { data, isLoading } = usePosts();
  const posts = data?.posts || [];
  // ...
}
```

## Environment Variables

Add these to your `.env` file:

```env
VITE_API_BASE_PATH=/api
VITE_WS_BASE_URL=ws://localhost:8080/ws
VITE_MCP_API_BASE_PATH=/api/mcp
```

## Error Handling

All API calls use the enhanced error handling from `api-client.ts`:

- Automatic retries for retryable errors (429, 500, 502, 503, 504)
- Exponential backoff
- Detailed error messages
- Network error handling

```tsx
import { ApiRequestError } from '@/sdk/core/api-client';

try {
  await postsApi.create(post);
} catch (error) {
  if (error instanceof ApiRequestError) {
    console.error('API Error:', error.code, error.message);
    if (error.statusCode === 401) {
      // Handle authentication error
    }
  }
}
```

## Next Steps

1. Update components to use `use-api` hooks instead of `useAppStore` for data fetching
2. Implement OAuth flows in account connection UI
3. Add real-time updates to relevant components
4. Configure backend API endpoints
5. Set up WebSocket server for real-time updates
