/**
 * Example component showing migration from mock data to real API calls
 * This demonstrates how to replace useAppStore with use-api hooks
 */

import React from 'react';
import { usePosts, useCreatePost, useUpdatePost, useDeletePost } from '@/hooks/use-api';
import { useRealtime } from '@/hooks/use-realtime';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * BEFORE: Using mock data from store
 */
// import { useAppStore } from '@/store/app-store';
// 
// function PostsListOld() {
//   const posts = useAppStore((state) => state.posts);
//   const addPost = useAppStore((state) => state.addPost);
//   const updatePost = useAppStore((state) => state.updatePost);
//   const deletePost = useAppStore((state) => state.deletePost);
//   
//   // Mock data - no loading states, no error handling
//   return <div>{posts.map(post => ...)}</div>;
// }

/**
 * AFTER: Using real API with React Query
 */
export function PostsList() {
  // Fetch posts from API
  const { data, isLoading, error, refetch } = usePosts({ status: 'published' });
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  // Real-time updates
  const { subscribe, isConnected } = useRealtime();

  // Subscribe to real-time post updates
  React.useEffect(() => {
    const unsubscribe = subscribe('post_created', (event) => {
      console.log('New post created:', event.payload);
      refetch(); // Refresh the list
    });

    return unsubscribe;
  }, [subscribe, refetch]);

  if (isLoading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div>Error loading posts: {error.message}</div>;
  }

  const posts = data?.posts || [];

  const handleCreate = async () => {
    try {
      await createPost.mutateAsync({
        content: 'New post content',
        platform: 'facebook',
        status: 'draft',
        authorId: 'user1',
      });
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2>Posts</h2>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500">
            {isConnected() ? '🟢 Live' : '🔴 Offline'}
          </span>
          <Button onClick={handleCreate} disabled={createPost.isPending}>
            {createPost.isPending ? 'Creating...' : 'Create Post'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{post.content}</h3>
                <p className="text-sm text-gray-500">
                  {post.platform} • {post.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updatePost.mutate({ id: post.id, updates: { status: 'published' } })}
                  disabled={updatePost.isPending}
                >
                  Update
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deletePost.mutate(post.id)}
                  disabled={deletePost.isPending}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
