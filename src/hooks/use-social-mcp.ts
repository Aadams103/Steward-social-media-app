import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { callMCPTool } from '@/sdk/core/mcp-client';

// ============================================================================
// MCP Response Wrapper - MANDATORY for all MCP tool calls
// ============================================================================

export interface MCPToolResponse {
  content: Array<{
    type: "text";
    text: string; // JSON string containing actual tool data
  }>;
}

// ============================================================================
// TWITTER/X MCP TOOLS (MCP ID: 6878b48778cebe29245396c0)
// ============================================================================

// --- Twitter: Create Post ---

export interface TwitterCreatePostInput {
  text?: string;
  card_uri?: string;
  direct_message_deep_link?: string;
  for_super_followers_only?: boolean;
  geo__place__id?: string;
  media__media__ids?: string[];
  media__tagged__user__ids?: string[];
  nullcast?: boolean;
  poll__duration__minutes?: number;
  poll__options?: string[];
  poll__reply__settings?: 'following' | 'mentionedUsers';
  quote_tweet_id?: string;
  reply__exclude__reply__user__ids?: string[];
  reply__in__reply__to__tweet__id?: string;
  reply_settings?: 'following' | 'mentionedUsers' | 'subscribers';
}

export interface TwitterCreatePostOutput {
  data: {
    data?: {
      id: string;
      text: string;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterCreatePost(
  options?: UseMutationOptions<TwitterCreatePostOutput, Error, TwitterCreatePostInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterCreatePostInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterCreatePostInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_CREATION_OF_A_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterCreatePostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
      queryClient.invalidateQueries({ queryKey: ['twitter-timeline'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Delete Post ---

export interface TwitterDeletePostInput {
  id: string;
}

export interface TwitterDeletePostOutput {
  data: {
    data?: {
      deleted?: boolean;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterDeletePost(
  options?: UseMutationOptions<TwitterDeletePostOutput, Error, TwitterDeletePostInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterDeletePostInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterDeletePostInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_POST_DELETE_BY_POST_ID',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterDeletePostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Get Post by ID ---

export interface TwitterGetPostInput {
  id: string;
  expansions?: string[];
  media__fields?: string[];
  place__fields?: string[];
  poll__fields?: string[];
  tweet__fields?: string[];
  user__fields?: string[];
}

export interface TwitterGetPostOutput {
  data: {
    data?: {
      id?: string;
      text?: string;
      author_id?: string;
      created_at?: string;
      [key: string]: unknown;
    };
    includes?: {
      users?: Array<{ id: string; name: string; username: string; [key: string]: unknown }>;
      [key: string]: unknown;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterGetPost(
  params?: TwitterGetPostInput,
  options?: UseQueryOptions<TwitterGetPostOutput, Error>
) {
  return useQuery({
    queryKey: ['twitter-post', params?.id, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterGetPostInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_POST_LOOKUP_BY_POST_ID',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterGetPostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Recent Search ---

export interface TwitterRecentSearchInput {
  query: string;
  max_results?: number;
  start_time?: string;
  end_time?: string;
  next_token?: string;
  expansions?: string[];
  tweet__fields?: string[];
  user__fields?: string[];
}

export interface TwitterRecentSearchOutput {
  data: {
    data?: Array<{
      id: string;
      text: string;
      [key: string]: unknown;
    }>;
    meta?: {
      newest_id?: string;
      oldest_id?: string;
      result_count?: number;
      next_token?: string;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterRecentSearch(
  params?: TwitterRecentSearchInput,
  options?: UseQueryOptions<TwitterRecentSearchOutput, Error>
) {
  return useQuery({
    queryKey: ['twitter-search', params?.query, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterRecentSearchInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_RECENT_SEARCH',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterRecentSearchOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.query,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: User Home Timeline ---

export interface TwitterUserTimelineInput {
  id: string;
  max_results?: number;
  pagination_token?: string;
  expansions?: string[];
  tweet__fields?: string[];
  user__fields?: string[];
}

export interface TwitterUserTimelineOutput {
  data: {
    data?: Array<{
      id: string;
      text: string;
      [key: string]: unknown;
    }>;
    meta?: {
      result_count?: number;
      next_token?: string;
      previous_token?: string;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterUserTimeline(
  params?: TwitterUserTimelineInput,
  options?: UseQueryOptions<TwitterUserTimelineOutput, Error>
) {
  return useQuery({
    queryKey: ['twitter-timeline', params?.id, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterUserTimelineInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_USER_HOME_TIMELINE_BY_USER_ID',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterUserTimelineOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Like Post ---

export interface TwitterLikePostInput {
  id: string;
  tweet_id: string;
}

export interface TwitterLikePostOutput {
  data: {
    data?: {
      liked?: boolean;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterLikePost(
  options?: UseMutationOptions<TwitterLikePostOutput, Error, TwitterLikePostInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterLikePostInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterLikePostInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_USER_LIKE_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterLikePostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Unlike Post ---

export interface TwitterUnlikePostInput {
  id: string;
  tweet_id: string;
}

export interface TwitterUnlikePostOutput {
  data: {
    data?: {
      liked?: boolean;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterUnlikePost(
  options?: UseMutationOptions<TwitterUnlikePostOutput, Error, TwitterUnlikePostInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterUnlikePostInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterUnlikePostInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_UNLIKE_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterUnlikePostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Retweet Post ---

export interface TwitterRetweetInput {
  id: string;
  tweet_id: string;
}

export interface TwitterRetweetOutput {
  data: {
    data?: {
      retweeted?: boolean;
      id?: string;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterRetweet(
  options?: UseMutationOptions<TwitterRetweetOutput, Error, TwitterRetweetInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterRetweetInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterRetweetInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_RETWEET_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterRetweetOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Unretweet Post ---

export interface TwitterUnretweetInput {
  source_user_id: string;
  source_tweet_id: string;
}

export interface TwitterUnretweetOutput {
  data: {
    data?: {
      retweeted?: boolean;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterUnretweet(
  options?: UseMutationOptions<TwitterUnretweetOutput, Error, TwitterUnretweetInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterUnretweetInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterUnretweetInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_UNRETWEET_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterUnretweetOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-posts'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Follow User ---

export interface TwitterFollowUserInput {
  source_user_id: string;
  target_user_id: string;
}

export interface TwitterFollowUserOutput {
  data: {
    data?: {
      following?: boolean;
      pending_follow?: boolean;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterFollowUser(
  options?: UseMutationOptions<TwitterFollowUserOutput, Error, TwitterFollowUserInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterFollowUserInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterFollowUserInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_FOLLOW_USER',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterFollowUserOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-users'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Twitter: Unfollow User ---

export interface TwitterUnfollowUserInput {
  source_user_id: string;
  target_user_id: string;
}

export interface TwitterUnfollowUserOutput {
  data: {
    data?: {
      following?: boolean;
    };
    errors?: Array<{
      detail?: string;
      status?: number;
      title: string;
      type: string;
    }>;
  };
  error?: string;
  successful: boolean;
}

export function useTwitterUnfollowUser(
  options?: UseMutationOptions<TwitterUnfollowUserOutput, Error, TwitterUnfollowUserInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TwitterUnfollowUserInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, TwitterUnfollowUserInput>(
        '6878b48778cebe29245396c0',
        'TWITTER_UNFOLLOW_USER',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: TwitterUnfollowUserOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['twitter-users'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// ============================================================================
// REDDIT MCP TOOLS (MCP ID: 6878f9b97df7dc701c215ca3)
// ============================================================================

// --- Reddit: Create Post ---

export interface RedditCreatePostInput {
  subreddit: string;
  title: string;
  flair_id: string;
  kind: 'link' | 'self';
  text?: string;
  url?: string;
}

export interface RedditCreatePostOutput {
  data: {
    id: string;
    url: string;
  };
  error?: string;
  successful: boolean;
}

export function useRedditCreatePost(
  options?: UseMutationOptions<RedditCreatePostOutput, Error, RedditCreatePostInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RedditCreatePostInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, RedditCreatePostInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_CREATE_REDDIT_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditCreatePostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-posts'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Delete Post ---

export interface RedditDeletePostInput {
  id: string;
}

export interface RedditDeletePostOutput {
  data: {
    success: boolean;
  };
  error?: string;
  successful: boolean;
}

export function useRedditDeletePost(
  options?: UseMutationOptions<RedditDeletePostOutput, Error, RedditDeletePostInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RedditDeletePostInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, RedditDeletePostInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_DELETE_REDDIT_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditDeletePostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-posts'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Post Comment ---

export interface RedditPostCommentInput {
  thing_id: string;
  text: string;
}

export interface RedditPostCommentOutput {
  data: {
    id: string;
    parent_id: string;
    text: string;
  };
  error?: string;
  successful: boolean;
}

export function useRedditPostComment(
  options?: UseMutationOptions<RedditPostCommentOutput, Error, RedditPostCommentInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RedditPostCommentInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, RedditPostCommentInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_POST_REDDIT_COMMENT',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditPostCommentOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-comments'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Delete Comment ---

export interface RedditDeleteCommentInput {
  id: string;
}

export interface RedditDeleteCommentOutput {
  data: {
    success: boolean;
  };
  error?: string;
  successful: boolean;
}

export function useRedditDeleteComment(
  options?: UseMutationOptions<RedditDeleteCommentOutput, Error, RedditDeleteCommentInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RedditDeleteCommentInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, RedditDeleteCommentInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_DELETE_REDDIT_COMMENT',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditDeleteCommentOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-comments'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Retrieve Post ---

export interface RedditRetrievePostInput {
  subreddit: string;
  size?: number;
}

export interface RedditRetrievePostOutput {
  data: {
    posts_list: Array<Record<string, unknown>>;
  };
  error?: string;
  successful: boolean;
}

export function useRedditRetrievePost(
  params?: RedditRetrievePostInput,
  options?: UseQueryOptions<RedditRetrievePostOutput, Error>
) {
  return useQuery({
    queryKey: ['reddit-posts', params?.subreddit, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, RedditRetrievePostInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_RETRIEVE_REDDIT_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditRetrievePostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.subreddit,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Search Across Subreddits ---

export interface RedditSearchInput {
  search_query: string;
  limit?: number;
  restrict_sr?: boolean;
  sort?: 'relevance' | 'new' | 'top' | 'comments';
}

export interface RedditSearchOutput {
  data: {
    search_results: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useRedditSearch(
  params?: RedditSearchInput,
  options?: UseQueryOptions<RedditSearchOutput, Error>
) {
  return useQuery({
    queryKey: ['reddit-search', params?.search_query, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, RedditSearchInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_SEARCH_ACROSS_SUBREDDITS',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditSearchOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.search_query,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Edit Comment or Post ---

export interface RedditEditCommentOrPostInput {
  thing_id: string;
  text: string;
}

export interface RedditEditCommentOrPostOutput {
  data: {
    edit_response: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useRedditEditCommentOrPost(
  options?: UseMutationOptions<RedditEditCommentOrPostOutput, Error, RedditEditCommentOrPostInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: RedditEditCommentOrPostInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, RedditEditCommentOrPostInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_EDIT_REDDIT_COMMENT_OR_POST',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditEditCommentOrPostOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reddit-posts'] });
      queryClient.invalidateQueries({ queryKey: ['reddit-comments'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Get User Flair ---

export interface RedditGetUserFlairInput {
  subreddit: string;
}

export interface RedditGetUserFlairOutput {
  data: {
    flair_list: Array<unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useRedditGetUserFlair(
  params?: RedditGetUserFlairInput,
  options?: UseQueryOptions<RedditGetUserFlairOutput, Error>
) {
  return useQuery({
    queryKey: ['reddit-flair', params?.subreddit, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, RedditGetUserFlairInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_GET_USER_FLAIR',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditGetUserFlairOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.subreddit,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Retrieve Post Comments ---

export interface RedditRetrievePostCommentsInput {
  article: string;
}

export interface RedditCommentData {
  id: string;
  author: string;
  body: string;
  parent_id: string;
  replies?: Array<Record<string, unknown>>;
}

export interface RedditRetrievePostCommentsOutput {
  data: {
    comments: RedditCommentData[];
  };
  error?: string;
  successful: boolean;
}

export function useRedditRetrievePostComments(
  params?: RedditRetrievePostCommentsInput,
  options?: UseQueryOptions<RedditRetrievePostCommentsOutput, Error>
) {
  return useQuery({
    queryKey: ['reddit-post-comments', params?.article, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, RedditRetrievePostCommentsInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_RETRIEVE_POST_COMMENTS',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditRetrievePostCommentsOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.article,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- Reddit: Retrieve Specific Comment ---

export interface RedditRetrieveSpecificCommentInput {
  id: string;
}

export interface RedditThingData {
  id: string;
  name: string;
  kind: string;
  data: Record<string, unknown>;
}

export interface RedditRetrieveSpecificCommentOutput {
  data: {
    things: RedditThingData[];
  };
  error?: string;
  successful: boolean;
}

export function useRedditRetrieveSpecificComment(
  params?: RedditRetrieveSpecificCommentInput,
  options?: UseQueryOptions<RedditRetrieveSpecificCommentOutput, Error>
) {
  return useQuery({
    queryKey: ['reddit-specific-comment', params?.id, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, RedditRetrieveSpecificCommentInput>(
        '6878f9b97df7dc701c215ca3',
        'REDDIT_RETRIEVE_SPECIFIC_COMMENT',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: RedditRetrieveSpecificCommentOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// ============================================================================
// YOUTUBE MCP TOOLS (MCP ID: 68770d542dee48ccb69d7bcd)
// ============================================================================

// --- YouTube: Upload Video ---

export interface YouTubeUploadVideoInput {
  title: string;
  description: string;
  tags: unknown[];
  categoryId: string;
  privacyStatus: string;
  videoFilePath: string;
}

export interface YouTubeUploadVideoOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeUploadVideo(
  options?: UseMutationOptions<YouTubeUploadVideoOutput, Error, YouTubeUploadVideoInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: YouTubeUploadVideoInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeUploadVideoInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_UPLOAD_VIDEO',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeUploadVideoOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Update Video ---

export interface YouTubeUpdateVideoInput {
  videoId: string;
  title?: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: string;
}

export interface YouTubeUpdateVideoOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeUpdateVideo(
  options?: UseMutationOptions<YouTubeUpdateVideoOutput, Error, YouTubeUpdateVideoInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: YouTubeUpdateVideoInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeUpdateVideoInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_UPDATE_VIDEO',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeUpdateVideoOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: List Channel Videos ---

export interface YouTubeListChannelVideosInput {
  channelId: string;
  maxResults?: number;
  pageToken?: string;
  part?: string;
}

export interface YouTubeListChannelVideosOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeListChannelVideos(
  params?: YouTubeListChannelVideosInput,
  options?: UseQueryOptions<YouTubeListChannelVideosOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-channel-videos', params?.channelId, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeListChannelVideosInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_LIST_CHANNEL_VIDEOS',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeListChannelVideosOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.channelId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Video Details ---

export interface YouTubeVideoDetailsInput {
  id: string;
  part?: string;
}

export interface YouTubeVideoDetailsOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeVideoDetails(
  params?: YouTubeVideoDetailsInput,
  options?: UseQueryOptions<YouTubeVideoDetailsOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-video-details', params?.id, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeVideoDetailsInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_VIDEO_DETAILS',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeVideoDetailsOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Subscribe Channel ---

export interface YouTubeSubscribeChannelInput {
  channelId: string;
}

export interface YouTubeSubscribeChannelOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeSubscribeChannel(
  options?: UseMutationOptions<YouTubeSubscribeChannelOutput, Error, YouTubeSubscribeChannelInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: YouTubeSubscribeChannelInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeSubscribeChannelInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_SUBSCRIBE_CHANNEL',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeSubscribeChannelOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-subscriptions'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Search ---

export interface YouTubeSearchInput {
  q: string;
  maxResults?: number;
  pageToken?: string;
  part?: string;
  type?: string;
}

export interface YouTubeSearchOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeSearch(
  params?: YouTubeSearchInput,
  options?: UseQueryOptions<YouTubeSearchOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-search', params?.q, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeSearchInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_SEARCH_YOU_TUBE',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeSearchOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.q,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Update Thumbnail ---

export interface YouTubeUpdateThumbnailInput {
  videoId: string;
  thumbnailUrl: string;
}

export interface YouTubeUpdateThumbnailOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeUpdateThumbnail(
  options?: UseMutationOptions<YouTubeUpdateThumbnailOutput, Error, YouTubeUpdateThumbnailInput>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: YouTubeUpdateThumbnailInput) => {
      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeUpdateThumbnailInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_UPDATE_THUMBNAIL',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeUpdateThumbnailOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['youtube-videos'] });
      queryClient.invalidateQueries({ queryKey: ['youtube-video-details'] });
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Get Channel Activities ---

export interface YouTubeGetChannelActivitiesInput {
  channelId: string;
  maxResults?: number;
  pageToken?: string;
  part?: string;
  publishedAfter?: string;
  publishedBefore?: string;
}

export interface YouTubeGetChannelActivitiesOutput {
  data: {
    activities: Array<Record<string, unknown>>;
    totalResults: number;
    nextPageToken?: string;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeGetChannelActivities(
  params?: YouTubeGetChannelActivitiesInput,
  options?: UseQueryOptions<YouTubeGetChannelActivitiesOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-channel-activities', params?.channelId, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeGetChannelActivitiesInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_GET_CHANNEL_ACTIVITIES',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeGetChannelActivitiesOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.channelId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Get Channel ID by Handle ---

export interface YouTubeGetChannelIdByHandleInput {
  channel_handle: string;
}

export interface YouTubeGetChannelIdByHandleOutput {
  data: {
    items: Array<unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeGetChannelIdByHandle(
  params?: YouTubeGetChannelIdByHandleInput,
  options?: UseQueryOptions<YouTubeGetChannelIdByHandleOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-channel-id', params?.channel_handle, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeGetChannelIdByHandleInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_GET_CHANNEL_ID_BY_HANDLE',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeGetChannelIdByHandleOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.channel_handle,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Get Channel Statistics ---

export interface YouTubeGetChannelStatisticsInput {
  id: string;
  part?: string;
}

export interface YouTubeGetChannelStatisticsOutput {
  data: {
    channels: Array<Record<string, unknown>>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeGetChannelStatistics(
  params?: YouTubeGetChannelStatisticsInput,
  options?: UseQueryOptions<YouTubeGetChannelStatisticsOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-channel-statistics', params?.id, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeGetChannelStatisticsInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_GET_CHANNEL_STATISTICS',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeGetChannelStatisticsOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: List Caption Track ---

export interface YouTubeListCaptionTrackInput {
  videoId: string;
  part?: string;
}

export interface YouTubeListCaptionTrackOutput {
  data: {
    etag: string;
    items: Array<Record<string, unknown>>;
    kind?: string;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeListCaptionTrack(
  params?: YouTubeListCaptionTrackInput,
  options?: UseQueryOptions<YouTubeListCaptionTrackOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-captions', params?.videoId, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeListCaptionTrackInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_LIST_CAPTION_TRACK',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeListCaptionTrackOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.videoId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: List User Playlists ---

export interface YouTubeListUserPlaylistsInput {
  maxResults?: number;
  pageToken?: string;
  part?: string;
}

export interface YouTubeListUserPlaylistsOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeListUserPlaylists(
  params?: YouTubeListUserPlaylistsInput,
  options?: UseQueryOptions<YouTubeListUserPlaylistsOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-user-playlists', params],
    queryFn: async () => {
      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeListUserPlaylistsInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_LIST_USER_PLAYLISTS',
        params || {}
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeListUserPlaylistsOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: List User Subscriptions ---

export interface YouTubeListUserSubscriptionsInput {
  maxResults?: number;
  pageToken?: string;
  part?: string;
}

export interface YouTubeListUserSubscriptionsOutput {
  data: {
    response_data: Record<string, unknown>;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeListUserSubscriptions(
  params?: YouTubeListUserSubscriptionsInput,
  options?: UseQueryOptions<YouTubeListUserSubscriptionsOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-user-subscriptions', params],
    queryFn: async () => {
      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeListUserSubscriptionsInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_LIST_USER_SUBSCRIPTIONS',
        params || {}
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeListUserSubscriptionsOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}

// --- YouTube: Load Captions ---

export interface YouTubeLoadCaptionsInput {
  id: string;
  tfmt?: string;
}

export interface YouTubeLoadCaptionsOutput {
  data: {
    captions_text: string;
  };
  error?: string;
  successful: boolean;
}

export function useYouTubeLoadCaptions(
  params?: YouTubeLoadCaptionsInput,
  options?: UseQueryOptions<YouTubeLoadCaptionsOutput, Error>
) {
  return useQuery({
    queryKey: ['youtube-load-captions', params?.id, params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameters are required for this MCP tool call');
      }

      const mcpResponse = await callMCPTool<MCPToolResponse, YouTubeLoadCaptionsInput>(
        '68770d542dee48ccb69d7bcd',
        'YOUTUBE_LOAD_CAPTIONS',
        params
      );

      if (!mcpResponse.content?.[0]?.text) {
        throw new Error('Invalid MCP response format: missing content[0].text');
      }

      try {
        const toolData: YouTubeLoadCaptionsOutput = JSON.parse(mcpResponse.content[0].text);
        return toolData;
      } catch (parseError) {
        throw new Error(`Failed to parse MCP response JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    },
    enabled: !!params?.id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
}
