/**
 * Vertical Slice Component
 * Demonstrates: Create Post → Approve → Publish Job → Realtime Updates
 * This is a minimal implementation to prove the backend integration works
 */

import React, { useEffect, useState } from 'react';
import { usePosts, useCreatePost, useUpdatePost, usePublishPost } from '@/hooks/use-api';
import { usePublishJobs } from '@/hooks/use-api';
import { useRealtime } from '@/hooks/use-realtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Platform } from '@/types/app';

export function PostsVerticalSlice() {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<Platform>('facebook');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // API Hooks
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = usePosts();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const publishPost = usePublishPost();
  const { data: jobsData, isLoading: jobsLoading } = usePublishJobs();

  // Real-time updates
  const { subscribe, isConnected } = useRealtime();

  const posts = postsData?.posts || [];
  const jobs = jobsData?.jobs || [];

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribePost = subscribe('post_created', (event) => {
      console.log('📝 Post created:', event.payload);
      refetchPosts();
    });

    const unsubscribePostUpdate = subscribe('post_updated', (event) => {
      console.log('✏️ Post updated:', event.payload);
      refetchPosts();
    });

    const unsubscribePostPublish = subscribe('post_published', (event) => {
      console.log('🚀 Post published:', event.payload);
      refetchPosts();
    });

    const unsubscribeJob = subscribe('publish_job_updated', (event) => {
      console.log('⚙️ Publish job updated:', event.payload);
      // Jobs will auto-refetch via React Query
    });

    return () => {
      unsubscribePost();
      unsubscribePostUpdate();
      unsubscribePostPublish();
      unsubscribeJob();
    };
  }, [subscribe, refetchPosts]);

  const handleCreatePost = async () => {
    if (!content.trim()) {
      alert('Please enter post content');
      return;
    }

    try {
      const newPost = await createPost.mutateAsync({
        content,
        platform,
        status: 'draft',
        authorId: 'user1',
      });

      console.log('✅ Post created:', newPost);
      setContent('');
      setSelectedPostId(newPost.id);
    } catch (error) {
      console.error('❌ Failed to create post:', error);
      alert('Failed to create post. Check console for details.');
    }
  };

  const handleApprovePost = async (postId: string) => {
    try {
      await updatePost.mutateAsync({
        id: postId,
        updates: { status: 'approved' },
      });
      console.log('✅ Post approved:', postId);
    } catch (error) {
      console.error('❌ Failed to approve post:', error);
    }
  };

  const handlePublishPost = async (postId: string) => {
    try {
      // First approve the post if not already approved
      const post = posts.find((p) => p.id === postId);
      if (post && post.status !== 'approved') {
        await updatePost.mutateAsync({
          id: postId,
          updates: { status: 'approved' },
        });
      }

      // Then create publish job
      const job = await publishPost.mutateAsync(postId);
      console.log('✅ Publish job created:', job);
      alert('Publish job created! Watch the jobs list for real-time status updates.');
    } catch (error) {
      console.error('❌ Failed to publish post:', error);
      alert('Failed to publish post. Check console for details.');
    }
  };

  const getJobForPost = (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return undefined;
    // Find job that matches this post's content or was created for this post
    return jobs.find((job) => 
      job.postContent?.text === post.content ||
      job.postContent?.text?.includes(post.content.substring(0, 50))
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Posts Vertical Slice</h1>
          <p className="text-muted-foreground">
            Create → Approve → Publish → Watch real-time updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected() ? 'default' : 'secondary'}>
            {isConnected() ? '🟢 WebSocket Connected' : '🔴 WebSocket Disconnected'}
          </Badge>
        </div>
      </div>

      {/* Create Post Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Platform</label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="pinterest">Pinterest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Content</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter post content..."
              rows={4}
            />
          </div>
          <Button
            onClick={handleCreatePost}
            disabled={createPost.isPending || !content.trim()}
          >
            {createPost.isPending ? 'Creating...' : 'Create Post'}
          </Button>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <div>Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No posts yet. Create one above!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => {
                const job = getJobForPost(post.id);
                return (
                  <div
                    key={post.id}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge>{post.platform}</Badge>
                          <Badge variant={
                            post.status === 'published' ? 'default' :
                            post.status === 'approved' ? 'secondary' :
                            'outline'
                          }>
                            {post.status}
                          </Badge>
                          {job && (
                            <Badge variant="outline">
                              Job: {job.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{post.content}</p>
                        {post.publishedTime && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Published: {new Date(post.publishedTime).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {post.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprovePost(post.id)}
                            disabled={updatePost.isPending}
                          >
                            Approve
                          </Button>
                        )}
                        {post.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handlePublishPost(post.id)}
                            disabled={publishPost.isPending}
                          >
                            Publish
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publish Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Publish Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div>Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No publish jobs yet. Publish a post to create one!
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge>{job.platform}</Badge>
                    <Badge variant={
                      job.status === 'completed' ? 'default' :
                      job.status === 'processing' ? 'secondary' :
                      'outline'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm">{job.postContent.text}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Created: {new Date(job.createdAt).toLocaleString()}</p>
                    {job.processedAt && (
                      <p>Processed: {new Date(job.processedAt).toLocaleString()}</p>
                    )}
                    {job.completedAt && (
                      <p>Completed: {new Date(job.completedAt).toLocaleString()}</p>
                    )}
                    {job.publishedUrl && (
                      <p>
                        <a href={job.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          View Published Post →
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
