import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { format, addDays, startOfWeek, isSameDay, formatDistanceToNow, startOfMonth, endOfMonth, getDaysInMonth, subDays, addMonths, subMonths, startOfDay, endOfDay, isSameMonth, eachDayOfInterval } from "date-fns";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Inbox,
  BarChart3,
  Users,
  Megaphone,
  Image,
  Settings,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  FileEdit,
  Facebook,
  Instagram,
  Linkedin,
  Music,
  Pin,
  MessageSquare,
  Heart,
  Eye,
  MousePointer,
  TrendingUp,
  Bell,
  MoreHorizontal,
  Reply,
  Archive,
  Hash,
  Link2,
  AtSign,
  Bot,
  Zap,
  Play,
  Pause,
  Square,
  RefreshCw,
  Lock,
  Unlock,
  ClipboardList,
  Target,
  DollarSign,
  Briefcase,
  Shield,
  AlertOctagon,
  History,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  CalendarClock,
  Building2,
  Palette,
  BookOpen,
  BellRing,
  ChevronDown,
  Wand2,
  ImagePlus,
  ExternalLink,
  CircleDot,
  Trash2,
  Upload,
  Repeat,
  Rss,
  Download,
  Clock3,
  Globe,
  RotateCcw,
  Layers,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { getApiBaseUrl } from "@/sdk/core/request";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { PostsVerticalSlice } from "@/components/PostsVerticalSlice";
import { AppShell } from "@/components/AppShell";
import { AppLogo } from "@/components/AppLogo";
import { APP_NAME } from "@/config/brand";
import { useQueryClient } from "@tanstack/react-query";
import { usePosts, useCampaigns, useSocialAccounts, useCreateSocialAccount, useDeleteSocialAccount, useAssets, useCreateAsset, useUploadAssets, useUpdateAsset, useDeleteAsset, useCreatePost, useBulkCreatePosts, useHashtagRecommendations, useBestTimeToPost, useRSSFeeds, useCreateRSSFeed, useDeleteRSSFeed, useImportRSSFeed, useRSSFeedItems, useTimezoneOptimization, useRecyclePost, useRecycledPosts, useAutopilotSettings, useUpdateAutopilotSettings, useEvents, useCreateEvent, useGenerateEventDrafts, useAutopilotBrief, useUpdateAutopilotBrief, useGenerateStrategyPlan, useAutopilotGenerate, useBrands, useCurrentBrand, useCreateBrand, useUpdateBrand, useDeleteBrand, useUploadBrandAvatar, useDeleteBrandAvatar, useSetCurrentBrand, useCalendar, useScheduleTemplates, useCreateScheduleTemplate, useUpdateScheduleTemplate, useDeleteScheduleTemplate, useGoogleIntegrations, useDeleteGoogleIntegration, useEmailAccounts, useDeleteEmailAccount, useEmailThreads, useEmailMessage, useSetEmailTriage } from "@/hooks/use-api";
import { UploadDropzone, type UploadedItem } from "@/components/uploads/UploadDropzone";
import type { HashtagRecommendation, AutopilotGenerateResponse, AutopilotDraftPost } from "@/types/app";
import { LoadingSkeleton, LoadingList } from "@/components/ui/loading-skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import { EmptyState } from "@/components/ui/empty-state";
import { Inbox as InboxIcon } from "lucide-react";
import {
  type Platform,
  type PostStatus,
  type OperatingMode,
  type ScheduledSlot,
  type AutopilotNotification,
  PLATFORMS,
  POST_STATUSES,
  PLATFORM_LIMITS,
  OPERATING_MODES,
  APPROVAL_WINDOWS,
  POSTING_GOALS,
  type Post,
  type CalendarView,
  type Asset,
  type AssetType,
  type Campaign,
  type SocialAccount,
  type RecurrencePattern,
  type RecurrenceSchedule,
  type AutopilotBrief,
  type StrategyPlan,
  type SubjectType,
  type PrimaryGoal,
  type PlatformConfig,
  type VoiceConfig,
  type BrandAssets,
  type Constraints,
  type Brand,
} from "@/types/app";
import { SOCIAL_PLATFORMS } from "@/config/social-platforms";
import { toast } from "sonner";
import { 
  validateMediaCount, 
  validateCaptionLength, 
  validateMediaTypes,
  getPlatformConstraint,
  type PlatformConstraint 
} from "@/config/platform-constraints";

export const Route = createFileRoute("/app/")({
  component: App,
});

// Platform icon component
function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  switch (platform) {
    case "facebook":
      return <Facebook className={className} />;
    case "instagram":
      return <Instagram className={className} />;
    case "linkedin":
      return <Linkedin className={className} />;
    case "tiktok":
      return <Music className={className} />;
    case "pinterest":
      return <Pin className={className} />;
    case "reddit":
      return <CircleDot className={className} />;
    case "slack":
      return <MessageSquare className={className} />;
    case "notion":
      return <BookOpen className={className} />;
    default:
      return null;
  }
}

// Status badge component
function StatusBadge({ status }: { status: PostStatus }) {
  const statusConfig = POST_STATUSES.find((s) => s.id === status);
  const getStatusIcon = () => {
    switch (status) {
      case "draft":
        return <FileEdit className="h-3 w-3" />;
      case "needs_approval":
        return <AlertCircle className="h-3 w-3" />;
      case "approved":
        return <CheckCircle2 className="h-3 w-3" />;
      case "scheduled":
        return <Clock className="h-3 w-3" />;
      case "published":
        return <Send className="h-3 w-3" />;
      case "failed":
        return <XCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant="outline" className={cn("gap-1", statusConfig?.color, "text-white border-0")}>
      {getStatusIcon()}
      {statusConfig?.label}
    </Badge>
  );
}

// Sidebar Navigation
function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, conversations, autopilotNotifications, autopilotSettings } = useAppStore();
  const unreadCount = conversations.filter((c) => c.status === "unread").length;
  const pendingApprovals = autopilotNotifications.filter((n) => n.type === "pending_approval" && !n.isActioned).length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "autopilot", label: "Autopilot", icon: Bot, badge: pendingApprovals, highlight: autopilotSettings.operatingMode !== "manual" },
    { id: "queue", label: "Queue", icon: ClipboardList },
    { id: "compose", label: "Compose", icon: PenSquare },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "notifications", label: "Notifications", icon: BellRing, badge: pendingApprovals },
    { id: "inbox", label: "Inbox", icon: Inbox, badge: unreadCount },
    { id: "email", label: "Email", icon: Inbox },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "brand", label: "Brand Profile", icon: Building2 },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "assets", label: "Assets", icon: Image },
    { id: "audit", label: "Audit Log", icon: History },
            { id: "settings", label: "Settings", icon: Settings },
            { id: "vertical-slice", label: "Vertical Slice (Test)", icon: Zap },
  ];

  return (
    <div className={cn(
      "flex flex-col h-full bg-zinc-900 text-white transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-zinc-800 flex items-center justify-center">
        {sidebarCollapsed ? (
          <AppLogo variant="mark" theme="light" size={28} />
        ) : (
          <AppLogo variant="lockup" theme="light" size={28} />
        )}
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {navItems.map((item) => (
            <TooltipProvider key={item.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      activeView === item.id
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right">
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && ` (${item.badge})`}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

// Supabase profile row (matches public.profiles)
type ProfileRow = { id: string; display_name: string | null };

// Dashboard View
function DashboardView() {
  // Profile from Supabase (session + public.profiles)
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);

  React.useEffect(() => {
    const client = supabase.client;
    if (!client) {
      setProfileLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: { session } } = await client.auth.getSession();
      if (cancelled || !session?.user?.id) {
        setProfileLoading(false);
        return;
      }
      const { data: row } = await client
        .from("profiles")
        .select("id, display_name")
        .eq("id", session.user.id)
        .single();
      if (!cancelled) {
        setProfile(row ?? null);
        setProfileLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // API Hooks
  const { data: postsData, isLoading: postsLoading, isError: postsIsError, error: postsError, refetch: refetchPosts } = usePosts();
  const { data: campaignsData, isLoading: campaignsLoading, isError: campaignsIsError, error: campaignsError } = useCampaigns();
  const { data: accountsData, isLoading: accountsLoading, isError: accountsIsError, error: accountsError } = useSocialAccounts();
  
  // Get data from store for autopilot (still using mock for now)
  const { conversations, autopilotSettings, scheduledSlots, autopilotNotifications } = useAppStore();

  // Extract data from API responses
  const posts = postsData?.posts || [];
  const campaigns = campaignsData?.campaigns || [];
  const socialAccounts = accountsData?.accounts || [];

  // Loading states - include profile fetch so we don't flash mock data
  const isLoading = profileLoading || postsLoading || campaignsLoading || accountsLoading;
  const hasError = postsIsError || campaignsIsError || accountsIsError || postsError || campaignsError || accountsError;

  // Metrics from API (no fake numbers)
  const metrics = {
    totalPosts: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    drafts: posts.filter((p) => p.status === "draft").length,
    totalImpressions: posts.reduce((sum, p) => sum + (p.metrics?.impressions || 0), 0),
    totalEngagement: posts.reduce((sum, p) => sum + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0), 0),
    unreadMessages: conversations.filter((c) => c.status === "unread").length,
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
  };

  // Zero-initialized stats for empty-state CTA (derived from real data)
  const stats = {
    totalFollowers: socialAccounts.reduce((sum, a) => sum + (a.followerCount ?? 0), 0),
    engagement: metrics.totalEngagement,
    posts: metrics.totalPosts,
  };
  const showEmptyStateCTA = stats.totalFollowers === 0 && stats.engagement === 0 && stats.posts === 0;

  const pendingApprovals = scheduledSlots.filter((s) => s.status === "pending_approval").length;
  const nextPost = scheduledSlots
    .filter((s) => s.status === "approved" || s.status === "pending_approval")
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())[0];

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <LoadingSkeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <LoadingSkeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingList count={3} />
      </div>
    );
  }

  // Show error state
  if (hasError) {
    return (
      <div className="p-6">
        <ErrorDisplay
          error={postsError || campaignsError || accountsError}
          onRetry={() => {
            if (postsError) refetchPosts();
            // Add refetch for campaigns and accounts if needed
          }}
          title="Failed to load dashboard data"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Hello, {profile?.display_name?.trim() ? profile.display_name : "Steward"}
          </p>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your social media performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => useAppStore.getState().setActiveView("autopilot")}>
            <Bot className="h-4 w-4 mr-2" />
            Autopilot
          </Button>
          <Button onClick={() => useAppStore.getState().setActiveView("compose")}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Empty state CTA when no activity */}
      {showEmptyStateCTA && (
        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium">Ready to grow? Connect your first social account.</p>
            <Button onClick={() => useAppStore.getState().setActiveView("accounts")}>
              Connect Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Autopilot Status Card */}
      {autopilotSettings.operatingMode !== "manual" && (
        <Card className={cn(
          "border-2",
          autopilotSettings.isPaused ? "border-yellow-500/50" : "border-green-500/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-full",
                  autopilotSettings.isPaused ? "bg-yellow-500/10" : "bg-green-500/10"
                )}>
                  <Bot className={cn(
                    "h-6 w-6",
                    autopilotSettings.isPaused ? "text-yellow-500" : "text-green-500"
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {autopilotSettings.operatingMode === "autopilot" ? "Autopilot Mode" : "Approval Mode"}
                    {autopilotSettings.isPaused && (
                      <Badge variant="outline" className="text-yellow-600">Paused</Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {pendingApprovals} posts pending approval • {scheduledSlots.length} in queue
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {nextPost && (
                  <div className="text-right">
                    <p className="text-sm font-medium">Next post</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(nextPost.scheduledTime, { addSuffix: true })}
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => useAppStore.getState().setActiveView("autopilot")}
                >
                  Manage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Approvals Alert */}
      {pendingApprovals > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{pendingApprovals} posts need your approval</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Review and approve posts before they're published.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => useAppStore.getState().setActiveView("notifications")}
            >
              Review Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEngagement.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.scheduled}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.drafts} drafts pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.activeCampaigns} active campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your social media accounts and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {socialAccounts.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No connected accounts"
              description={`Connect your social media accounts to start posting with ${APP_NAME}`}
              actionLabel="Connect Account"
              onAction={() => useAppStore.getState().setActiveView("accounts")}
            />
          ) : (
            <div className="space-y-4">
              {socialAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    account.platform === "facebook" && "bg-blue-600/10",
                    account.platform === "instagram" && "bg-pink-500/10",
                    account.platform === "linkedin" && "bg-blue-700/10",
                    account.platform === "tiktok" && "bg-gray-900/10",
                    account.platform === "pinterest" && "bg-red-600/10",
                    account.platform === "reddit" && "bg-orange-500/10",
                    account.platform === "slack" && "bg-purple-600/10",
                    account.platform === "notion" && "bg-gray-900/10"
                  )}>
                    <PlatformIcon platform={account.platform} className={cn(
                      "h-5 w-5",
                      account.platform === "facebook" && "text-blue-600",
                      account.platform === "instagram" && "text-pink-500",
                      account.platform === "linkedin" && "text-blue-700",
                      account.platform === "tiktok" && "text-gray-900",
                      account.platform === "pinterest" && "text-red-600",
                      account.platform === "reddit" && "text-orange-500",
                      account.platform === "slack" && "text-purple-600",
                      account.platform === "notion" && "text-gray-900"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium">{account.displayName}</p>
                    <p className="text-sm text-muted-foreground">{account.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{account.followerCount?.toLocaleString()} followers</p>
                  <p className="text-xs text-muted-foreground">
                    Last sync: {account.lastSync ? format(account.lastSync, "MMM d, h:mm a") : "Never"}
                  </p>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest social media posts</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <EmptyState
              icon={PenSquare}
              title="No posts yet"
              description="Create your first post to get started"
              actionLabel="Create Post"
              onAction={() => useAppStore.getState().setActiveView("compose")}
            />
          ) : (
            <div className="space-y-4">
              {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="flex items-start gap-4 p-3 rounded-lg border">
                <PlatformIcon platform={post.platform} className="h-5 w-5 mt-1 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={post.status} />
                    <span className="text-xs text-muted-foreground">
                      {format(post.createdAt, "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                {post.metrics && (
                  <div className="text-right text-sm">
                    <p className="font-medium">{post.metrics.impressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">impressions</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Post Composer View
function ComposeView() {
  const { activeBrandId, setActiveView } = useAppStore();
  const { data: brandsData } = useBrands();
  const { data: currentBrand } = useCurrentBrand();
  
  const isAllMode = activeBrandId === 'all';
  const brands = brandsData?.brands || [];
  const currentBrandData = isAllMode 
    ? { id: 'all', name: 'All Brands' }
    : (currentBrand || brands.find(b => b.id === activeBrandId) || null);

  // Block composing in "All Brands" mode
  if (isAllMode) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Brand Selection Required</AlertTitle>
          <AlertDescription>
            Please select a specific brand to compose posts. Each post must be associated with a brand.
            <Button
              variant="link"
              className="px-2"
              onClick={() => {
                if (brands.length > 0) {
                  useAppStore.getState().setActiveBrandId(brands[0].id);
                } else {
                  useAppStore.getState().setActiveView('settings');
                }
              }}
            >
              Select a brand
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // API Hooks
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns();
  const { data: accountsData, isLoading: accountsLoading } = useSocialAccounts();
  const { data: postsData } = usePosts();
  const createPost = useCreatePost();
  
  const posts = postsData?.posts || [];

  const [content, setContent] = React.useState("");
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>(["facebook"]);
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform>("facebook"); // Keep for backward compatibility
  const [selectedCampaign, setSelectedCampaign] = React.useState<string>("");
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [scheduleTime, setScheduleTime] = React.useState("");
  const [isScheduled, setIsScheduled] = React.useState(false);
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [recurrencePattern, setRecurrencePattern] = React.useState<RecurrencePattern>("daily");
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState("");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = React.useState<number[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = React.useState(1);
  const [hashtagDialogOpen, setHashtagDialogOpen] = React.useState(false);
  const [selectedHashtags, setSelectedHashtags] = React.useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = React.useState<File[]>([]);
  const [mediaDialogOpen, setMediaDialogOpen] = React.useState(false);
  const [mediaUploadedItems, setMediaUploadedItems] = React.useState<UploadedItem[]>([]);

  // Extract data
  const campaigns = campaignsData?.campaigns || [];
  const socialAccounts = accountsData?.accounts || [];

  // Hashtag recommendations
  const { data: hashtagData, isLoading: hashtagsLoading } = useHashtagRecommendations(
    content,
    selectedPlatform,
    { enabled: content.length > 10 && hashtagDialogOpen } as any
  );

  const platformLimit = PLATFORM_LIMITS[selectedPlatform];
  const platformConstraint = getPlatformConstraint(selectedPlatform);
  const charCount = content.length;
  const isOverLimit = charCount > platformLimit.maxChars;
  const isSubmitting = createPost.isPending;
  const mediaCount = mediaFiles.length;
  
  // Validation results (computed for render)
  const captionValidation = validateCaptionLength(selectedPlatform, content.length);
  const mediaValidation = validateMediaCount(selectedPlatform, mediaCount);
  const canPublish = content.trim().length > 0 && !captionValidation.error && !mediaValidation.error && !isSubmitting;

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    if (isOverLimit) {
      toast.error(`Content exceeds ${platformLimit.maxChars} character limit`);
      return;
    }

    try {
      const postData = {
        content,
        platform: selectedPlatform,
        status: (isScheduled ? "scheduled" : "draft") as PostStatus,
        scheduledTime: isScheduled && scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}`)
          : undefined,
        publishedTime: !isScheduled ? new Date() : undefined,
        authorId: "user1",
        campaignId: selectedCampaign || undefined,
      };

      await createPost.mutateAsync(postData);
      toast.success(isScheduled ? "Post scheduled!" : "Post created!");
      setContent("");
      setSelectedCampaign("");
      setScheduleDate("");
      setScheduleTime("");
      setIsScheduled(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    try {
      const postData = {
        content,
        platform: selectedPlatform,
        status: "draft" as PostStatus,
        authorId: "user1",
        campaignId: selectedCampaign || undefined,
      };

      await createPost.mutateAsync(postData);
      toast.success("Draft saved!");
      setContent("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save draft");
    }
  };

  const [composeMode, setComposeMode] = React.useState<'single' | 'bulk'>('single');

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compose Post</h1>
          <p className="text-muted-foreground">Create and schedule content for your social media accounts</p>
        </div>
        {/* Active Brand Display */}
        {currentBrandData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/50">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {currentBrandData && 'avatarUrl' in currentBrandData && currentBrandData.avatarUrl ? (
                  <img src={currentBrandData.avatarUrl} alt={currentBrandData.name} className="h-full w-full object-cover" />
                ) : (
                  currentBrandData?.name?.charAt(0).toUpperCase() || '?'
                )}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{currentBrandData?.name || 'Unknown'}</span>
          </div>
        )}
      </div>

      <Tabs value={composeMode} onValueChange={(v) => setComposeMode(v as 'single' | 'bulk')}>
        <TabsList>
          <TabsTrigger value="single">Single Post</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-4">
          <ComposeSinglePostContent
            content={content}
            setContent={setContent}
            selectedPlatform={selectedPlatform}
            setSelectedPlatform={setSelectedPlatform}
            selectedCampaign={selectedCampaign}
            setSelectedCampaign={setSelectedCampaign}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
            scheduleTime={scheduleTime}
            setScheduleTime={setScheduleTime}
            isScheduled={isScheduled}
            setIsScheduled={setIsScheduled}
            isRecurring={isRecurring}
            setIsRecurring={setIsRecurring}
            recurrencePattern={recurrencePattern}
            setRecurrencePattern={setRecurrencePattern}
            recurrenceInterval={recurrenceInterval}
            setRecurrenceInterval={setRecurrenceInterval}
            recurrenceEndDate={recurrenceEndDate}
            setRecurrenceEndDate={setRecurrenceEndDate}
            recurrenceDaysOfWeek={recurrenceDaysOfWeek}
            setRecurrenceDaysOfWeek={setRecurrenceDaysOfWeek}
            recurrenceDayOfMonth={recurrenceDayOfMonth}
            setRecurrenceDayOfMonth={setRecurrenceDayOfMonth}
            campaigns={campaigns}
            socialAccounts={socialAccounts}
            createPost={createPost}
            posts={posts}
            hashtagDialogOpen={hashtagDialogOpen}
            setHashtagDialogOpen={setHashtagDialogOpen}
            selectedHashtags={selectedHashtags}
            setSelectedHashtags={setSelectedHashtags}
            hashtagData={hashtagData}
            hashtagsLoading={hashtagsLoading}
            mediaFiles={mediaFiles}
            setMediaFiles={setMediaFiles}
            mediaDialogOpen={mediaDialogOpen}
            setMediaDialogOpen={setMediaDialogOpen}
            mediaUploadedItems={mediaUploadedItems}
            setMediaUploadedItems={setMediaUploadedItems}
          />
        </TabsContent>
        <TabsContent value="bulk" className="mt-4">
          <ComposeBulkUploadContent campaigns={campaigns} socialAccounts={socialAccounts} />
        </TabsContent>
      </Tabs>

      {/* Hashtag Recommendations Dialog */}
      <Dialog open={hashtagDialogOpen} onOpenChange={setHashtagDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Hashtag Recommendations</DialogTitle>
            <DialogDescription>
              Select hashtags to add to your post
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {hashtagsLoading ? (
              <LoadingSkeleton />
            ) : hashtagData?.recommendations ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                  {hashtagData.recommendations.map((rec) => (
                    <Button
                      key={rec.hashtag}
                      variant={selectedHashtags.includes(rec.hashtag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedHashtags.includes(rec.hashtag)) {
                          setSelectedHashtags(selectedHashtags.filter(h => h !== rec.hashtag));
                        } else {
                          setSelectedHashtags([...selectedHashtags, rec.hashtag]);
                        }
                      }}
                    >
                      {rec.hashtag}
                      {rec.relevance > 0.8 && <span className="ml-1 text-xs">⭐</span>}
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {hashtagData.recommendations.length} recommendations
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Enter some content to get hashtag recommendations</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHashtagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const hashtagsText = selectedHashtags.join(" ");
                setContent(content + (content ? " " : "") + hashtagsText);
                setSelectedHashtags([]);
                setHashtagDialogOpen(false);
              }}
            >
              Add Selected Hashtags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Upload Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
            <DialogDescription>
              Upload images or videos for your post. Max {platformConstraint.maxMediaCount} file(s) for {selectedPlatform}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <UploadDropzone
              multiple={platformConstraint.maxMediaCount > 1}
              accept={platformConstraint.supportedMediaTypes.includes('video') ? 'image/*,video/*' : 'image/*'}
              maxFiles={platformConstraint.maxMediaCount}
              maxSizeMB={50}
              value={mediaUploadedItems}
              onFilesSelected={async (files) => {
                const newItems: UploadedItem[] = [];
                for (const file of files) {
                  const preview = file.type.startsWith('image/') 
                    ? await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                      })
                    : undefined;
                  
                  newItems.push({
                    file,
                    preview,
                    status: 'success',
                  });
                }
                setMediaUploadedItems((prev) => [...prev, ...newItems]);
                setMediaFiles((prev) => [...prev, ...files]);
              }}
              onFileRemove={(index) => {
                setMediaUploadedItems((prev) => prev.filter((_, i) => i !== index));
                setMediaFiles((prev) => prev.filter((_, i) => i !== index));
              }}
              title="Upload media files"
              helperText="Drag and drop files or click to browse"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Single Post Content Component
function ComposeSinglePostContent({
  content,
  setContent,
  selectedPlatform,
  setSelectedPlatform,
  selectedCampaign,
  setSelectedCampaign,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  isScheduled,
  setIsScheduled,
  isRecurring,
  setIsRecurring,
  recurrencePattern,
  setRecurrencePattern,
  recurrenceInterval,
  setRecurrenceInterval,
  recurrenceEndDate,
  setRecurrenceEndDate,
  recurrenceDaysOfWeek,
  setRecurrenceDaysOfWeek,
  recurrenceDayOfMonth,
  setRecurrenceDayOfMonth,
  campaigns,
  socialAccounts,
  createPost,
  posts,
  hashtagDialogOpen,
  setHashtagDialogOpen,
  selectedHashtags,
  setSelectedHashtags,
  hashtagData,
  hashtagsLoading,
  mediaFiles,
  setMediaFiles,
  mediaDialogOpen,
  setMediaDialogOpen,
  mediaUploadedItems,
  setMediaUploadedItems,
}: {
  content: string;
  setContent: (v: string) => void;
  selectedPlatform: Platform;
  setSelectedPlatform: (v: Platform) => void;
  selectedCampaign: string;
  setSelectedCampaign: (v: string) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleTime: string;
  setScheduleTime: (v: string) => void;
  isScheduled: boolean;
  setIsScheduled: (v: boolean) => void;
  isRecurring: boolean;
  setIsRecurring: (v: boolean) => void;
  recurrencePattern: RecurrencePattern;
  setRecurrencePattern: (v: RecurrencePattern) => void;
  recurrenceInterval: number;
  setRecurrenceInterval: (v: number) => void;
  recurrenceEndDate: string;
  setRecurrenceEndDate: (v: string) => void;
  recurrenceDaysOfWeek: number[];
  setRecurrenceDaysOfWeek: (v: number[]) => void;
  recurrenceDayOfMonth: number;
  setRecurrenceDayOfMonth: (v: number) => void;
  campaigns: Campaign[];
  socialAccounts: SocialAccount[];
  createPost: ReturnType<typeof useCreatePost>;
  posts: Post[];
  hashtagDialogOpen: boolean;
  setHashtagDialogOpen: (open: boolean) => void;
  selectedHashtags: string[];
  setSelectedHashtags: (hashtags: string[]) => void;
  hashtagData?: { recommendations: HashtagRecommendation[]; total: number };
  hashtagsLoading: boolean;
  mediaFiles: File[];
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  mediaDialogOpen: boolean;
  setMediaDialogOpen: (open: boolean) => void;
  mediaUploadedItems: UploadedItem[];
  setMediaUploadedItems: React.Dispatch<React.SetStateAction<UploadedItem[]>>;
}) {
  const platformLimit = PLATFORM_LIMITS[selectedPlatform];
  const platformConstraint = getPlatformConstraint(selectedPlatform);
  const charCount = content.length;
  const isOverLimit = charCount > platformLimit.maxChars;
  const isSubmitting = createPost.isPending;
  const mediaCount = mediaFiles.length;
  
  // Validation results (computed for render)
  const captionValidation = validateCaptionLength(selectedPlatform, content.length);
  const mediaValidation = validateMediaCount(selectedPlatform, mediaCount);
  const canPublish = content.trim().length > 0 && !captionValidation.error && !mediaValidation.error && !isSubmitting;

  // Handle media file selection
  const handleMediaFilesSelected = async (files: File[]) => {
    const maxMedia = platformConstraint.maxMediaCount;
    const currentCount = mediaFiles.length;
    
    if (currentCount + files.length > maxMedia) {
      toast.error(`Maximum ${maxMedia} media file(s) allowed for ${selectedPlatform}`);
      return;
    }

    // Create preview items
    const newItems: UploadedItem[] = [];
    for (const file of files) {
      const preview = file.type.startsWith('image/') 
        ? await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
        : undefined;
      
      newItems.push({
        file,
        preview,
        status: 'success',
      });
    }

    setMediaUploadedItems((prev) => [...prev, ...newItems]);
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const handleMediaFileRemove = (index: number) => {
    setMediaUploadedItems((prev) => prev.filter((_, i) => i !== index));
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    try {
      const postData = {
        content,
        platform: selectedPlatform,
        status: "draft" as PostStatus,
        authorId: "user1",
        campaignId: selectedCampaign || undefined,
      };

      await createPost.mutateAsync(postData);
      toast.success("Draft saved!");
      setContent("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save draft");
    }
  };

  // Recurring schedule helper
  const getRecurrenceSchedule = (): RecurrenceSchedule | undefined => {
    if (!isRecurring || !isScheduled || !scheduleDate || !scheduleTime) {
      return undefined;
    }

    const startDate = new Date(`${scheduleDate}T${scheduleTime}`);
    return {
      pattern: recurrencePattern,
      interval: recurrenceInterval,
      startDate,
      endDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
      daysOfWeek: recurrencePattern === 'weekly' ? recurrenceDaysOfWeek : undefined,
      dayOfMonth: recurrencePattern === 'monthly' ? recurrenceDayOfMonth : undefined,
    };
  };

  const handlePublishWithRecurrence = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    // Validate caption length (re-validate in handler)
    const captionValidationResult = validateCaptionLength(selectedPlatform, content.length);
    if (captionValidationResult.error) {
      toast.error(captionValidationResult.error);
      return;
    }
    if (captionValidationResult.warning) {
      // Show warning but allow publishing
      toast.warning(captionValidationResult.warning);
    }

    // Validate media count (re-validate in handler)
    const mediaValidationResult = validateMediaCount(selectedPlatform, mediaCount);
    if (mediaValidationResult.error) {
      toast.error(mediaValidationResult.error);
      return;
    }

    try {
      const recurrenceSchedule = getRecurrenceSchedule();
      const postData = {
        content,
        platform: selectedPlatform,
        status: (isScheduled ? "scheduled" : "draft") as PostStatus,
        scheduledTime: isScheduled && scheduleDate && scheduleTime
          ? new Date(`${scheduleDate}T${scheduleTime}`)
          : undefined,
        publishedTime: !isScheduled ? new Date() : undefined,
        authorId: "user1",
        campaignId: selectedCampaign || undefined,
        recurrenceSchedule,
      };

      await createPost.mutateAsync(postData);
      const successMessage = isRecurring && isScheduled 
        ? "Recurring post scheduled!" 
        : (isScheduled ? "Post scheduled!" : "Post created!");
      toast.success(successMessage);
      
      setContent("");
      setSelectedCampaign("");
      setScheduleDate("");
      setScheduleTime("");
      setIsScheduled(false);
      setIsRecurring(false);
      setRecurrencePattern("daily");
      setRecurrenceInterval(1);
      setRecurrenceEndDate("");
      setRecurrenceDaysOfWeek([]);
      setRecurrenceDayOfMonth(1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    }
  };

  // Filter to only social platforms (not slack/notion)
  const socialPlatforms = PLATFORMS.filter(p => 
    ['facebook', 'instagram', 'linkedin', 'tiktok', 'pinterest', 'reddit'].includes(p.id)
  );

  // Check if any accounts are connected
  const hasConnectedAccounts = socialAccounts.some(a => 
    a.isConnected || a.status === 'connected' || a.status === 'stub'
  );

  // Show empty state if no accounts
  if (!hasConnectedAccounts) {
    return (
      <Card>
        <CardContent className="p-12">
          <EmptyState
            icon={Users}
            title="No social accounts connected"
            description={`Connect a platform account to start posting with ${APP_NAME}. You can also create a stub account for testing.`}
            actionLabel="Go to Accounts"
            onAction={() => useAppStore.getState().setActiveView('accounts')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform Selection - Only social platforms */}
              <div className="flex flex-wrap gap-2">
                {socialPlatforms.map((platform) => {
                  const account = socialAccounts.find((a) => a.platform === platform.id);
                  const hasAccount = account && (account.isConnected || account.status === 'connected' || account.status === 'stub');
                  return (
                    <Button
                      key={platform.id}
                      variant={selectedPlatform === platform.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPlatform(platform.id)}
                      disabled={!hasAccount}
                      title={!hasAccount ? `No ${platform.label} account connected` : undefined}
                    >
                      <PlatformIcon platform={platform.id} className="h-4 w-4 mr-2" />
                      {platform.label}
                      {account?.status === 'stub' && (
                        <Badge variant="secondary" className="ml-1 text-xs">Stub</Badge>
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Content Textarea */}
              <div className="space-y-2">
                <Textarea
                  placeholder={`What's on your mind? (${platformLimit.maxChars} character limit)`}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setMediaDialogOpen(true)}
                      type="button"
                    >
                      <Image className="h-4 w-4 mr-1" />
                      Media {mediaCount > 0 && `(${mediaCount})`}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setHashtagDialogOpen(true)}
                    >
                      <Hash className="h-4 w-4 mr-1" />
                      Hashtags
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Link2 className="h-4 w-4 mr-1" />
                      Link
                    </Button>
                    <Button variant="ghost" size="sm">
                      <AtSign className="h-4 w-4 mr-1" />
                      Mention
                    </Button>
                  </div>
                  <span className={cn(
                    isOverLimit ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {charCount} / {platformLimit.maxChars}
                  </span>
                </div>
                {/* Platform Validation Messages */}
                {captionValidation.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{captionValidation.error}</AlertDescription>
                  </Alert>
                )}
                {captionValidation.warning && !captionValidation.error && (
                  <Alert className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{captionValidation.warning}</AlertDescription>
                  </Alert>
                )}
                {mediaValidation.error && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{mediaValidation.error}</AlertDescription>
                  </Alert>
                )}
                {/* Platform Constraints Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Platform:</strong> {selectedPlatform}</p>
                  <p><strong>Max media:</strong> {platformConstraint.maxMediaCount} • <strong>Supported:</strong> {platformConstraint.supportedMediaTypes.join(', ')}</p>
                  {platformConstraint.aspectRatioGuidance && (
                    <p><strong>Aspect ratio:</strong> {platformConstraint.aspectRatioGuidance.recommended.join(', ')}</p>
                  )}
                </div>
              </div>

              {/* Campaign Selection */}
              <div className="space-y-2">
                <Label>Campaign (Optional)</Label>
                <Select value={selectedCampaign || "none"} onValueChange={(v) => setSelectedCampaign(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No campaign</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scheduling */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="schedule"
                    checked={isScheduled}
                    onCheckedChange={(checked) => setIsScheduled(checked === true)}
                  />
                  <Label htmlFor="schedule">Schedule for later</Label>
                </div>

                {isScheduled && (
                  <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={format(new Date(), "yyyy-MM-dd")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>

                    {/* Recurring Schedule */}
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="recurring"
                          checked={isRecurring}
                          onCheckedChange={(checked) => setIsRecurring(checked === true)}
                        />
                        <Label htmlFor="recurring" className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          Make this a recurring post
                        </Label>
                      </div>

                      {isRecurring && (
                        <div className="space-y-4 pl-6 border-l-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Repeat</Label>
                              <Select value={recurrencePattern} onValueChange={(v) => setRecurrencePattern(v as RecurrencePattern)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Every</Label>
                              <Input
                                type="number"
                                min="1"
                                max="30"
                                value={recurrenceInterval}
                                onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>

                          {recurrencePattern === 'weekly' && (
                            <div className="space-y-2">
                              <Label>Days of week</Label>
                              <div className="flex flex-wrap gap-2">
                                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
                                  <Button
                                    key={day}
                                    type="button"
                                    variant={recurrenceDaysOfWeek.includes(index) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                      if (recurrenceDaysOfWeek.includes(index)) {
                                        setRecurrenceDaysOfWeek(recurrenceDaysOfWeek.filter(d => d !== index));
                                      } else {
                                        setRecurrenceDaysOfWeek([...recurrenceDaysOfWeek, index].sort());
                                      }
                                    }}
                                  >
                                    {day.slice(0, 3)}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {recurrencePattern === 'monthly' && (
                            <div className="space-y-2">
                              <Label>Day of month</Label>
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                value={recurrenceDayOfMonth}
                                onChange={(e) => setRecurrenceDayOfMonth(parseInt(e.target.value) || 1)}
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>End date (optional)</Label>
                            <Input
                              type="date"
                              value={recurrenceEndDate}
                              onChange={(e) => setRecurrenceEndDate(e.target.value)}
                              min={scheduleDate || format(new Date(), "yyyy-MM-dd")}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              Save Draft
            </Button>
              <Button
                onClick={handlePublishWithRecurrence}
                disabled={!canPublish || isSubmitting}
              >
              {isSubmitting 
                ? (isScheduled ? "Scheduling..." : "Publishing...") 
                : (isScheduled ? "Schedule Post" : "Publish Now")}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">Your Account</p>
                    <p className="text-xs text-muted-foreground">@yourhandle</p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">
                  {content || "Your post preview will appear here..."}
                </p>
                {/* Media Previews */}
                {mediaUploadedItems.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {mediaUploadedItems.map((item: UploadedItem, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                        {item.preview ? (
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Music className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleMediaFileRemove(idx)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 hover:bg-black/70 text-white"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {posts.filter((p) => p.status === "draft").slice(0, 3).map((post) => (
                  <div
                    key={post.id}
                    className="p-2 text-sm border rounded cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setContent(post.content);
                      setSelectedPlatform(post.platform);
                    }}
                  >
                    <p className="line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <PlatformIcon platform={post.platform} className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {format(post.createdAt, "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
                {posts.filter((p) => p.status === "draft").length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No drafts yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Media Upload Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
            <DialogDescription>
              Upload images or videos for your post. Max {platformConstraint.maxMediaCount} file(s) for {selectedPlatform}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <UploadDropzone
              multiple={platformConstraint.maxMediaCount > 1}
              accept={platformConstraint.supportedMediaTypes.includes('video') ? 'image/*,video/*' : 'image/*'}
              maxFiles={platformConstraint.maxMediaCount}
              maxSizeMB={50}
              value={mediaUploadedItems}
              onFilesSelected={handleMediaFilesSelected}
              onFileRemove={handleMediaFileRemove}
              title="Upload media files"
              helperText="Drag and drop files or click to browse"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Bulk Upload Content Component
function ComposeBulkUploadContent({
  campaigns,
  socialAccounts,
}: {
  campaigns: Campaign[];
  socialAccounts: SocialAccount[];
}) {
  const [csvText, setCsvText] = React.useState('');
  const [parsedPosts, setParsedPosts] = React.useState<Array<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>>>([]);
  const [uploadResults, setUploadResults] = React.useState<{ results: Array<{ success: boolean; post?: Post; error?: string; index: number }>; summary: { total: number; successful: number; failed: number } } | null>(null);
  const bulkCreatePosts = useBulkCreatePosts();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Array<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>> => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const posts: Array<Omit<Post, 'id' | 'createdAt' | 'updatedAt'>> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      if (!row.content || !row.platform) continue;

      const post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'> = {
        content: row.content,
        platform: row.platform as Platform,
        status: (row.scheduledtime ? 'scheduled' : 'draft') as PostStatus,
        scheduledTime: row.scheduledtime ? new Date(row.scheduledtime) : undefined,
        authorId: 'user1',
        campaignId: row.campaignid || undefined,
        mediaUrls: row.mediaurls ? row.mediaurls.split(',').map(u => u.trim()).filter(Boolean) : undefined,
        hashtags: row.hashtags ? row.hashtags.split(',').map(h => h.trim()).filter(Boolean) : undefined,
      };

      posts.push(post);
    }

    return posts;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
      const parsed = parseCSV(text);
      setParsedPosts(parsed);
      setUploadResults(null);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    if (text.trim()) {
      const parsed = parseCSV(text);
      setParsedPosts(parsed);
    } else {
      setParsedPosts([]);
    }
    setUploadResults(null);
  };

  const handleSubmit = async () => {
    if (parsedPosts.length === 0) {
      toast.error('No posts to upload. Please provide CSV data.');
      return;
    }

    try {
      const result = await bulkCreatePosts.mutateAsync(parsedPosts);
      setUploadResults(result);
      toast.success(`Successfully created ${result.summary.successful} posts${result.summary.failed > 0 ? `, ${result.summary.failed} failed` : ''}`);
      if (result.summary.successful > 0) {
        setCsvText('');
        setParsedPosts([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload posts');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload Posts</CardTitle>
          <CardDescription>
            Upload a CSV file or paste CSV data to create multiple posts at once.
            <br />
            <strong>CSV Format:</strong> content, platform, scheduledTime (optional), mediaUrls (optional, comma-separated), hashtags (optional, comma-separated), campaignId (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Upload CSV File</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-2"
            />
          </div>
          <div className="space-y-2">
            <Label>Or Paste CSV Data</Label>
            <Textarea
              placeholder="content, platform, scheduledTime&#10;Hello world, facebook, 2024-01-01T10:00:00Z&#10;Another post, instagram,"
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {parsedPosts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview ({parsedPosts.length} posts)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Hashtags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedPosts.map((post, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="max-w-md">
                        <p className="truncate">{post.content}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.platform}</Badge>
                      </TableCell>
                      <TableCell>
                        {post.scheduledTime ? format(new Date(post.scheduledTime), 'MMM d, yyyy h:mm a') : 'Draft'}
                      </TableCell>
                      <TableCell>
                        {post.hashtags && post.hashtags.length > 0 ? (
                          <div className="flex gap-1 flex-wrap">
                            {post.hashtags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                            {post.hashtags.length > 3 && <span className="text-xs text-muted-foreground">+{post.hashtags.length - 3}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {uploadResults && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{uploadResults.summary.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{uploadResults.summary.successful}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{uploadResults.summary.failed}</p>
                </div>
              </div>
              {uploadResults.results.filter(r => !r.success).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium">Errors:</p>
                  {uploadResults.results.filter(r => !r.success).map((result, idx) => (
                    <Alert key={idx} variant="destructive">
                      <AlertDescription>
                        Row {result.index + 2}: {result.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={parsedPosts.length === 0 || bulkCreatePosts.isPending}
        >
          {bulkCreatePosts.isPending ? 'Uploading...' : `Upload ${parsedPosts.length} Posts`}
        </Button>
      </div>
    </div>
  );
}

// Calendar View
function CalendarViewComponent() {
  const {
    calendarView,
    setCalendarView,
    selectedDate,
    setSelectedDate,
    platformFilter,
    setPlatformFilter,
  } = useAppStore();

  // Calculate date range based on view
  const getDateRange = () => {
    if (calendarView === 'day') {
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);
      return {
        from: format(dayStart, 'yyyy-MM-dd'),
        to: format(dayEnd, 'yyyy-MM-dd'),
      };
    } else if (calendarView === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return {
        from: format(weekStart, 'yyyy-MM-dd'),
        to: format(weekEnd, 'yyyy-MM-dd'),
      };
    } else {
      // month
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return {
        from: format(monthStart, 'yyyy-MM-dd'),
        to: format(monthEnd, 'yyyy-MM-dd'),
      };
    }
  };

  const dateRange = getDateRange();
  const { data: calendarData, isLoading: calendarLoading } = useCalendar(dateRange);
  const calendarItems = calendarData?.items || [];

  // Filter items by platform (only for posts)
  const filteredItems = calendarItems.filter(item => {
    if (item.kind === 'business_event') return true;
    if (item.kind === 'post') {
      if (platformFilter === 'all') return true;
      return item.platform === platformFilter;
    }
    return true;
  });

  // Navigation helpers
  const navigate = (direction: number) => {
    if (calendarView === 'day') {
      setSelectedDate(addDays(selectedDate, direction));
    } else if (calendarView === 'week') {
      setSelectedDate(addDays(selectedDate, direction * 7));
    } else {
      setSelectedDate(addMonths(selectedDate, direction));
    }
  };

  const getDisplayDate = () => {
    if (calendarView === 'day') {
      return format(selectedDate, 'EEEE, MMMM d, yyyy');
    } else if (calendarView === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'MMMM d, yyyy')}`;
    } else {
      return format(selectedDate, 'MMMM yyyy');
    }
  };

  // Get items for a specific date
  const getItemsForDate = (date: Date) => {
    return filteredItems.filter(item => {
      const itemDate = new Date(item.startAt);
      return isSameDay(itemDate, date);
    });
  };

  // Get items for a specific day in month view
  const getItemsCountForDate = (date: Date) => {
    return getItemsForDate(date).length;
  };

  // Social platforms only for filter
  const socialPlatforms = PLATFORMS.filter(p => SOCIAL_PLATFORMS.includes(p.id));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">Schedule and manage your posts and events</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as Platform | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {socialPlatforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => useAppStore.getState().setActiveView("compose")}>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <span className="font-medium ml-4">
            {getDisplayDate()}
          </span>
        </div>
        <Tabs value={calendarView} onValueChange={(v) => setCalendarView(v as CalendarView)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Views */}
      {calendarLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSkeleton />
        </div>
      ) : calendarView === 'day' ? (
        <DayView selectedDate={selectedDate} items={filteredItems} />
      ) : calendarView === 'week' ? (
        <WeekView selectedDate={selectedDate} items={filteredItems} />
      ) : (
        <MonthView selectedDate={selectedDate} items={filteredItems} onDayClick={(date) => {
          setSelectedDate(date);
          setCalendarView('day');
        }} />
      )}
    </div>
  );
}

// Day View - Most detailed
function DayView({ selectedDate, items }: { selectedDate: Date; items: any[] }) {
  const dayItems = items.filter(item => {
    const itemDate = new Date(item.startAt);
    return isSameDay(itemDate, selectedDate);
  });

  // Sort by time
  dayItems.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</CardTitle>
      </CardHeader>
      <CardContent>
        {dayItems.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events scheduled"
            description="This day has no posts or business events"
          />
        ) : (
          <div className="space-y-3">
            {dayItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "p-4 rounded-lg border",
                  item.kind === 'business_event' && "bg-blue-50 border-blue-200",
                  item.kind === 'post' && "bg-gray-50 border-gray-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={item.kind === 'business_event' ? 'default' : 'secondary'}>
                        {item.kind === 'business_event' ? 'Event' : 'Post'}
                      </Badge>
                      {item.kind === 'post' && item.platform && (
                        <PlatformIcon platform={item.platform} className="h-4 w-4" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(item.startAt), 'h:mm a')}
                        {item.endAt && ` - ${format(new Date(item.endAt), 'h:mm a')}`}
                      </span>
                    </div>
                    <p className="font-medium">{item.title}</p>
                    {item.meta?.location && (
                      <p className="text-sm text-muted-foreground mt-1">
                        📍 {item.meta.location}
                      </p>
                    )}
                    {item.meta?.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.meta.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Week View
function WeekView({ selectedDate, items }: { selectedDate: Date; items: any[] }) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-7 gap-4">
      {weekDays.map((day) => {
        const dayItems = items.filter(item => {
          const itemDate = new Date(item.startAt);
          return isSameDay(itemDate, day);
        });
        const isToday = isSameDay(day, new Date());

        return (
          <Card key={day.toISOString()} className={cn(isToday && "ring-2 ring-primary")}>
            <CardHeader className="pb-2">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                <p className={cn(
                  "text-lg font-bold",
                  isToday && "text-primary"
                )}>
                  {format(day, "d")}
                </p>
              </div>
            </CardHeader>
            <CardContent className="min-h-[200px]">
              <div className="space-y-2">
                {dayItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-2 rounded-md text-xs cursor-pointer hover:opacity-80",
                      item.kind === 'business_event' && "bg-blue-600/10 border-l-2 border-blue-600",
                      item.kind === 'post' && item.platform === "facebook" && "bg-blue-600/10 border-l-2 border-blue-600",
                      item.kind === 'post' && item.platform === "instagram" && "bg-pink-500/10 border-l-2 border-pink-500",
                      item.kind === 'post' && item.platform === "linkedin" && "bg-blue-700/10 border-l-2 border-blue-700",
                      item.kind === 'post' && item.platform === "tiktok" && "bg-gray-900/10 border-l-2 border-gray-900",
                      item.kind === 'post' && item.platform === "pinterest" && "bg-red-600/10 border-l-2 border-red-600",
                      item.kind === 'post' && item.platform === "reddit" && "bg-orange-500/10 border-l-2 border-orange-500"
                    )}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {item.kind === 'post' && item.platform && (
                        <PlatformIcon platform={item.platform} className="h-3 w-3" />
                      )}
                      {item.kind === 'business_event' && (
                        <Calendar className="h-3 w-3" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.kind === 'business_event' ? 'Event' : 'Post'}
                      </Badge>
                    </div>
                    <p className="line-clamp-2">{item.title}</p>
                    <p className="text-muted-foreground mt-1">
                      {format(new Date(item.startAt), "h:mm a")}
                    </p>
                  </div>
                ))}
                {dayItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Month View
function MonthView({ selectedDate, items, onDayClick }: { selectedDate: Date; items: any[]; onDayClick: (date: Date) => void }) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getItemsCountForDate = (date: Date) => {
    return items.filter(item => {
      const itemDate = new Date(item.startAt);
      return isSameDay(itemDate, date);
    }).length;
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {/* Day headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
          {day}
        </div>
      ))}
      
      {/* Calendar days */}
      {days.map((day) => {
        const isCurrentMonth = isSameMonth(day, selectedDate);
        const isToday = isSameDay(day, new Date());
        const itemCount = getItemsCountForDate(day);

        return (
          <Card
            key={day.toISOString()}
            className={cn(
              "min-h-[100px] cursor-pointer hover:bg-muted/50 transition-colors",
              !isCurrentMonth && "opacity-40",
              isToday && "ring-2 ring-primary"
            )}
            onClick={() => onDayClick(day)}
          >
            <CardContent className="p-2">
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-sm font-medium",
                  isToday && "text-primary"
                )}>
                  {format(day, "d")}
                </span>
                {itemCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {itemCount}
                  </Badge>
                )}
              </div>
              {itemCount > 0 && (
                <div className="flex gap-1 mt-1">
                  {items.filter(item => {
                    const itemDate = new Date(item.startAt);
                    return isSameDay(itemDate, day);
                  }).slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "h-1 w-1 rounded-full",
                        item.kind === 'business_event' && "bg-blue-600",
                        item.kind === 'post' && "bg-gray-600"
                      )}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Inbox View
function InboxView() {
  const {
    conversations,
    updateConversation,
    inboxFilter,
    setInboxFilter,
    selectedConversation,
    setSelectedConversation,
  } = useAppStore();
  const [replyContent, setReplyContent] = React.useState("");

  const filteredConversations = conversations.filter((conv) => {
    if (inboxFilter === "unread") return conv.status === "unread";
    if (inboxFilter === "assigned") return conv.assignedTo !== undefined;
    return true;
  });

  const handleMarkRead = (id: string) => {
    updateConversation(id, { status: "read" });
  };

  const handleArchive = (id: string) => {
    updateConversation(id, { status: "archived" });
    if (selectedConversation?.id === id) {
      setSelectedConversation(null);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">Manage your social media conversations</p>
        </div>
        <Tabs value={inboxFilter} onValueChange={(v) => setInboxFilter(v as "all" | "unread" | "assigned")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({conversations.filter((c) => c.status === "unread").length})
            </TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-80px)]">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-220px)]">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "p-4 border-b cursor-pointer hover:bg-muted/50",
                    selectedConversation?.id === conv.id && "bg-muted",
                    conv.status === "unread" && "bg-blue-50/50"
                  )}
                  onClick={() => {
                    setSelectedConversation(conv);
                    if (conv.status === "unread") {
                      handleMarkRead(conv.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{conv.authorName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.authorName}</p>
                        <div className="flex items-center gap-1">
                          <PlatformIcon platform={conv.platform} className="h-3 w-3 text-muted-foreground" />
                          {conv.status === "unread" && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {conv.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(conv.createdAt, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card className="lg:col-span-2">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{selectedConversation.authorName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.authorName}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <PlatformIcon platform={selectedConversation.platform} className="h-3 w-3" />
                        {selectedConversation.messageType}
                        {selectedConversation.postId && " on your post"}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleArchive(selectedConversation.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 h-[calc(100%-200px)] overflow-y-auto">
                <div className="p-4 bg-muted rounded-lg mb-4">
                  <p className="text-sm">{selectedConversation.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {format(selectedConversation.createdAt, "MMMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant="outline" size="sm">
                    Saved Replies
                  </Button>
                  <Button size="sm" disabled={!replyContent.trim()}>
                    <Reply className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a conversation to view details
            </div>
          )}
          </Card>
        </div>
      </div>
    );
  }

// Analytics View
function AnalyticsView() {
  const { posts, socialAccounts } = useAppStore();

  const publishedPosts = posts.filter((p) => p.status === "published" && p.metrics);
  const totalMetrics = publishedPosts.reduce(
    (acc, post) => ({
      impressions: acc.impressions + (post.metrics?.impressions || 0),
      reach: acc.reach + (post.metrics?.reach || 0),
      engagement: acc.engagement + (post.metrics?.likes || 0) + (post.metrics?.comments || 0) + (post.metrics?.shares || 0),
      clicks: acc.clicks + (post.metrics?.clicks || 0),
    }),
    { impressions: 0, reach: 0, engagement: 0, clicks: 0 }
  );

  const engagementRate = totalMetrics.impressions > 0
    ? ((totalMetrics.engagement / totalMetrics.impressions) * 100).toFixed(2)
    : "0";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your social media performance</p>
        </div>
        <Select defaultValue="7d">
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.impressions.toLocaleString()}</div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.reach.toLocaleString()}</div>
            <Progress value={60} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementRate}%</div>
            <Progress value={Number.parseFloat(engagementRate) * 10} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.clicks.toLocaleString()}</div>
            <Progress value={45} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
          <CardDescription>Breakdown by social media platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {PLATFORMS.map((platform) => {
              const platformPosts = publishedPosts.filter((p) => p.platform === platform.id);
              const platformImpressions = platformPosts.reduce((sum, p) => sum + (p.metrics?.impressions || 0), 0);
              const percentage = totalMetrics.impressions > 0
                ? (platformImpressions / totalMetrics.impressions * 100).toFixed(1)
                : "0";

              return (
                <div key={platform.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={platform.id} className="h-5 w-5" />
                      <span className="font-medium">{platform.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{platformImpressions.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-2">({percentage}%)</span>
                    </div>
                  </div>
                  <Progress value={Number.parseFloat(percentage)} className={platform.color} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
          <CardDescription>Your best content based on engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {publishedPosts
              .sort((a, b) => (b.metrics?.impressions || 0) - (a.metrics?.impressions || 0))
              .slice(0, 5)
              .map((post, index) => (
                <div key={post.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">#{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformIcon platform={post.platform} className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        {post.publishedTime && format(post.publishedTime, "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{post.content}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold">{post.metrics?.impressions.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Impressions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{post.metrics?.likes}</p>
                      <p className="text-xs text-muted-foreground">Likes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{post.metrics?.comments}</p>
                      <p className="text-xs text-muted-foreground">Comments</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{post.metrics?.shares}</p>
                      <p className="text-xs text-muted-foreground">Shares</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Accounts View
// Connect Account Buttons Dialog Component
function ConnectAccountButtonsDialog({ currentBrandId, refetchAccounts, setDialogOpen }: { currentBrandId: string; refetchAccounts: () => void; setDialogOpen: (open: boolean) => void }) {
  const [configStatus, setConfigStatus] = React.useState<{ google: { configured: boolean; missing: string[] }; meta: { configured: boolean; missing: string[] } } | null>(null);
  const [configLoading, setConfigLoading] = React.useState(true);

  // Fetch config status on mount (use API base so Vercel frontend hits Railway)
  const apiBase = getApiBaseUrl();
  React.useEffect(() => {
    fetch(`${apiBase}/oauth/config-status`)
      .then(res => res.json())
      .then(data => {
        setConfigStatus(data);
        setConfigLoading(false);
      })
      .catch(() => {
        setConfigLoading(false);
      });
  }, [apiBase]);

  const handleConnectGoogle = async (purpose: 'youtube') => {
    try {
      if (!currentBrandId || currentBrandId === 'all') {
        toast.error('Please select a specific brand first');
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/oauth/google/start?brandId=${currentBrandId}&purpose=${purpose}`);
      const data = await response.json();
      
      if (data.code === 'GOOGLE_NOT_CONFIGURED') {
        toast.error(data.message || 'Google OAuth is not configured');
        return;
      }
      
      if (data.authUrl) {
        const popup = window.open(data.authUrl, 'oauth', 'width=600,height=700');
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'oauth:complete' && event.data.provider === 'google' && event.data.purpose === purpose) {
            window.removeEventListener('message', handleMessage);
            if (event.data.success) {
              toast.success(`${purpose === 'youtube' ? 'YouTube' : 'Google'} connected successfully!`);
              refetchAccounts();
              setDialogOpen(false);
            } else {
              toast.error(event.data.error || `Failed to connect ${purpose === 'youtube' ? 'YouTube' : 'Google'}`);
            }
            if (popup) popup.close();
          }
        };
        window.addEventListener('message', handleMessage);
      } else {
        toast.error(data.message || 'Failed to start OAuth flow');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to connect');
    }
  };

  const handleConnectMeta = async (purpose: 'facebook' | 'instagram') => {
    try {
      if (!currentBrandId || currentBrandId === 'all') {
        toast.error('Please select a specific brand first');
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/oauth/meta/start?brandId=${currentBrandId}&purpose=${purpose}`);
      const data = await response.json();
      
      if (data.code === 'META_NOT_CONFIGURED') {
        toast.error(data.message || 'Meta OAuth is not configured');
        return;
      }
      
      if (data.authUrl) {
        const popup = window.open(data.authUrl, 'oauth', 'width=600,height=700');
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'oauth:complete' && event.data.provider === 'meta' && event.data.purpose === purpose) {
            window.removeEventListener('message', handleMessage);
            if (event.data.success) {
              toast.success(`${purpose === 'facebook' ? 'Facebook Page' : 'Instagram Business Account'} connected successfully!`);
              refetchAccounts();
              setDialogOpen(false);
            } else {
              toast.error(event.data.error || `Failed to connect ${purpose === 'facebook' ? 'Facebook' : 'Instagram'}`);
            }
            if (popup) popup.close();
          }
        };
        window.addEventListener('message', handleMessage);
      } else {
        toast.error(data.message || 'Failed to start OAuth flow');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to connect');
    }
  };

  const googleConfigured = configStatus?.google.configured ?? false;
  const metaConfigured = configStatus?.meta.configured ?? false;
  const googleMissing = configStatus?.google.missing ?? [];
  const metaMissing = configStatus?.meta.missing ?? [];

  return (
    <div className="grid gap-4 py-4">
      {configLoading ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Checking OAuth configuration...</p>
        </div>
      ) : (
        <>
          {/* Google OAuth (YouTube) */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="justify-start h-16 w-full"
              disabled={!googleConfigured}
              onClick={() => handleConnectGoogle('youtube')}
            >
              <PlatformIcon platform="youtube" className="h-6 w-6 mr-4" />
              <div className="text-left flex-1">
                <p className="font-medium">YouTube</p>
                <p className="text-sm text-muted-foreground">Connect your YouTube channel</p>
              </div>
            </Button>
            {!googleConfigured && (
              <p className="text-xs text-muted-foreground px-2">
                Not configured: missing {googleMissing.join(', ')}
              </p>
            )}
          </div>

          {/* Meta OAuth (Facebook) */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="justify-start h-16 w-full"
              disabled={!metaConfigured}
              onClick={() => handleConnectMeta('facebook')}
            >
              <PlatformIcon platform="facebook" className="h-6 w-6 mr-4" />
              <div className="text-left flex-1">
                <p className="font-medium">Facebook</p>
                <p className="text-sm text-muted-foreground">Connect your Facebook Page</p>
              </div>
            </Button>
            {!metaConfigured && (
              <p className="text-xs text-muted-foreground px-2">
                Not configured: missing {metaMissing.join(', ')}
              </p>
            )}
          </div>

          {/* Meta OAuth (Instagram) */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="justify-start h-16 w-full"
              disabled={!metaConfigured}
              onClick={() => handleConnectMeta('instagram')}
            >
              <PlatformIcon platform="instagram" className="h-6 w-6 mr-4" />
              <div className="text-left flex-1">
                <p className="font-medium">Instagram</p>
                <p className="text-sm text-muted-foreground">Connect your Instagram Business Account</p>
              </div>
            </Button>
            {!metaConfigured && (
              <p className="text-xs text-muted-foreground px-2">
                Not configured: missing {metaMissing.join(', ')}
              </p>
            )}
          </div>

          {/* Stub accounts for other platforms */}
          {PLATFORMS.filter(p => !['youtube', 'facebook', 'instagram'].includes(p.id)).map((platform) => (
            <Button
              key={platform.id}
              variant="outline"
              className="justify-start h-16 opacity-50"
              disabled
            >
              <PlatformIcon platform={platform.id as Platform} className="h-6 w-6 mr-4" />
              <div className="text-left">
                <p className="font-medium">{platform.label}</p>
                <p className="text-sm text-muted-foreground">Coming soon</p>
              </div>
            </Button>
          ))}
        </>
      )}
    </div>
  );
}

function AccountsView() {
  const activeBrandId = useAppStore((state) => state.activeBrandId);
  const isAllBrandsMode = activeBrandId === 'all';
  const { data: accountsData, isLoading: accountsLoading, refetch: refetchAccounts } = useSocialAccounts();
  const createAccount = useCreateSocialAccount();
  const deleteAccount = useDeleteSocialAccount();
  const [connectDialogOpen, setConnectDialogOpen] = React.useState(false);
  const [stubDialogOpen, setStubDialogOpen] = React.useState(false);
  const [stubPlatform, setStubPlatform] = React.useState<Platform>('facebook');
  const [stubHandle, setStubHandle] = React.useState('');
  const { data: googleIntegrationsData, refetch: refetchGoogleIntegrations } = useGoogleIntegrations();
  const { mutate: deleteGoogleIntegration, isPending: isDeletingGoogle } = useDeleteGoogleIntegration();
  const { data: currentBrandData } = useCurrentBrand();
  const currentBrandId = currentBrandData?.id || activeBrandId || 'default';
  
  const socialAccounts = accountsData?.accounts || [];
  const googleIntegrations = googleIntegrationsData?.integrations || [];

  // Only show social platforms (not slack/notion)
  const socialPlatforms = PLATFORMS.filter(p => 
    ['facebook', 'instagram', 'linkedin', 'tiktok', 'pinterest', 'reddit', 'youtube'].includes(p.id)
  );

  const handleCreateStubAccount = async () => {
    if (!stubHandle.trim()) {
      toast.error('Please enter a handle');
      return;
    }

    if (isAllBrandsMode) {
      toast.error('Please select a specific brand to create accounts');
      return;
    }

    try {
      await createAccount.mutateAsync({
        brandId: activeBrandId as string,
        platform: stubPlatform,
        username: stubHandle.trim(),
        displayName: stubHandle.trim(),
        isConnected: false,
        status: 'stub',
        organizationId: 'org1',
      });
      toast.success('Stub account created!');
      setStubDialogOpen(false);
      setStubHandle('');
      setStubPlatform('facebook');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create stub account');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      await deleteAccount.mutateAsync(id);
      toast.success('Account deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Accounts</h1>
          <p className="text-muted-foreground">
            {isAllBrandsMode 
              ? 'Select a brand to view connected accounts'
              : 'Manage your connected social media accounts'}
          </p>
        </div>
        {!isAllBrandsMode && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStubDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Stub Account
            </Button>
            <Button onClick={() => setConnectDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </div>
        )}
      </div>

      {isAllBrandsMode && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a specific brand to view or manage social accounts.
          </AlertDescription>
        </Alert>
      )}

      {accountsLoading ? (
        <LoadingList count={3} />
      ) : socialAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={Users}
              title="No social accounts connected"
              description={isAllBrandsMode 
                ? "Select a brand to view connected accounts"
                : `Connect your social media accounts to start posting with ${APP_NAME}`}
              actionLabel={isAllBrandsMode ? undefined : "Add Stub Account"}
              onAction={isAllBrandsMode ? undefined : () => setStubDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socialAccounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-3 rounded-full",
                      account.platform === "facebook" && "bg-blue-600",
                      account.platform === "instagram" && "bg-pink-500",
                      account.platform === "linkedin" && "bg-blue-700",
                      account.platform === "tiktok" && "bg-gray-900",
                      account.platform === "pinterest" && "bg-red-600",
                      account.platform === "reddit" && "bg-orange-500"
                    )}>
                      <PlatformIcon platform={account.platform} className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle>{account.displayName}</CardTitle>
                      <CardDescription>{account.username}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Refresh</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteAccount(account.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={
                      account.status === 'stub' ? 'secondary' :
                      account.isConnected ? "default" : "destructive"
                    }>
                      {account.status === 'stub' ? 'Stub' :
                       account.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  {account.followerCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Followers</span>
                      <span className="font-medium">{account.followerCount.toLocaleString()}</span>
                    </div>
                  )}
                  {account.lastSync && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Sync</span>
                      <span className="text-sm">
                        {format(account.lastSync, "MMM d, h:mm a")}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <Button variant="outline" className="w-full">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stub Account Dialog */}
      <Dialog open={stubDialogOpen} onOpenChange={setStubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stub Account</DialogTitle>
            <DialogDescription>
              Create a stub connection record for testing (dev mode)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={stubPlatform} onValueChange={(v) => setStubPlatform(v as Platform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {socialPlatforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      <div className="flex items-center gap-2">
                        <PlatformIcon platform={platform.id} className="h-4 w-4" />
                        {platform.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Handle/Username</Label>
              <Input
                placeholder="@username or username"
                value={stubHandle}
                onChange={(e) => setStubHandle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStubDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateStubAccount}
              disabled={!stubHandle.trim() || createAccount.isPending}
            >
              {createAccount.isPending ? 'Creating...' : 'Create Stub Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Social Account</DialogTitle>
            <DialogDescription>
              Choose a platform to connect to your {APP_NAME} account
            </DialogDescription>
          </DialogHeader>
          <ConnectAccountButtonsDialog currentBrandId={currentBrandId} refetchAccounts={refetchAccounts} setDialogOpen={setConnectDialogOpen} />
        </DialogContent>
      </Dialog>

      {/* Google Workspace Section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Email (Google Workspace)</h2>
            <p className="text-sm text-muted-foreground">Connect your Gmail inbox to triage messages</p>
          </div>
          {googleIntegrations.length === 0 && (
            <Button
              onClick={async () => {
                try {
                  const { initiateGoogleOAuthFlow } = await import('@/sdk/services/oauth-service');
                  await initiateGoogleOAuthFlow(currentBrandId);
                  refetchGoogleIntegrations();
                  toast.success('Google Workspace connected successfully!');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to connect Google Workspace');
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Google Workspace
            </Button>
          )}
        </div>

        {googleIntegrations.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={Inbox}
                title="No Google Workspace connection"
                description={`Connect your Gmail inbox to triage messages and avoid missing clients in ${APP_NAME}`}
                actionLabel="Connect Google Workspace"
                onAction={async () => {
                  try {
                    const { initiateGoogleOAuthFlow } = await import('@/sdk/services/oauth-service');
                    await initiateGoogleOAuthFlow(currentBrandId);
                    refetchGoogleIntegrations();
                    toast.success('Google Workspace connected successfully!');
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Failed to connect Google Workspace');
                  }
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {googleIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-red-600">
                        <Inbox className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle>Gmail</CardTitle>
                        <CardDescription>{integration.email}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('Are you sure you want to disconnect this Google Workspace account?')) {
                              deleteGoogleIntegration(integration.id, {
                                onSuccess: () => {
                                  refetchGoogleIntegrations();
                                  toast.success('Google Workspace disconnected');
                                },
                                onError: (error) => {
                                  toast.error(error.message || 'Failed to disconnect');
                                },
                              });
                            }
                          }}
                          disabled={isDeletingGoogle}
                        >
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="default">Connected</Badge>
                    </div>
                    <Separator />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => useAppStore.getState().setActiveView('email')}
                    >
                      View Inbox
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Email View
function EmailView() {
  const { data: currentBrandData } = useCurrentBrand();
  const currentBrandId = currentBrandData?.id || 'default';
  const currentBrandName = currentBrandData?.name || 'Current Brand';
  
  const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'needs_reply' | 'follow_up'>('all');
  
  const { data: emailAccountsData } = useEmailAccounts();
  const emailAccounts = emailAccountsData?.accounts || [];
  const hasIntegration = emailAccounts.some(acc => acc.brandId === currentBrandId || currentBrandId === 'all');
  
  const { mutate: deleteEmailAccount } = useDeleteEmailAccount();
  
  const { data: threadsData, isLoading: threadsLoading, error: threadsError, refetch: refetchThreads } = useEmailThreads(
    { limit: 50, unreadOnly: filter === 'unread' }
  );
  const threads = threadsData?.threads || [];
  
  const { data: messageData, isLoading: messageLoading } = useEmailMessage(selectedMessageId || '', {
    queryKey: ['email', 'message', selectedMessageId],
    enabled: !!selectedMessageId,
  });
  
  const { mutate: setTriage, isPending: isSettingTriage } = useSetEmailTriage();
  
  // Detect if email is likely a lead based on keywords
  const isLikelyLead = (thread: { subject: string; snippet: string }) => {
    const text = `${thread.subject} ${thread.snippet}`.toLowerCase();
    const leadKeywords = ['pricing', 'trial', 'membership', 'schedule', 'rates', 'cost', 'price', 'quote', 'inquiry', 'interested'];
    return leadKeywords.some(keyword => text.includes(keyword));
  };

  // Filter threads by triage status
  const filteredThreads = React.useMemo(() => {
    if (filter === 'needs_reply') {
      return threads.filter(t => t.triageStatus === 'needs_reply');
    }
    if (filter === 'follow_up') {
      return threads.filter(t => t.triageStatus === 'follow_up');
    }
    return threads;
  }, [threads, filter]);
  
  const handleSetTriage = (messageId: string, status: 'needs_reply' | 'follow_up' | 'done') => {
    setTriage({ messageId, status }, {
      onSuccess: () => {
        refetchThreads();
        if (selectedMessageId === messageId) {
          // Refetch message if it's currently selected
          setTimeout(() => refetchThreads(), 100);
        }
      },
    });
  };
  
  if (!hasIntegration && currentBrandId !== 'all') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Email</h1>
          <p className="text-muted-foreground">{currentBrandName}</p>
        </div>
        <EmptyState
          icon={Mail}
          title="No email account connected"
          description={`Connect your email account to triage messages and avoid missing leads and clients in ${APP_NAME}`}
          actionLabel="Connect Email Account"
          onAction={() => {
            useAppStore.getState().setActiveView('accounts');
            toast.info('Navigate to Accounts page to connect Google Workspace');
          }}
        />
      </div>
    );
  }
  
  if (currentBrandId === 'all') {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Email (Read-Only)</h1>
          <p className="text-muted-foreground">Select a specific brand to view and manage emails</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Brand Selection Required</AlertTitle>
          <AlertDescription>
            Please select a specific brand from the brand switcher to view and manage emails.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with connected accounts */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Email</h1>
            <p className="text-sm text-muted-foreground">{currentBrandName}</p>
          </div>
          <div className="flex items-center gap-2">
            {emailAccounts.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Connected: {emailAccounts.map(acc => acc.email).join(', ')}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                useAppStore.getState().setActiveView('accounts');
                toast.info('Navigate to Accounts page to connect email accounts');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Email
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Email List */}
        <div className="w-1/2 border-r flex flex-col">
          <div className="p-4 border-b space-y-4">
            {/* Filters */}
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread
              </Button>
              <Button
                variant={filter === 'needs_reply' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('needs_reply')}
              >
                Needs Reply
              </Button>
              <Button
                variant={filter === 'follow_up' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('follow_up')}
              >
                Follow Up
              </Button>
            </div>
          </div>
        
        <ScrollArea className="flex-1">
          {threadsLoading ? (
            <div className="p-4">
              <LoadingList count={5} />
            </div>
          ) : threadsError ? (
            <div className="p-4">
              <ErrorDisplay
                error={threadsError}
                title="Failed to load emails"
                onRetry={() => refetchThreads()}
              />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={Inbox}
                title="No emails"
                description={
                  filter === 'unread' ? 'No unread emails' : 
                  filter === 'needs_reply' ? 'No emails need reply' : 
                  filter === 'follow_up' ? 'No emails need follow up' :
                  'No emails found'
                }
              />
            </div>
          ) : (
            <div className="divide-y">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedMessageId(thread.id)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                    selectedMessageId === thread.id && "bg-muted"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-medium truncate">{thread.from}</p>
                        {thread.isUnread && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        {isLikelyLead(thread) && (
                          <Badge variant="default" className="text-xs bg-orange-500">
                            Likely Lead
                          </Badge>
                        )}
                        {thread.triageStatus && (
                          <Badge variant="outline" className="text-xs">
                            {thread.triageStatus === 'needs_reply' ? 'Needs Reply' : 
                             thread.triageStatus === 'follow_up' ? 'Follow Up' : 'Done'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-semibold mb-1 truncate">{thread.subject}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{thread.snippet}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(thread.date), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Email Detail */}
      <div className="w-1/2 flex flex-col">
        {selectedMessageId ? (
          <>
            {messageLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingSkeleton />
              </div>
            ) : messageData ? (
              <>
                <div className="p-4 border-b space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold">{messageData.subject}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm text-muted-foreground">From: {messageData.from}</p>
                      {messageData.isUnread && (
                        <Badge variant="default">Unread</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(messageData.date), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  
                  {/* Triage Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant={messageData.triageStatus === 'needs_reply' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSetTriage(messageData.id, 'needs_reply')}
                      disabled={isSettingTriage}
                    >
                      Needs Reply
                    </Button>
                    <Button
                      variant={messageData.triageStatus === 'follow_up' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSetTriage(messageData.id, 'follow_up')}
                      disabled={isSettingTriage}
                    >
                      Follow Up
                    </Button>
                    <Button
                      variant={messageData.triageStatus === 'done' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSetTriage(messageData.id, 'done')}
                      disabled={isSettingTriage}
                    >
                      Done
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">To:</p>
                      <p className="text-sm text-muted-foreground">{messageData.to.join(', ')}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm whitespace-pre-wrap">{messageData.bodySnippet}</p>
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={Inbox}
                  title="Message not found"
                  description="The selected message could not be loaded"
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              icon={Inbox}
              title="Select an email"
              description="Choose an email from the list to view details"
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

// Campaigns View
function CampaignsView() {
  const { campaigns, posts } = useAppStore();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Organize and track your marketing campaigns</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {campaigns.map((campaign) => {
          const campaignPosts = posts.filter((p) => p.campaignId === campaign.id);
          const publishedCount = campaignPosts.filter((p) => p.status === "published").length;
          const progress = campaign.postCount > 0
            ? (publishedCount / campaign.postCount * 100)
            : 0;

          return (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>{campaign.description}</CardDescription>
                  </div>
                  <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                    {campaign.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{publishedCount} / {campaign.postCount} posts</span>
                  </div>
                  <Progress value={progress} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{campaign.totalEngagement.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Engagement</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{campaignPosts.length}</p>
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                </div>
                {campaign.startDate && campaign.endDate && (
                  <div className="text-sm text-muted-foreground">
                    {format(campaign.startDate, "MMM d")} - {format(campaign.endDate, "MMM d, yyyy")}
                  </div>
                )}
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    View Posts
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Campaign</DialogTitle>
            <DialogDescription>
              Create a new marketing campaign to organize your posts
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input placeholder="e.g., Holiday Sale 2025" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe your campaign goals..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success("Campaign created!");
              setCreateDialogOpen(false);
            }}>
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Assets View
function AssetsView() {
  const [activeTab, setActiveTab] = React.useState<AssetType>('image');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [assetToDelete, setAssetToDelete] = React.useState<Asset | null>(null);
  const [newAssetUrl, setNewAssetUrl] = React.useState('');
  const [newAssetTags, setNewAssetTags] = React.useState('');
  const [uploadedFiles, setUploadedFiles] = React.useState<UploadedItem[]>([]);
  
  const { data, isLoading, error } = useAssets({ 
    type: activeTab, 
    search: searchQuery || undefined 
  });
  const createAsset = useCreateAsset();
  const uploadAssets = useUploadAssets();
  const deleteAsset = useDeleteAsset();

  const assets = data?.assets || [];

  // Convert files to data URLs for upload
  const handleFilesSelected = async (files: File[]) => {
    const newItems: UploadedItem[] = files.map((file) => ({
      file,
      // Use object URL for preview to avoid base64 payload inflation
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending',
    }));
    setUploadedFiles((prev) => [...prev, ...newItems]);
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    // Handle URL upload (legacy)
    if (newAssetUrl.trim() && uploadedFiles.length === 0) {
      createAsset.mutate({
        type: activeTab,
        url: newAssetUrl.trim(),
        tags: newAssetTags.split(',').map(t => t.trim()).filter(Boolean),
        organizationId: 'org1',
        version: '1.0.0',
      }, {
        onSuccess: () => {
          toast.success('Asset uploaded successfully');
          setUploadDialogOpen(false);
          setNewAssetUrl('');
          setNewAssetTags('');
        },
        onError: (err) => {
          toast.error(`Failed to upload asset: ${err.message}`);
        },
      });
      return;
    }

    // Handle file uploads
    if (uploadedFiles.length === 0) {
      toast.error('Please select files or enter a URL');
      return;
    }

    try {
      // Upload multipart to backend
      await uploadAssets.mutateAsync({
        files: uploadedFiles.map((f) => f.file),
        tags: newAssetTags.split(',').map(t => t.trim()).filter(Boolean),
      });

      // Mark all as success locally
      setUploadedFiles((prev) => prev.map((f) => ({ ...f, status: 'success' as const })));
      toast.success(`Successfully uploaded ${uploadedFiles.length} asset(s)`);
      setUploadDialogOpen(false);
      setUploadedFiles([]);
      setNewAssetUrl('');
      setNewAssetTags('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown upload error';
      setUploadedFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const, error: message })));
      toast.error(`Upload failed: ${message}`);
    }
  };

  // Get accept string based on active tab
  const getAcceptString = () => {
    switch (activeTab) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      default:
        return undefined;
    }
  };

  const handleDelete = () => {
    if (!assetToDelete) return;
    
    deleteAsset.mutate(assetToDelete.id, {
      onSuccess: () => {
        toast.success('Asset deleted successfully');
        setDeleteDialogOpen(false);
        setAssetToDelete(null);
      },
      onError: (err) => {
        toast.error(`Failed to delete asset: ${err.message}`);
      },
    });
  };

  const getAssetTypeIcon = (type: AssetType) => {
    switch (type) {
      case 'image': return <Image className="h-5 w-5" />;
      case 'video': return <Music className="h-5 w-5" />;
      case 'template': return <FileEdit className="h-5 w-5" />;
      case 'hashtags': return <Hash className="h-5 w-5" />;
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorDisplay error={error} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-muted-foreground">Manage your media files and templates</p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetType)}>
        <TabsList>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="template">Templates</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtag Sets</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : assets.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                {getAssetTypeIcon(activeTab)}
                <p className="mt-4">No {activeTab === 'hashtags' ? 'hashtag sets' : `${activeTab}s`} uploaded yet</p>
                <p className="text-sm">Upload {activeTab === 'hashtags' ? 'hashtag sets' : `${activeTab}s`} to use in your posts</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <Card key={asset.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {asset.url && (activeTab === 'image' || activeTab === 'video') ? (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {activeTab === 'image' ? (
                          <img 
                            src={asset.url} 
                            alt={asset.id}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-center">
                            <Music className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">Video</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-muted flex items-center justify-center">
                        {getAssetTypeIcon(activeTab)}
                      </div>
                    )}
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{asset.url || 'Untitled'}</p>
                          {asset.tags && asset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {asset.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAssetToDelete(asset);
                            setDeleteDialogOpen(true);
                          }}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Added {format(new Date(asset.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) {
          setUploadedFiles([]);
          setNewAssetUrl('');
          setNewAssetTags('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload {activeTab === 'hashtags' ? 'Hashtag Set' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</DialogTitle>
            <DialogDescription>
              {activeTab === 'hashtags' 
                ? 'Upload a hashtag set file'
                : `Add ${activeTab}s to your library by dragging and dropping or selecting files`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* File Upload Dropzone */}
            {(activeTab === 'image' || activeTab === 'video') && (
              <UploadDropzone
                multiple={true}
                accept={getAcceptString()}
                maxFiles={10}
                maxSizeMB={50}
                value={uploadedFiles}
                onFilesSelected={handleFilesSelected}
                onFileRemove={handleFileRemove}
                title={`Upload ${activeTab === 'image' ? 'Images' : 'Videos'}`}
                helperText={`Drag and drop ${activeTab}s here or click to browse`}
                isUploading={uploadAssets.isPending}
              />
            )}

            {/* URL Input (fallback/alternative) */}
            <div className="space-y-2">
              <Label>Or enter URL</Label>
              <Input
                placeholder="https://example.com/asset.jpg"
                value={newAssetUrl}
                onChange={(e) => setNewAssetUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You can upload files above or paste a URL here
              </p>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="marketing, social, campaign"
                value={newAssetTags}
                onChange={(e) => setNewAssetTags(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              setUploadedFiles([]);
              setNewAssetUrl('');
              setNewAssetTags('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={createAsset.isPending || (uploadedFiles.length === 0 && !newAssetUrl.trim())}
            >
              {createAsset.isPending ? 'Uploading...' : `Upload ${uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : 'Asset'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteAsset.isPending}>
              {deleteAsset.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Social Listening View
function ListeningView() {
  const { alerts } = useAppStore();
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    toast.info("Search functionality coming soon");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Listening</h1>
        <p className="text-muted-foreground">Monitor keywords and hashtags across platforms</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search for keywords, hashtags, or mentions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Get notified when keywords are mentioned</CardDescription>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Alert
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <PlatformIcon platform={alert.platform} className="h-5 w-5" />
                  <div>
                    <p className="font-medium">"{alert.keyword}"</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.triggerCount} mentions
                      {alert.lastTriggered && ` • Last: ${format(alert.lastTriggered, "MMM d, h:mm a")}`}
                    </p>
                  </div>
                </div>
                <Badge variant={alert.isActive ? "default" : "secondary"}>
                  {alert.isActive ? "Active" : "Paused"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Settings View
function SettingsView() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your {APP_NAME} preferences</p>
      </div>

      <Tabs defaultValue="brands" className="space-y-6">
        <TabsList>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="schedule">Business Schedule</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="brands">
          <BrandsSettingsView />
        </TabsContent>

        <TabsContent value="schedule">
          <BusinessScheduleSettingsView />
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input defaultValue="Marketing Team" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input defaultValue="team@company.com" type="email" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates for important events</p>
                </div>
                <Checkbox defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Post Published</p>
                  <p className="text-sm text-muted-foreground">Get notified when posts are published</p>
                </div>
                <Checkbox defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-muted-foreground">Get notified for new inbox messages</p>
                </div>
                <Checkbox defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
              <CardDescription>Manage team members and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ==========================================
// AUTOPILOT VIEWS
// ==========================================

// Slot Status Badge
function SlotStatusBadge({ status }: { status: ScheduledSlot["status"] }) {
  const config: Record<ScheduledSlot["status"], { label: string; color: string; icon: React.ReactNode }> = {
    pending_generation: { label: "Generating", color: "bg-purple-500", icon: <Sparkles className="h-3 w-3" /> },
    generated: { label: "Generated", color: "bg-blue-500", icon: <CheckCircle2 className="h-3 w-3" /> },
    pending_approval: { label: "Needs Approval", color: "bg-yellow-500", icon: <AlertCircle className="h-3 w-3" /> },
    approved: { label: "Approved", color: "bg-green-500", icon: <ThumbsUp className="h-3 w-3" /> },
    denied: { label: "Denied", color: "bg-red-500", icon: <ThumbsDown className="h-3 w-3" /> },
    published: { label: "Published", color: "bg-emerald-500", icon: <Send className="h-3 w-3" /> },
    failed: { label: "Failed", color: "bg-red-600", icon: <XCircle className="h-3 w-3" /> },
  };

  const cfg = config[status];
  return (
    <Badge variant="outline" className={cn("gap-1", cfg.color, "text-white border-0")}>
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

// Operating Mode Selector Component
function OperatingModeSelector() {
  const { autopilotSettings, setOperatingMode, pauseAutopilot, resumeAutopilot, emergencyStop } = useAppStore();
  const [confirmDialog, setConfirmDialog] = React.useState<{ open: boolean; mode: OperatingMode | null }>({ open: false, mode: null });

  const handleModeChange = (mode: OperatingMode) => {
    if (mode === "autopilot") {
      setConfirmDialog({ open: true, mode });
    } else {
      setOperatingMode(mode);
      toast.success(`Switched to ${OPERATING_MODES.find((m) => m.id === mode)?.label}`);
    }
  };

  const confirmAutopilot = () => {
    if (confirmDialog.mode) {
      setOperatingMode(confirmDialog.mode);
      toast.success("Autopilot Mode activated! Posts will publish automatically.");
    }
    setConfirmDialog({ open: false, mode: null });
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex rounded-lg border p-1">
          {OPERATING_MODES.map((mode) => (
            <TooltipProvider key={mode.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={autopilotSettings.operatingMode === mode.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleModeChange(mode.id)}
                    className={cn(
                      "gap-2",
                      autopilotSettings.operatingMode === mode.id && mode.id === "autopilot" && "bg-green-600 hover:bg-green-700"
                    )}
                  >
                    {mode.id === "manual" && <Users className="h-4 w-4" />}
                    {mode.id === "approval" && <CheckCircle2 className="h-4 w-4" />}
                    {mode.id === "autopilot" && <Bot className="h-4 w-4" />}
                    {mode.label}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{mode.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {autopilotSettings.operatingMode !== "manual" && (
          <div className="flex items-center gap-2">
            {autopilotSettings.isPaused ? (
              <Button variant="outline" size="sm" onClick={resumeAutopilot} className="gap-2">
                <Play className="h-4 w-4" />
                Resume
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => pauseAutopilot()} className="gap-2">
                <Pause className="h-4 w-4" />
                Pause
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={emergencyStop} className="gap-2">
              <Square className="h-4 w-4" />
              Emergency Stop
            </Button>
          </div>
        )}
      </div>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, mode: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5 text-yellow-500" />
              Enable Autopilot Mode?
            </DialogTitle>
            <DialogDescription>
              In Autopilot Mode, posts will be published automatically without requiring your approval.
              You can still cancel posts during the approval window.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertTitle>What happens in Autopilot Mode</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>AI generates and schedules posts automatically</li>
                  <li>Posts publish on schedule unless you deny them</li>
                  <li>You receive notifications before each post</li>
                  <li>You can pause or stop anytime</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, mode: null })}>
              Cancel
            </Button>
            <Button onClick={confirmAutopilot} className="bg-green-600 hover:bg-green-700">
              Enable Autopilot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Autopilot Dashboard View
function AutopilotView() {
  const {
    currentOrganization,
    scheduledSlots,
    weeklySchedule,
    lockWeek,
    unlockWeek,
    regenerateSchedule,
    brandProfile,
    autopilotNotifications,
    isAutopilotRunning,
    activeBrandId,
  } = useAppStore();

  // Use API hooks for autopilot settings
  const organizationId = currentOrganization?.id || 'org1';
  const { data: autopilotSettings, isLoading: settingsLoading } = useAutopilotSettings(organizationId);
  const updateAutopilotSettingsMutation = useUpdateAutopilotSettings(organizationId);

  // Use settings from API or fallback to store for immediate UI updates
  const effectiveSettings = autopilotSettings || useAppStore.getState().autopilotSettings;

  const handleUpdateAutopilotSettings = React.useCallback((updates: Partial<typeof effectiveSettings>) => {
    updateAutopilotSettingsMutation.mutate(updates);
  }, [updateAutopilotSettingsMutation, effectiveSettings]);

  // Load brief (brand-scoped)
  const { data: briefData, isLoading: briefLoading } = useAutopilotBrief();
  const { data: brandsData } = useBrands();
  const { data: currentBrand } = useCurrentBrand();
  const [showEditForm, setShowEditForm] = React.useState(false);
  const hasBrief = briefData && briefData.brandName && briefData.brandName.trim() !== '';
  const isAllMode = activeBrandId === 'all';
  const brands = brandsData?.brands || [];
  const currentBrandData = isAllMode 
    ? { id: 'all', name: 'All Brands' }
    : (currentBrand || brands.find(b => b.id === activeBrandId) || null);

  const pendingApprovals = scheduledSlots.filter((s) => s.status === "pending_approval").length;
  const approvedPosts = scheduledSlots.filter((s) => s.status === "approved").length;
  const nextPost = scheduledSlots
    .filter((s) => s.status === "approved" || s.status === "pending_approval")
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())[0];

  // In "See All" mode, show brand list with completion status
  if (isAllMode) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Autopilot Control Center
          </h1>
          <p className="text-muted-foreground">Select a brand to view or configure Autopilot</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>All Brands View</AlertTitle>
          <AlertDescription>
            Please select a specific brand to set up or manage Autopilot. Each brand has its own Autopilot configuration.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Brand Autopilot Status</CardTitle>
            <CardDescription>Setup completion status for each brand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {brand.avatarUrl ? (
                          <img src={brand.avatarUrl} alt={brand.name} className="h-full w-full object-cover" />
                        ) : (
                          brand.name.charAt(0).toUpperCase()
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{brand.name}</p>
                      <p className="text-sm text-muted-foreground">Autopilot status</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Not Configured</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        useAppStore.getState().setActiveBrandId(brand.id);
                        useAppStore.getState().setActiveView('dashboard');
                      }}
                    >
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Mode Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Autopilot Control Center
          </h1>
          <p className="text-muted-foreground">Manage your AI-powered social media automation</p>
        </div>
        <OperatingModeSelector />
      </div>

      {/* Autopilot Brief Onboarding */}
      {!hasBrief && !briefLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Set up Autopilot</CardTitle>
            <CardDescription>Configure your brand profile to enable AI-powered content generation</CardDescription>
          </CardHeader>
          <CardContent>
            <AutopilotQuestionnaire />
          </CardContent>
        </Card>
      )}

      {hasBrief && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Autopilot Brief</CardTitle>
                  <CardDescription>{briefData.brandName} • {briefData.industry}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowEditForm(!showEditForm)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  {showEditForm ? 'Hide Edit' : 'Edit Brief'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AutopilotBriefSummary brief={briefData} />
            </CardContent>
          </Card>
          {showEditForm && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Autopilot Brief</CardTitle>
              </CardHeader>
              <CardContent>
                <AutopilotBriefForm />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Status Banner */}
      {effectiveSettings.isPaused && (
        <Alert variant="destructive">
          <Pause className="h-4 w-4" />
          <AlertTitle>Autopilot is Paused</AlertTitle>
          <AlertDescription>
            {effectiveSettings.pauseReason || "No new posts will be generated or published until resumed."}
          </AlertDescription>
        </Alert>
      )}

      {!brandProfile && (
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertTitle>Brand Profile Required</AlertTitle>
          <AlertDescription>
            Set up your brand profile to enable AI content generation.
            <Button variant="link" className="px-2" onClick={() => useAppStore.getState().setActiveView("brand")}>
              Set up now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Zap className={cn("h-4 w-4", isAutopilotRunning && !effectiveSettings.isPaused ? "text-green-500" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectiveSettings.isPaused ? "Paused" : effectiveSettings.operatingMode === "manual" ? "Manual" : "Active"}
            </div>
            <p className="text-xs text-muted-foreground">
              {OPERATING_MODES.find((m) => m.id === effectiveSettings.operatingMode)?.label}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              {approvedPosts} approved, ready to post
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextPost ? formatDistanceToNow(nextPost.scheduledTime, { addSuffix: true }) : "None"}
            </div>
            {nextPost && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <PlatformIcon platform={nextPost.platform} className="h-3 w-3" />
                {format(nextPost.scheduledTime, "MMM d, h:mm a")}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledSlots.length}</div>
            <p className="text-xs text-muted-foreground">Posts in queue</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Controls */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  {weeklySchedule && `${format(weeklySchedule.weekStart, "MMM d")} - ${format(weeklySchedule.weekEnd, "MMM d, yyyy")}`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {weeklySchedule?.isLocked ? (
                  <Button variant="outline" size="sm" onClick={unlockWeek} className="gap-2">
                    <Unlock className="h-4 w-4" />
                    Unlock
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={lockWeek} className="gap-2">
                    <Lock className="h-4 w-4" />
                    Lock Week
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={regenerateSchedule} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledSlots.slice(0, 5).map((slot) => (
                <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      slot.platform === "facebook" && "bg-blue-600/10",
                      slot.platform === "instagram" && "bg-pink-500/10",
                      slot.platform === "linkedin" && "bg-blue-700/10",
                      slot.platform === "tiktok" && "bg-gray-900/10",
                      slot.platform === "pinterest" && "bg-red-600/10",
                      slot.platform === "reddit" && "bg-orange-500/10",
                      slot.platform === "slack" && "bg-purple-600/10",
                      slot.platform === "notion" && "bg-gray-900/10"
                    )}>
                      <PlatformIcon platform={slot.platform} className={cn(
                        "h-4 w-4",
                        slot.platform === "facebook" && "text-blue-600",
                        slot.platform === "instagram" && "text-pink-500",
                        slot.platform === "linkedin" && "text-blue-700",
                        slot.platform === "tiktok" && "text-gray-900",
                        slot.platform === "pinterest" && "text-red-600",
                        slot.platform === "reddit" && "text-orange-500",
                        slot.platform === "slack" && "text-purple-600",
                        slot.platform === "notion" && "text-gray-900"
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{slot.primaryCaption || "Pending generation..."}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(slot.scheduledTime, "EEE, MMM d 'at' h:mm a")} • {slot.contentPillar}
                      </p>
                    </div>
                  </div>
                  <SlotStatusBadge status={slot.status} />
                </div>
              ))}
              {scheduledSlots.length > 5 && (
                <Button variant="ghost" className="w-full" onClick={() => useAppStore.getState().setActiveView("queue")}>
                  View all {scheduledSlots.length} posts in queue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Autopilot Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Approval Window</Label>
              <Select
                value={effectiveSettings.approvalWindow}
                onValueChange={(v) => handleUpdateAutopilotSettings({ approvalWindow: v as typeof effectiveSettings.approvalWindow })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPROVAL_WINDOWS.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Time before scheduled post to send approval request</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Web Research</p>
                  <p className="text-xs text-muted-foreground">Find trends & hashtags</p>
                </div>
                <Switch
                  checked={effectiveSettings.enableWebResearch}
                  onCheckedChange={(checked) => handleUpdateAutopilotSettings({ enableWebResearch: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Image Generation</p>
                  <p className="text-xs text-muted-foreground">AI-generated visuals</p>
                </div>
                <Switch
                  checked={effectiveSettings.enableImageGeneration}
                  onCheckedChange={(checked) => handleUpdateAutopilotSettings({ enableImageGeneration: checked })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Platform Cadence (posts/week)</Label>
              {PLATFORMS.filter((platform) => platform.id !== "slack" && platform.id !== "notion").map((platform) => (
                <div key={platform.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={platform.id} className="h-4 w-4" />
                    <span className="text-sm">{platform.label}</span>
                  </div>
                  <Input
                    type="number"
                    className="w-16 h-8 text-center"
                    value={effectiveSettings.platformCadence[platform.id]}
                    onChange={(e) => handleUpdateAutopilotSettings({
                      platformCadence: {
                        ...effectiveSettings.platformCadence,
                        [platform.id]: Number.parseInt(e.target.value) || 0,
                      },
                    })}
                    min={0}
                    max={21}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>Create events and generate scheduled draft posts</CardDescription>
        </CardHeader>
        <CardContent>
          <EventsPanel />
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => useAppStore.getState().setActiveView("notifications")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {autopilotNotifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    notif.type === "pending_approval" && "bg-yellow-500/10",
                    notif.type === "published" && "bg-green-500/10",
                    notif.type === "failed" && "bg-red-500/10"
                  )}>
                    {notif.type === "pending_approval" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                    {notif.type === "published" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {notif.type === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                    {notif.type === "reminder" && <Bell className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-1">{notif.caption}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {!notif.isActioned && notif.type === "pending_approval" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => useAppStore.getState().approveSlot(notif.slotId)}>
                      <ThumbsUp className="h-3 w-3" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => useAppStore.getState().denySlot(notif.slotId)}>
                      <ThumbsDown className="h-3 w-3" />
                      Deny
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Events Panel Component
function EventsPanel() {
  const [title, setTitle] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [postWhen, setPostWhen] = React.useState<'same-day' | 'next-day'>('next-day');
  const [notes, setNotes] = React.useState("");
  const [selectedAssetIds, setSelectedAssetIds] = React.useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);

  const { data: assetsData } = useAssets();
  const { data: eventsData } = useEvents();
  const createEvent = useCreateEvent();
  const generateDrafts = useGenerateEventDrafts();

  const assets = assetsData?.assets || [];
  const events = eventsData?.events || [];

  const handleCreateEvent = async () => {
    if (!title.trim() || !eventDate) {
      toast.error("Please enter a title and event date");
      return;
    }

    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        eventDate,
        postWhen,
        notes: notes.trim() || undefined,
        assetIds: selectedAssetIds,
      });
      toast.success("Event created!");
      setTitle("");
      setEventDate("");
      setPostWhen('next-day');
      setNotes("");
      setSelectedAssetIds([]);
      setIsFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create event");
    }
  };

  const handleGenerateDrafts = async (eventId: string) => {
    try {
      const result = await generateDrafts.mutateAsync(eventId);
      toast.success(`Generated ${result.count} draft posts!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate drafts");
    }
  };

  return (
    <div className="space-y-4">
      {!isFormOpen ? (
        <Button onClick={() => setIsFormOpen(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      ) : (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input
              placeholder="e.g., Visiting BJJ gym class"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Event Date</Label>
            <Input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <div className="space-y-2">
            <Label>Post When</Label>
            <Select value={postWhen} onValueChange={(v) => setPostWhen(v as 'same-day' | 'next-day')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="same-day">Same Day (9 AM)</SelectItem>
                <SelectItem value="next-day">Next Day (9 AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional details about the event..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {assets.length > 0 && (
            <div className="space-y-2">
              <Label>Assets (Optional)</Label>
              <ScrollArea className="h-32 border rounded p-2">
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedAssetIds.includes(asset.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAssetIds([...selectedAssetIds, asset.id]);
                          } else {
                            setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id));
                          }
                        }}
                      />
                      <span className="text-sm">{asset.type} - {asset.url ? 'Has URL' : 'No URL'}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCreateEvent} disabled={createEvent.isPending}>
              {createEvent.isPending ? "Creating..." : "Create Event"}
            </Button>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-2">
          <Label>Recent Events</Label>
          <div className="space-y-2">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.eventDate), "MMM d, yyyy")} • Post {event.postWhen === 'same-day' ? 'same day' : 'next day'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleGenerateDrafts(event.id)}
                  disabled={generateDrafts.isPending}
                >
                  {generateDrafts.isPending ? "Generating..." : "Generate Drafts"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Autopilot Questionnaire Component (Step-based AI interview)
function AutopilotQuestionnaire() {
  const { data: existingBrief } = useAutopilotBrief();
  const updateBrief = useUpdateAutopilotBrief();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [brief, setBrief] = React.useState<Partial<AutopilotBrief>>({
    brandName: existingBrief?.brandName || '',
    subjectType: existingBrief?.subjectType || 'business',
    industry: existingBrief?.industry || '',
    primaryGoal: existingBrief?.primaryGoal || 'brand_awareness',
    secondaryGoals: existingBrief?.secondaryGoals || [],
    targetAudience: existingBrief?.targetAudience || '',
    offer: existingBrief?.offer || '',
    location: existingBrief?.location || '',
    platforms: existingBrief?.platforms || [],
    voice: existingBrief?.voice || { tone: '' },
    brandAssets: existingBrief?.brandAssets || {},
    constraints: existingBrief?.constraints || {},
    successMetrics: existingBrief?.successMetrics || [],
  });

  const totalSteps = 6;

  const steps = [
    {
      question: "What's your brand or business name?",
      field: 'brandName',
      placeholder: "e.g., Kinetic Grappling, TechFlow Solutions",
      type: 'text' as const,
    },
    {
      question: "What industry or niche are you in?",
      field: 'industry',
      placeholder: "e.g., BJJ gym, real estate, SaaS, restaurant",
      type: 'text' as const,
    },
    {
      question: "What's your primary goal with social media?",
      field: 'primaryGoal',
      placeholder: "Select your main objective",
      type: 'select' as const,
      options: [
        { value: 'brand_awareness', label: 'Brand Awareness' },
        { value: 'leads', label: 'Generate Leads' },
        { value: 'sales', label: 'Drive Sales' },
        { value: 'community', label: 'Build Community' },
        { value: 'traffic', label: 'Drive Website Traffic' },
        { value: 'bookings', label: 'Get Bookings/Appointments' },
      ],
    },
    {
      question: "Who is your target audience?",
      field: 'targetAudience',
      placeholder: "Describe your ideal customer or follower in a few sentences",
      type: 'textarea' as const,
    },
    {
      question: "What's your main offer or call-to-action?",
      field: 'offer',
      placeholder: "What do you want people to do? (e.g., 'Book a free trial', 'Download our app', 'Visit our gym')",
      type: 'textarea' as const,
    },
    {
      question: "What tone should your content have?",
      field: 'voice',
      placeholder: "e.g., professional, friendly, funny, inspirational",
      type: 'tone' as const,
    },
  ];

  const currentStepData = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    try {
      await updateBrief.mutateAsync(brief);
      toast.success("Autopilot setup complete! Generating your strategy plan...");
      // Optionally generate plan automatically
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save brief");
    }
  };

  const updateField = (field: string, value: any) => {
    if (field === 'voice') {
      setBrief({ ...brief, voice: { ...brief.voice, tone: value } });
    } else {
      setBrief({ ...brief, [field]: value });
    }
  };

  const getFieldValue = (field: string) => {
    if (field === 'voice') {
      return brief.voice?.tone || '';
    }
    return (brief as any)[field] || '';
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Step {currentStep} of {totalSteps}</span>
          <span className="text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentStepData.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStepData.type === 'text' && (
            <Input
              value={getFieldValue(currentStepData.field)}
              onChange={(e) => updateField(currentStepData.field, e.target.value)}
              placeholder={currentStepData.placeholder}
              className="text-lg"
            />
          )}
          {currentStepData.type === 'textarea' && (
            <Textarea
              value={getFieldValue(currentStepData.field)}
              onChange={(e) => updateField(currentStepData.field, e.target.value)}
              placeholder={currentStepData.placeholder}
              rows={4}
              className="text-lg"
            />
          )}
          {currentStepData.type === 'select' && (
            <Select
              value={getFieldValue(currentStepData.field)}
              onValueChange={(v) => updateField(currentStepData.field, v)}
            >
              <SelectTrigger className="text-lg">
                <SelectValue placeholder={currentStepData.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {currentStepData.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {currentStepData.type === 'tone' && (
            <div className="space-y-2">
              <Input
                value={getFieldValue(currentStepData.field)}
                onChange={(e) => updateField(currentStepData.field, e.target.value)}
                placeholder={currentStepData.placeholder}
                className="text-lg"
              />
              <p className="text-sm text-muted-foreground">
                Examples: Professional, Friendly, Funny, Inspirational, Casual, Authoritative
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!getFieldValue(currentStepData.field)}
          >
            {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            {currentStep < totalSteps && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Autopilot Brief Form Component
function AutopilotBriefForm() {
  const { data: existingBrief } = useAutopilotBrief();
  const updateBrief = useUpdateAutopilotBrief();
  const generatePlan = useGenerateStrategyPlan();
  const [planData, setPlanData] = React.useState<StrategyPlan | null>(null);

  const [brief, setBrief] = React.useState<Partial<AutopilotBrief>>({
    brandName: existingBrief?.brandName || '',
    subjectType: existingBrief?.subjectType || 'business',
    industry: existingBrief?.industry || '',
    primaryGoal: existingBrief?.primaryGoal || 'brand_awareness',
    secondaryGoals: existingBrief?.secondaryGoals || [],
    targetAudience: existingBrief?.targetAudience || '',
    offer: existingBrief?.offer || '',
    location: existingBrief?.location || '',
    platforms: existingBrief?.platforms || [],
    voice: existingBrief?.voice || { tone: '' },
    brandAssets: existingBrief?.brandAssets || {},
    constraints: existingBrief?.constraints || {},
    successMetrics: existingBrief?.successMetrics || [],
  });

  const [strategyPlan, setStrategyPlan] = React.useState<StrategyPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = React.useState(false);

  const handleSave = async () => {
    try {
      await updateBrief.mutateAsync(brief);
      toast.success("Brief saved successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save brief");
    }
  };

  const handleGeneratePlan = async () => {
    if (!brief.brandName || !brief.industry) {
      toast.error("Please fill in brand name and industry first");
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const plan = await generatePlan.mutateAsync();
      setStrategyPlan(plan);
      toast.success("Strategy plan generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const addPlatform = () => {
    setBrief({
      ...brief,
      platforms: [
        ...(brief.platforms || []),
        { platform: 'instagram', priority: 2, postingCadencePerWeek: 3 },
      ],
    });
  };

  const updatePlatform = (index: number, updates: Partial<PlatformConfig>) => {
    const platforms = [...(brief.platforms || [])];
    platforms[index] = { ...platforms[index], ...updates };
    setBrief({ ...brief, platforms });
  };

  const removePlatform = (index: number) => {
    const platforms = [...(brief.platforms || [])];
    platforms.splice(index, 1);
    setBrief({ ...brief, platforms });
  };

  return (
    <div id="autopilot-brief-edit-form" className="space-y-6">
      {/* Section 1: Business/Creator Basics */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Business/Creator Basics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input
              value={brief.brandName}
              onChange={(e) => setBrief({ ...brief, brandName: e.target.value })}
              placeholder="Your brand or name"
            />
          </div>
          <div className="space-y-2">
            <Label>Subject Type</Label>
            <Select
              value={brief.subjectType}
              onValueChange={(v) => setBrief({ ...brief, subjectType: v as SubjectType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Industry</Label>
            <Input
              value={brief.industry}
              onChange={(e) => setBrief({ ...brief, industry: e.target.value })}
              placeholder="e.g., BJJ gym, realtor, restaurant"
            />
          </div>
          <div className="space-y-2">
            <Label>Location (Optional)</Label>
            <Input
              value={brief.location || ''}
              onChange={(e) => setBrief({ ...brief, location: e.target.value })}
              placeholder="City, State"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Goals + Offer */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Goals + Offer</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Goal</Label>
            <Select
              value={brief.primaryGoal}
              onValueChange={(v) => setBrief({ ...brief, primaryGoal: v as PrimaryGoal })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="traffic">Traffic</SelectItem>
                <SelectItem value="bookings">Bookings</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Offer</Label>
            <Textarea
              value={brief.offer}
              onChange={(e) => setBrief({ ...brief, offer: e.target.value })}
              placeholder="What do you want people to do/buy/book?"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Audience + Location */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Audience</h3>
        <div className="space-y-2">
          <Label>Target Audience</Label>
          <Textarea
            value={brief.targetAudience}
            onChange={(e) => setBrief({ ...brief, targetAudience: e.target.value })}
            placeholder="Describe your target audience in a short paragraph"
            rows={3}
          />
        </div>
      </div>

      {/* Section 4: Platforms + Cadence */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Platforms + Cadence</h3>
          <Button variant="outline" size="sm" onClick={addPlatform}>
            <Plus className="h-4 w-4 mr-2" />
            Add Platform
          </Button>
        </div>
        <div className="space-y-3">
          {brief.platforms?.map((platform, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <Select
                value={platform.platform}
                onValueChange={(v) => updatePlatform(index, { platform: v as PlatformConfig['platform'] })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                  <SelectItem value="pinterest">Pinterest</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={String(platform.priority)}
                onValueChange={(v) => updatePlatform(index, { priority: Number(v) as 1 | 2 | 3 })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Priority 1</SelectItem>
                  <SelectItem value="2">Priority 2</SelectItem>
                  <SelectItem value="3">Priority 3</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                className="w-24"
                value={platform.postingCadencePerWeek}
                onChange={(e) => updatePlatform(index, { postingCadencePerWeek: Number(e.target.value) || 0 })}
                placeholder="Posts/week"
                min={0}
                max={21}
              />
              <Button variant="ghost" size="icon" onClick={() => removePlatform(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(!brief.platforms || brief.platforms.length === 0) && (
            <p className="text-sm text-muted-foreground">No platforms added yet. Click "Add Platform" to get started.</p>
          )}
        </div>
      </div>

      {/* Section 5: Voice + Constraints */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold">Voice + Constraints</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tone</Label>
            <Input
              value={brief.voice?.tone || ''}
              onChange={(e) => setBrief({ ...brief, voice: { ...brief.voice, tone: e.target.value } })}
              placeholder="e.g., confident, friendly, funny"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Do Say (Optional)</Label>
              <Textarea
                value={brief.voice?.doSay?.join(', ') || ''}
                onChange={(e) => setBrief({
                  ...brief,
                  voice: { 
                    tone: brief.voice?.tone || '',
                    doSay: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    dontSay: brief.voice?.dontSay || [],
                  },
                })}
                placeholder="Keywords/phrases to use"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Don't Say (Optional)</Label>
              <Textarea
                value={brief.voice?.dontSay?.join(', ') || ''}
                onChange={(e) => setBrief({
                  ...brief,
                  voice: { 
                    tone: brief.voice?.tone || '',
                    doSay: brief.voice?.doSay || [],
                    dontSay: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                  },
                })}
                placeholder="Words/topics to avoid"
                rows={2}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Compliance Notes (Optional)</Label>
            <Textarea
              value={brief.constraints?.complianceNotes || ''}
              onChange={(e) => setBrief({
                ...brief,
                constraints: { ...brief.constraints, complianceNotes: e.target.value },
              })}
              placeholder="Any compliance requirements"
              rows={2}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={brief.constraints?.noFaceKids || false}
                onCheckedChange={(checked) => setBrief({
                  ...brief,
                  constraints: { ...brief.constraints, noFaceKids: checked === true },
                })}
              />
              <Label className="text-sm">No faces of kids</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={brief.constraints?.noClientNames || false}
                onCheckedChange={(checked) => setBrief({
                  ...brief,
                  constraints: { ...brief.constraints, noClientNames: checked === true },
                })}
              />
              <Label className="text-sm">No client names</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={updateBrief.isPending}>
          {updateBrief.isPending ? "Saving..." : "Save Brief"}
        </Button>
        <Button
          variant="outline"
          onClick={handleGeneratePlan}
          disabled={isGeneratingPlan || !brief.brandName || !brief.industry}
        >
          {isGeneratingPlan ? "Generating..." : "Generate Plan"}
        </Button>
      </div>

      {/* Strategy Plan Display */}
      {strategyPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Strategy Plan</CardTitle>
            <CardDescription>Generated from your brief</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Content Pillars</h4>
              <div className="space-y-2">
                {strategyPlan.contentPillars.map((pillar, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <p className="font-medium">{pillar.name}</p>
                    <p className="text-sm text-muted-foreground">{pillar.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pillar.examples.map((ex, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">{ex}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Weekly Cadence</h4>
              <div className="space-y-2">
                {strategyPlan.weeklyCadence.map((cadence, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-medium">{cadence.platform}</span>
                    <span className="text-sm text-muted-foreground">
                      {cadence.postsPerWeek} posts/week • {cadence.postTypes.join(', ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">CTA Guidance</h4>
              <p className="text-sm">{strategyPlan.ctaGuidance}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">30-Day Starter Plan (First 10)</h4>
              <ScrollArea className="h-64 border rounded p-2">
                <div className="space-y-2">
                  {strategyPlan.thirtyDayStarterPlan.slice(0, 10).map((item, i) => (
                    <div key={i} className="p-2 border rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{format(new Date(item.date), "MMM d")}</span>
                        <Badge variant="outline">{item.platform}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">{item.postIdea}</p>
                      {item.assetSuggestion && (
                        <p className="text-xs text-muted-foreground mt-1">Asset: {item.assetSuggestion}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Autopilot Brief Summary Component
function AutopilotBriefSummary({ brief }: { brief: AutopilotBrief }) {
  const generatePlan = useGenerateStrategyPlan();
  const generateAutopilot = useAutopilotGenerate();
  const createPost = useCreatePost();
  const { activeBrandId } = useAppStore();
  const isAllMode = activeBrandId === 'all';
  const [strategyPlan, setStrategyPlan] = React.useState<StrategyPlan | null>(null);
  const [autopilotOutputs, setAutopilotOutputs] = React.useState<AutopilotGenerateResponse | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const plan = await generatePlan.mutateAsync();
      setStrategyPlan(plan);
      toast.success("Strategy plan generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleGenerateNextWeek = async () => {
    if (isAllMode) {
      toast.error("Please select a specific brand to generate Autopilot outputs");
      return;
    }
    
    setIsGenerating(true);
    try {
      const from = new Date().toISOString().split('T')[0];
      const to = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const outputs = await generateAutopilot.mutateAsync({ from, to });
      setAutopilotOutputs(outputs);
      toast.success("Autopilot outputs generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate outputs");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendDraftToQueue = async (draft: AutopilotDraftPost) => {
    if (isAllMode) {
      toast.error("Please select a specific brand to send drafts");
      return;
    }
    
    try {
      await createPost.mutateAsync({
        content: draft.caption,
        platform: draft.platform,
        status: 'draft',
        hashtags: draft.hashtags,
        authorId: 'user1',
      });
      toast.success(`Draft sent to Queue for ${draft.platform}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send draft");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Industry:</span> {brief.industry}
        </div>
        <div>
          <span className="text-muted-foreground">Primary Goal:</span> {brief.primaryGoal.replace('_', ' ')}
        </div>
        <div>
          <span className="text-muted-foreground">Platforms:</span> {brief.platforms.length}
        </div>
        <div>
          <span className="text-muted-foreground">Tone:</span> {brief.voice.tone || 'Not set'}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan}>
          {isGeneratingPlan ? "Generating..." : "Generate Plan"}
        </Button>
        <Button onClick={handleGenerateNextWeek} disabled={isGenerating || isAllMode} variant="default">
          {isGenerating ? "Generating..." : "Generate Next Week"}
        </Button>
      </div>

      {autopilotOutputs && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {/* Plan Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Summary</CardTitle>
              <Badge variant="outline" className="mt-2">Platform rules applied</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm">{autopilotOutputs.plan.overview}</p>
              <div>
                <h4 className="font-semibold text-sm mb-2">Content Pillars</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {autopilotOutputs.plan.pillars.map((pillar, i) => (
                    <li key={i}>{pillar}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Cadence</h4>
                {autopilotOutputs.plan.cadence.map((cad, i) => (
                  <div key={i} className="text-sm">
                    <PlatformIcon platform={cad.platform} className="h-3 w-3 inline mr-1" />
                    {cad.platform}: {cad.postsPerWeek} posts/week
                    {cad.notes && <span className="text-muted-foreground"> • {cad.notes}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drafts List */}
          <Card>
            <CardHeader>
              <CardTitle>Draft Posts</CardTitle>
              <CardDescription>{autopilotOutputs.drafts.length} drafts generated</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {autopilotOutputs.drafts.map((draft) => (
                    <div key={draft.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={draft.platform} className="h-4 w-4" />
                          <Badge variant="outline">{draft.platform}</Badge>
                          <Badge variant="secondary" className="text-xs">Platform rules applied</Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendDraftToQueue(draft)}
                          disabled={isAllMode}
                        >
                          Send to Queue
                        </Button>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{draft.caption}</p>
                      {draft.hashtags && draft.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {draft.hashtags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                      {draft.notes && (
                        <p className="text-xs text-muted-foreground">{draft.notes}</p>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Length: {draft.caption.length} chars
                        {draft.caption.length <= 280 && draft.caption.length > 200 && ` (short format)`}
                        {draft.platform === 'linkedin' && ` (recommended 300-1300)`}
                        {draft.platform === 'instagram' && ` (recommended 80-400)`}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {strategyPlan && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Strategy Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Content Pillars</h4>
              <div className="space-y-2">
                {strategyPlan.contentPillars.map((pillar, i) => (
                  <div key={i} className="p-2 border rounded text-sm">
                    <p className="font-medium">{pillar.name}</p>
                    <p className="text-muted-foreground">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Weekly Cadence</h4>
              {strategyPlan.weeklyCadence.map((cadence, i) => (
                <div key={i} className="text-sm">
                  {cadence.platform}: {cadence.postsPerWeek} posts/week
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Brand Switcher Component
function BrandSwitcher() {
  const { data: brandsData, isLoading } = useBrands();
  const { activeBrandId, setActiveBrandId, setActiveView } = useAppStore();
  const queryClient = useQueryClient();

  const brands = brandsData?.brands || [];
  const isAllMode = activeBrandId === 'all';
  
  // Get current brand from store/localStorage
  const brand = isAllMode 
    ? { id: 'all', name: 'All Brands', avatarUrl: undefined } 
    : brands.find(b => b.id === activeBrandId) || brands[0] || null;

  const handleSwitchBrand = async (brandId: string | 'all') => {
    try {
      // Update Zustand store (which persists to localStorage)
      setActiveBrandId(brandId);
      
      // Invalidate all queries to refresh data for new brand
      await queryClient.invalidateQueries();
      
      // Always navigate to Dashboard on brand switch
      setActiveView('dashboard');
      
      const brandName = brandId === 'all' ? 'All Brands' : brands.find(b => b.id === brandId)?.name || 'brand';
      toast.success(`Switched to ${brandName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to switch brand");
    }
  };

  if (isLoading && !isAllMode && !brand) {
    return (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">
              {isAllMode ? (
                <Layers className="h-4 w-4" />
              ) : brand?.avatarUrl ? (
                <img src={brand.avatarUrl} alt={brand.name} className="h-full w-full object-cover" />
              ) : (
                brand?.name?.charAt(0).toUpperCase() || '?'
              )}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{brand?.name || 'Loading...'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="p-2 border-b">
          <p className="text-xs text-muted-foreground mb-1">Active Brand</p>
          <p className="text-sm font-medium">{brand?.name || 'Loading...'}</p>
        </div>
        <ScrollArea className="max-h-64">
          {/* "See All" option */}
          <DropdownMenuItem
            onClick={() => handleSwitchBrand('all')}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              isAllMode && "bg-muted"
            )}
          >
            <Layers className="h-4 w-4" />
            <span className="flex-1">See All</span>
            {isAllMode && <CheckCircle2 className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Individual brands */}
          {brands.slice(0, 6).map((b) => (
            <DropdownMenuItem
              key={b.id}
              onClick={() => handleSwitchBrand(b.id)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                !isAllMode && activeBrandId === b.id && "bg-muted"
              )}
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {b.avatarUrl ? (
                    <img src={b.avatarUrl} alt={b.name} className="h-full w-full object-cover" />
                  ) : (
                    b.name.charAt(0).toUpperCase()
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1">{b.name}</span>
              {!isAllMode && activeBrandId === b.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setActiveView("settings")}
          className="cursor-pointer"
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Brands
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Brands Settings View
// Business Schedule Settings View
function BusinessScheduleSettingsView() {
  const { data: templatesData } = useScheduleTemplates();
  const createTemplate = useCreateScheduleTemplate();
  const updateTemplate = useUpdateScheduleTemplate();
  const deleteTemplate = useDeleteScheduleTemplate();

  const templates = templatesData?.templates || [];
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newTemplate, setNewTemplate] = React.useState({
    title: '',
    daysOfWeek: [] as number[],
    startTime: '09:00',
    durationMinutes: 60,
    location: '',
    notes: '',
  });

  const daysOfWeekOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  const handleCreate = async () => {
    if (!newTemplate.title.trim() || newTemplate.daysOfWeek.length === 0) {
      toast.error('Title and at least one day of week are required');
      return;
    }

    try {
      await createTemplate.mutateAsync(newTemplate);
      toast.success('Schedule template created!');
      setNewTemplate({
        title: '',
        daysOfWeek: [],
        startTime: '09:00',
        durationMinutes: 60,
        location: '',
        notes: '',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create template');
    }
  };

  const handleUpdate = async (id: string, updates: Partial<typeof newTemplate>) => {
    try {
      await updateTemplate.mutateAsync({ id, updates });
      toast.success('Template updated!');
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule template?')) {
      return;
    }

    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Template deleted!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Schedule Template</CardTitle>
          <CardDescription>
            Create recurring business events (e.g., gym classes) that will appear in your calendar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="e.g., Kids Class"
              value={newTemplate.title}
              onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Days of Week</Label>
            <div className="grid grid-cols-4 gap-2">
              {daysOfWeekOptions.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    checked={newTemplate.daysOfWeek.includes(day.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewTemplate({
                          ...newTemplate,
                          daysOfWeek: [...newTemplate.daysOfWeek, day.value],
                        });
                      } else {
                        setNewTemplate({
                          ...newTemplate,
                          daysOfWeek: newTemplate.daysOfWeek.filter(d => d !== day.value),
                        });
                      }
                    }}
                  />
                  <Label className="text-sm font-normal">{day.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={newTemplate.startTime}
                onChange={(e) => setNewTemplate({ ...newTemplate, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={newTemplate.durationMinutes}
                onChange={(e) => setNewTemplate({ ...newTemplate, durationMinutes: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location (Optional)</Label>
            <Input
              placeholder="e.g., Main Studio"
              value={newTemplate.location}
              onChange={(e) => setNewTemplate({ ...newTemplate, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Additional notes about this event"
              value={newTemplate.notes}
              onChange={(e) => setNewTemplate({ ...newTemplate, notes: e.target.value })}
              rows={2}
            />
          </div>

          <Button onClick={handleCreate} disabled={createTemplate.isPending}>
            {createTemplate.isPending ? 'Creating...' : 'Create Template'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Templates</CardTitle>
          <CardDescription>Manage your recurring business events</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No schedule templates"
              description="Create a template to add recurring events to your calendar"
            />
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="p-4 border rounded-lg">
                  {editingId === template.id ? (
                    <EditTemplateForm
                      template={template}
                      onSave={(updates) => handleUpdate(template.id, updates)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{template.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.daysOfWeek
                              .sort()
                              .map(d => daysOfWeekOptions[d].label)
                              .join(', ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {template.startTime} ({template.durationMinutes} min)
                            {template.location && ` • ${template.location}`}
                          </p>
                          {template.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{template.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(template.id)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Edit Template Form Component
function EditTemplateForm({
  template,
  onSave,
  onCancel,
}: {
  template: any;
  onSave: (updates: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState({
    title: template.title,
    daysOfWeek: template.daysOfWeek,
    startTime: template.startTime,
    durationMinutes: template.durationMinutes,
    location: template.location || '',
    notes: template.notes || '',
  });

  const daysOfWeekOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Days of Week</Label>
        <div className="grid grid-cols-4 gap-2">
          {daysOfWeekOptions.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                checked={formData.daysOfWeek.includes(day.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData({
                      ...formData,
                      daysOfWeek: [...formData.daysOfWeek, day.value],
                    });
                  } else {
                    setFormData({
                      ...formData,
                      daysOfWeek: formData.daysOfWeek.filter((d: number) => d !== day.value),
                    });
                  }
                }}
              />
              <Label className="text-sm font-normal">{day.label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            min="15"
            step="15"
            value={formData.durationMinutes}
            onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location (Optional)</Label>
        <Input
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Notes (Optional)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => onSave(formData)}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function BrandsSettingsView() {
  const { data: brandsData } = useBrands();
  const { activeBrandId, setActiveBrandId, setActiveView } = useAppStore();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const uploadAvatar = useUploadBrandAvatar();
  const deleteAvatar = useDeleteBrandAvatar();
  const queryClient = useQueryClient();

  const brands = brandsData?.brands || [];
  const maxBrands = 6;
  const canCreateMore = brands.length < maxBrands;
  const [editingBrandId, setEditingBrandId] = React.useState<string | null>(null);
  const [editingBrandName, setEditingBrandName] = React.useState("");
  const [editingBrandAvatarUrl, setEditingBrandAvatarUrl] = React.useState("");
  const [newBrandName, setNewBrandName] = React.useState("");
  const [newBrandAvatarUrl, setNewBrandAvatarUrl] = React.useState("");
  const [newBrandUploadedFiles, setNewBrandUploadedFiles] = React.useState<UploadedItem[]>([]);
  const [editingBrandUploadedFiles, setEditingBrandUploadedFiles] = React.useState<Record<string, UploadedItem[]>>({});

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error("Brand name is required");
      return;
    }

    if (brands.length >= maxBrands) {
      toast.error(`Maximum of ${maxBrands} brands allowed`);
      return;
    }

    try {
      // Create brand first
      const brand = await createBrand.mutateAsync({
        name: newBrandName.trim(),
        slug: newBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        avatarUrl: newBrandAvatarUrl.startsWith('data:') ? undefined : (newBrandAvatarUrl.trim() || undefined),
      });
      
      // If there's an uploaded file (not a URL), upload it
      if (newBrandUploadedFiles.length > 0 && newBrandUploadedFiles[0].file) {
        try {
          const { avatarUrl } = await uploadAvatar.mutateAsync({
            id: brand.id,
            file: newBrandUploadedFiles[0].file,
          });
          // Avatar URL will be updated via query invalidation
        } catch (uploadError: any) {
          if (uploadError?.statusCode === 413) {
            toast.error('Upload failed: file too large (max 5MB)');
          } else {
            toast.error(uploadError instanceof Error ? uploadError.message : 'Failed to upload avatar');
          }
        }
      }
      
      toast.success("Brand created!");
      setNewBrandName("");
      setNewBrandAvatarUrl("");
      setNewBrandUploadedFiles([]);
    } catch (error: any) {
      if (error?.statusCode === 409) {
        toast.error(`Maximum of ${maxBrands} brands allowed`);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to create brand");
      }
    }
  };

  const handleUpdateBrand = async (id: string, updates: Partial<Brand>) => {
    try {
      // Only update name (avatar is handled separately via upload endpoint)
      await updateBrand.mutateAsync({ 
        id, 
        updates: { 
          name: updates.name,
          // Don't update avatarUrl here - it's handled by upload/delete endpoints
        } 
      });
      toast.success("Brand updated!");
      setEditingBrandId(null);
      setEditingBrandName("");
      setEditingBrandAvatarUrl("");
      setEditingBrandUploadedFiles({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update brand");
    }
  };

  // Handle file upload for new brand
  const handleNewBrandFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Single file for brand icon
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setNewBrandAvatarUrl(dataUrl);
      
      // Update uploaded files state for preview
      setNewBrandUploadedFiles([{
        file,
        preview: dataUrl,
        status: 'success',
      }]);
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleNewBrandFileRemove = () => {
    setNewBrandAvatarUrl("");
    setNewBrandUploadedFiles([]);
  };

  // Handle file upload for editing brand
  const handleEditBrandFilesSelected = async (files: File[], brandId: string) => {
    if (files.length === 0) return;
    
    const file = files[0]; // Single file for brand icon
    
    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File too large. Max size is 5MB.');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setEditingBrandAvatarUrl(dataUrl);
      
      // Update uploaded files state for preview
      setEditingBrandUploadedFiles(prev => ({
        ...prev,
        [brandId]: [{
          file,
          preview: dataUrl,
          status: 'uploading',
        }],
      }));
      
      // Upload immediately
      uploadAvatar.mutate(
        { id: brandId, file },
        {
          onSuccess: ({ avatarUrl }) => {
            setEditingBrandAvatarUrl(avatarUrl);
            setEditingBrandUploadedFiles(prev => ({
              ...prev,
              [brandId]: [{
                file,
                preview: dataUrl,
                status: 'success',
              }],
            }));
            toast.success('Avatar uploaded successfully!');
          },
          onError: (error: any) => {
            if (error?.statusCode === 413) {
              toast.error('Upload failed: file too large (max 5MB)');
            } else {
              toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
            }
            setEditingBrandUploadedFiles(prev => {
              const newState = { ...prev };
              delete newState[brandId];
              return newState;
            });
          },
        }
      );
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleEditBrandFileRemove = async (brandId: string) => {
    try {
      await deleteAvatar.mutateAsync(brandId);
      setEditingBrandAvatarUrl("");
      setEditingBrandUploadedFiles(prev => {
        const newState = { ...prev };
        delete newState[brandId];
        return newState;
      });
      toast.success('Avatar removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove avatar');
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (brands.length === 1) {
      toast.error("Cannot delete the last brand");
      return;
    }

    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteBrand.mutateAsync(id);
      // If deleted brand was active, switch to first available
      if (activeBrandId === id) {
        const remainingBrands = brands.filter(b => b.id !== id);
        if (remainingBrands.length > 0) {
          setActiveBrandId(remainingBrands[0].id);
        } else {
          setActiveBrandId(null);
        }
      }
      toast.success("Brand deleted!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete brand");
    }
  };

  const handleSetCurrent = (id: string) => {
    setActiveBrandId(id);
    queryClient.invalidateQueries();
    setActiveView('dashboard');
    toast.success("Brand switched!");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Brands</h1>
        <p className="text-muted-foreground">Manage your brands and switch between them</p>
      </div>

      {/* Create New Brand */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Brand</CardTitle>
          <CardDescription>
            {canCreateMore 
              ? `Create up to ${maxBrands} brands (${brands.length}/${maxBrands} used)`
              : `Maximum of ${maxBrands} brands reached`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Brand Name</Label>
            <Input
              placeholder="e.g., Kinetic Grappling"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              disabled={!canCreateMore}
            />
          </div>
          <div className="flex items-start gap-4">
            {/* Icon Preview */}
            <div className="space-y-2">
              <Label>Brand Icon Preview</Label>
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={newBrandAvatarUrl || undefined} 
                  alt={newBrandName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <AvatarFallback className="text-lg font-medium">
                  {newBrandName.trim() 
                    ? (() => {
                        const words = newBrandName.trim().split(/\s+/);
                        return words.length >= 2
                          ? (words[0][0] + words[1][0]).toUpperCase()
                          : newBrandName.charAt(0).toUpperCase();
                      })()
                    : "?"}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Form Fields */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label>Brand Icon (Optional)</Label>
                <UploadDropzone
                  multiple={false}
                  accept="image/*"
                  maxSizeMB={5}
                  value={newBrandUploadedFiles}
                  onFilesSelected={handleNewBrandFilesSelected}
                  onFileRemove={handleNewBrandFileRemove}
                  title="Upload brand icon"
                  helperText="Drag and drop an image or click to browse (max 5MB)"
                  disabled={!canCreateMore}
                />
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Input
                  placeholder="https://example.com/avatar.png"
                  value={newBrandAvatarUrl.startsWith('data:') ? '' : newBrandAvatarUrl}
                  onChange={(e) => {
                    setNewBrandAvatarUrl(e.target.value);
                    // Clear uploaded files if URL is entered
                    if (e.target.value.trim()) {
                      setNewBrandUploadedFiles([]);
                    }
                  }}
                  disabled={!canCreateMore}
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image file or enter a URL. Max size: 5MB. The icon will be displayed in a circular frame.
                </p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleCreateBrand} 
            disabled={createBrand.isPending || !newBrandName.trim() || !canCreateMore}
          >
            {createBrand.isPending ? "Creating..." : "Create Brand"}
          </Button>
          {!canCreateMore && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You've reached the maximum of {maxBrands} brands. Delete a brand to create a new one.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {brands.map((brand) => {
              const isEditing = editingBrandId === brand.id;
              const getInitials = (name: string) => {
                const words = name.trim().split(/\s+/);
                if (words.length >= 2) {
                  return (words[0][0] + words[1][0]).toUpperCase();
                }
                return name.charAt(0).toUpperCase();
              };

              return (
                <div key={brand.id} className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage 
                          src={brand.avatarUrl || undefined} 
                          alt={brand.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <AvatarFallback className="text-sm font-medium">
                          {getInitials(brand.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-sm text-muted-foreground">{brand.slug}</p>
                      </div>
                      {activeBrandId === brand.id && (
                        <Badge variant="default">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {activeBrandId !== brand.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCurrent(brand.id)}
                        >
                          Select
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editingBrandId === brand.id) {
                            setEditingBrandId(null);
                            setEditingBrandName("");
                            setEditingBrandAvatarUrl("");
                          } else {
                            setEditingBrandId(brand.id);
                            setEditingBrandName(brand.name);
                            setEditingBrandAvatarUrl(brand.avatarUrl || "");
                          }
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {brands.length > 1 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBrand(brand.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Edit Form */}
                  {isEditing && (
                    <Card className="ml-4 border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-base">Edit Brand</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                          {/* Icon Preview */}
                          <div className="space-y-2">
                            <Label>Brand Icon Preview</Label>
                            <Avatar className="h-16 w-16">
                              <AvatarImage 
                                src={editingBrandAvatarUrl || undefined} 
                                alt={editingBrandName}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                              <AvatarFallback className="text-lg font-medium">
                                {getInitials(editingBrandName || brand.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          {/* Form Fields */}
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                              <Label>Brand Name</Label>
                              <Input
                                value={editingBrandName}
                                onChange={(e) => setEditingBrandName(e.target.value)}
                                placeholder="Brand name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Brand Icon (Optional)</Label>
                              <UploadDropzone
                                multiple={false}
                                accept="image/*"
                                maxSizeMB={5}
                                value={editingBrandUploadedFiles[brand.id] || []}
                                onFilesSelected={(files) => handleEditBrandFilesSelected(files, brand.id)}
                                onFileRemove={() => handleEditBrandFileRemove(brand.id)}
                                title="Upload brand icon"
                                helperText="Drag and drop an image or click to browse (max 5MB)"
                              />
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                                </div>
                              </div>
                              <Input
                                value={editingBrandAvatarUrl.startsWith('data:') ? '' : editingBrandAvatarUrl}
                                onChange={(e) => {
                                  setEditingBrandAvatarUrl(e.target.value);
                                  // Clear uploaded files if URL is entered
                                  if (e.target.value.trim()) {
                                    setEditingBrandUploadedFiles(prev => {
                                      const newState = { ...prev };
                                      delete newState[brand.id];
                                      return newState;
                                    });
                                  }
                                }}
                                placeholder="https://example.com/avatar.png"
                              />
                              <p className="text-xs text-muted-foreground">
                                Upload an image file or enter a URL. Max size: 5MB. The icon will be displayed in a circular frame.
                              </p>
                              {brand.avatarUrl && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditBrandFileRemove(brand.id)}
                                  disabled={deleteAvatar.isPending}
                                >
                                  {deleteAvatar.isPending ? "Removing..." : "Remove Avatar"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => {
                              handleUpdateBrand(brand.id, {
                                name: editingBrandName,
                                // avatarUrl is handled separately via upload/delete endpoints
                              });
                            }}
                            disabled={!editingBrandName.trim() || updateBrand.isPending}
                          >
                            {updateBrand.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingBrandId(null);
                              setEditingBrandName("");
                              setEditingBrandAvatarUrl("");
                              setEditingBrandUploadedFiles({});
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Queue Management View
function QueueView() {
  const { scheduledSlots, approveSlot, denySlot, deleteScheduledSlot } = useAppStore();
  const [filterStatus, setFilterStatus] = React.useState<ScheduledSlot["status"] | "all">("all");
  const [editSlotId, setEditSlotId] = React.useState<string | null>(null);
  const [denyReason, setDenyReason] = React.useState("");
  const [denyDialogOpen, setDenyDialogOpen] = React.useState(false);
  const [selectedSlotId, setSelectedSlotId] = React.useState<string | null>(null);

  const filteredSlots = filterStatus === "all"
    ? scheduledSlots
    : scheduledSlots.filter((s) => s.status === filterStatus);

  const sortedSlots = [...filteredSlots].sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());

  const handleDeny = () => {
    if (selectedSlotId) {
      denySlot(selectedSlotId, denyReason);
      toast.success("Post denied");
      setDenyDialogOpen(false);
      setDenyReason("");
      setSelectedSlotId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Post Queue
          </h1>
          <p className="text-muted-foreground">Manage upcoming scheduled posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending_generation">Generating</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="pending_approval">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {sortedSlots.map((slot) => (
          <Card key={slot.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Platform Icon */}
                <div className={cn(
                  "p-3 rounded-full shrink-0",
                  slot.platform === "facebook" && "bg-blue-600/10",
                  slot.platform === "instagram" && "bg-pink-500/10",
                  slot.platform === "linkedin" && "bg-blue-700/10",
                  slot.platform === "tiktok" && "bg-gray-900/10",
                  slot.platform === "pinterest" && "bg-red-600/10",
                  slot.platform === "reddit" && "bg-orange-500/10",
                  slot.platform === "slack" && "bg-purple-600/10",
                  slot.platform === "notion" && "bg-gray-900/10"
                )}>
                  <PlatformIcon platform={slot.platform} className={cn(
                    "h-5 w-5",
                    slot.platform === "facebook" && "text-blue-600",
                    slot.platform === "instagram" && "text-pink-500",
                    slot.platform === "linkedin" && "text-blue-700",
                    slot.platform === "tiktok" && "text-gray-900",
                    slot.platform === "pinterest" && "text-red-600",
                    slot.platform === "reddit" && "text-orange-500",
                    slot.platform === "slack" && "text-purple-600",
                    slot.platform === "notion" && "text-gray-900"
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <SlotStatusBadge status={slot.status} />
                    <Badge variant="outline">{slot.contentPillar}</Badge>
                    {slot.mediaSource !== "none" && (
                      <Badge variant="outline" className="gap-1">
                        <Image className="h-3 w-3" />
                        {slot.mediaSource === "uploaded" ? "Uploaded" : "Generated"}
                      </Badge>
                    )}
                  </div>

                  {editSlotId === slot.id ? (
                    <div className="space-y-2">
                      <Textarea
                        defaultValue={slot.primaryCaption}
                        className="min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => {
                          setEditSlotId(null);
                          toast.success("Changes saved");
                        }}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditSlotId(null)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm mb-2">{slot.primaryCaption || "Content pending generation..."}</p>
                  )}

                  {slot.hashtagsGenerated && slot.hashtagsGenerated.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {slot.hashtagsGenerated.map((tag) => (
                        <span key={tag} className="text-xs text-blue-500">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(slot.scheduledTime, "EEE, MMM d 'at' h:mm a")}
                    </span>
                    {slot.approvalDeadline && slot.status === "pending_approval" && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        Approval needed by {format(slot.approvalDeadline, "h:mm a")}
                      </span>
                    )}
                  </div>

                  {/* Variants */}
                  {(slot.variantA || slot.variantB) && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Variants</p>
                      <div className="grid grid-cols-2 gap-2">
                        {slot.variantA && (
                          <div className="p-2 bg-muted rounded text-xs">
                            <Badge variant="outline" className="mb-1">A - Conversion</Badge>
                            <p className="line-clamp-2">{slot.variantA.caption}</p>
                          </div>
                        )}
                        {slot.variantB && (
                          <div className="p-2 bg-muted rounded text-xs">
                            <Badge variant="outline" className="mb-1">B - Story</Badge>
                            <p className="line-clamp-2">{slot.variantB.caption}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {slot.status === "pending_approval" && (
                    <>
                      <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => {
                        approveSlot(slot.id);
                        toast.success("Post approved!");
                      }}>
                        <ThumbsUp className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                        setSelectedSlotId(slot.id);
                        setDenyDialogOpen(true);
                      }}>
                        <ThumbsDown className="h-3 w-3" />
                        Deny
                      </Button>
                    </>
                  )}
                  {slot.status === "generated" && (
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => setEditSlotId(slot.id)}>
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditSlotId(slot.id)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Content
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Reschedule
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="h-4 w-4 mr-2" />
                        Post Now
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600" onClick={() => {
                        deleteScheduledSlot(slot.id);
                        toast.success("Post removed from queue");
                      }}>
                        <XCircle className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedSlots.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posts in queue</p>
              <p className="text-sm">Posts will appear here when the autopilot generates them</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Deny Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Post</DialogTitle>
            <DialogDescription>
              Optionally provide a reason to help improve future content generation.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="e.g., Off-brand tone, wrong topic, needs different angle..."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeny}>Deny Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Notifications View
function NotificationsView() {
  const { autopilotNotifications, markNotificationRead, dismissNotification, approveSlot, denySlot } = useAppStore();
  const [filter, setFilter] = React.useState<"all" | "unread" | "actioned">("all");

  const filteredNotifications = autopilotNotifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "actioned") return n.isActioned;
    return true;
  });

  const getNotificationIcon = (type: AutopilotNotification["type"]) => {
    switch (type) {
      case "pending_approval":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "published":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "denied":
        return <ThumbsDown className="h-5 w-5 text-red-500" />;
      case "reminder":
        return <Bell className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BellRing className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-muted-foreground">Approve, deny, or edit posts before they publish</p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({autopilotNotifications.filter((n) => !n.isRead).length})
            </TabsTrigger>
            <TabsTrigger value="actioned">Actioned</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {filteredNotifications.map((notif) => (
          <Card key={notif.id} className={cn(!notif.isRead && "border-blue-500/50 bg-blue-500/5")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PlatformIcon platform={notif.platform} className="h-4 w-4" />
                    <span className="text-sm font-medium capitalize">{notif.type.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                    </span>
                    {!notif.isRead && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>

                  <p className="text-sm mb-2">{notif.caption}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Scheduled: {format(notif.scheduledTime, "MMM d, h:mm a")}
                    </span>
                    {notif.expiresAt && (
                      <span className="flex items-center gap-1 text-yellow-600">
                        <AlertCircle className="h-3 w-3" />
                        Expires: {formatDistanceToNow(notif.expiresAt, { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {notif.actionTaken && (
                    <Badge variant="outline" className="mt-2 capitalize">
                      {notif.actionTaken}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {!notif.isActioned && notif.type === "pending_approval" && (
                    <>
                      <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => {
                        approveSlot(notif.slotId);
                        markNotificationRead(notif.id);
                        toast.success("Post approved!");
                      }}>
                        <ThumbsUp className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => {
                        denySlot(notif.slotId);
                        markNotificationRead(notif.id);
                        toast.success("Post denied");
                      }}>
                        <ThumbsDown className="h-3 w-3" />
                        Deny
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        useAppStore.getState().setActiveView("queue");
                      }}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {(notif.isActioned || notif.type !== "pending_approval") && (
                    <Button size="sm" variant="ghost" onClick={() => dismissNotification(notif.id)}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredNotifications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Brand Profile View
function BrandProfileView() {
  const { brandProfile, updateBrandProfile } = useAppStore();
  const [activeTab, setActiveTab] = React.useState("basics");

  if (!brandProfile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Set Up Your Brand Profile</h2>
            <p className="text-muted-foreground mb-4">
              Your brand profile helps the AI generate content that matches your voice and goals.
            </p>
            <Button>Create Brand Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const GoalIcon = ({ goal }: { goal: string }) => {
    switch (goal) {
      case "growth": return <TrendingUp className="h-4 w-4" />;
      case "leads": return <Target className="h-4 w-4" />;
      case "community": return <Users className="h-4 w-4" />;
      case "sales": return <DollarSign className="h-4 w-4" />;
      case "hiring": return <Briefcase className="h-4 w-4" />;
      case "awareness": return <Eye className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Brand Profile
          </h1>
          <p className="text-muted-foreground">Your brand's source of truth for AI content generation</p>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {format(brandProfile.updatedAt, "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="voice">Voice & Rules</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="visual">Visual Style</TabsTrigger>
          <TabsTrigger value="content">Content & Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Basics</CardTitle>
              <CardDescription>Core information about your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input
                    value={brandProfile.brandName}
                    onChange={(e) => updateBrandProfile({ brandName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={brandProfile.industry}
                    onChange={(e) => updateBrandProfile({ industry: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Textarea
                  value={brandProfile.audience}
                  onChange={(e) => updateBrandProfile({ audience: e.target.value })}
                  placeholder="Describe your ideal customer..."
                />
              </div>
              <div className="space-y-2">
                <Label>Location / Service Area</Label>
                <Input
                  value={brandProfile.location}
                  onChange={(e) => updateBrandProfile({ location: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Voice</CardTitle>
              <CardDescription>How your brand communicates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Description</Label>
                <Textarea
                  value={brandProfile.brandVoice}
                  onChange={(e) => updateBrandProfile({ brandVoice: e.target.value })}
                  placeholder="Describe your brand's tone and personality..."
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Do's</CardTitle>
                <CardDescription>Writing practices to follow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(brandProfile.writingDos || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newDos = [...(brandProfile.writingDos || [])];
                          newDos[index] = e.target.value;
                          updateBrandProfile({ writingDos: newDos });
                        }}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    updateBrandProfile({ writingDos: [...(brandProfile.writingDos || []), ""] });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Do
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Don'ts</CardTitle>
                <CardDescription>Writing practices to avoid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(brandProfile.writingDonts || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newDonts = [...(brandProfile.writingDonts || [])];
                          newDonts[index] = e.target.value;
                          updateBrandProfile({ writingDonts: newDonts });
                        }}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    updateBrandProfile({ writingDonts: [...(brandProfile.writingDonts || []), ""] });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Don't
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Constraints
              </CardTitle>
              <CardDescription>Words and claims to avoid for legal/compliance reasons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Banned Words</Label>
                <div className="flex flex-wrap gap-2">
                  {(brandProfile.bannedWords || []).map((word, index) => (
                    <Badge key={index} variant="destructive" className="gap-1">
                      {word}
                      <button onClick={() => {
                        updateBrandProfile({
                          bannedWords: (brandProfile.bannedWords || []).filter((_, i) => i !== index),
                        });
                      }}>
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Banned Claims</Label>
                <div className="flex flex-wrap gap-2">
                  {(brandProfile.bannedClaims || []).map((claim, index) => (
                    <Badge key={index} variant="destructive" className="gap-1">
                      {claim}
                      <button onClick={() => {
                        updateBrandProfile({
                          bannedClaims: (brandProfile.bannedClaims || []).filter((_, i) => i !== index),
                        });
                      }}>
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Compliance Notes</Label>
                <Textarea
                  value={brandProfile.complianceNotes}
                  onChange={(e) => updateBrandProfile({ complianceNotes: e.target.value })}
                  placeholder="Any additional compliance requirements..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Products & Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Services Offered</Label>
                <div className="flex flex-wrap gap-2">
                  {(brandProfile.services || []).map((service, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current Offers</Label>
                <div className="flex flex-wrap gap-2">
                  {(brandProfile.offers || []).map((offer, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {offer}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pricing</Label>
                <Input
                  value={brandProfile.prices || ""}
                  onChange={(e) => updateBrandProfile({ prices: e.target.value })}
                  placeholder="e.g., Starting at $29/month"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA Links</CardTitle>
              <CardDescription>Links to include in posts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(brandProfile.ctaLinks || []).map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) => {
                        const newLinks = [...(brandProfile.ctaLinks || [])];
                        newLinks[index] = { ...link, label: e.target.value };
                        updateBrandProfile({ ctaLinks: newLinks });
                      }}
                      placeholder="Label"
                      className="w-1/3"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...(brandProfile.ctaLinks || [])];
                        newLinks[index] = { ...link, url: e.target.value };
                        updateBrandProfile({ ctaLinks: newLinks });
                      }}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => {
                      updateBrandProfile({
                          ctaLinks: (brandProfile.ctaLinks || []).filter((_, i) => i !== index),
                      });
                    }}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => {
                  updateBrandProfile({
                    ctaLinks: [...(brandProfile.ctaLinks || []), { label: "", url: "" }],
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Visual Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Visual Vibe</Label>
                <Textarea
                  value={brandProfile.visualVibe}
                  onChange={(e) => updateBrandProfile({ visualVibe: e.target.value })}
                  placeholder="Describe the visual style of your brand..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Colors</Label>
                  <div className="flex gap-2">
                    {(brandProfile.primaryColors || []).map((color, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Colors</Label>
                  <div className="flex gap-2">
                    {(brandProfile.secondaryColors || []).map((color, index) => (
                      <div
                        key={index}
                        className="w-10 h-10 rounded border"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagery to Avoid</Label>
                <div className="flex flex-wrap gap-2">
                  {(brandProfile.doNotUseImagery || []).map((item, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Posting Goals</CardTitle>
              <CardDescription>What you want to achieve with your content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {POSTING_GOALS.map((goal) => {
                  const isSelected = (brandProfile.postingGoals || []).includes(goal.id);
                  return (
                    <Button
                      key={goal.id}
                      variant={isSelected ? "default" : "outline"}
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => {
                        if (isSelected) {
                          updateBrandProfile({
                            postingGoals: (brandProfile.postingGoals || []).filter((g) => g !== goal.id),
                          });
                        } else {
                          updateBrandProfile({
                            postingGoals: [...(brandProfile.postingGoals || []), goal.id],
                          });
                        }
                      }}
                    >
                      <GoalIcon goal={goal.id} />
                      {goal.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Content Pillars
              </CardTitle>
              <CardDescription>3-6 themes that your content rotates through</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(brandProfile.contentPillars || []).map((pillar, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                    <Input
                      value={pillar}
                      onChange={(e) => {
                        const newPillars = [...(brandProfile.contentPillars || [])];
                        newPillars[index] = e.target.value;
                        updateBrandProfile({ contentPillars: newPillars });
                      }}
                    />
                    <Button variant="ghost" size="icon" onClick={() => {
                      updateBrandProfile({
                          contentPillars: (brandProfile.contentPillars || []).filter((_, i) => i !== index),
                      });
                    }}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(brandProfile.contentPillars || []).length < 6 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    updateBrandProfile({
                      contentPillars: [...(brandProfile.contentPillars || []), ""],
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content Pillar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("Brand profile saved!")}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// Audit Log View
function AuditLogView() {
  const { auditLog } = useAppStore();
  const [filterAction, setFilterAction] = React.useState<string>("all");

  const getActionIcon = (action: string) => {
    if (action.includes("generated")) return <Sparkles className="h-4 w-4 text-purple-500" />;
    if (action.includes("approved")) return <ThumbsUp className="h-4 w-4 text-green-500" />;
    if (action.includes("denied")) return <ThumbsDown className="h-4 w-4 text-red-500" />;
    if (action.includes("published")) return <Send className="h-4 w-4 text-blue-500" />;
    if (action.includes("failed")) return <XCircle className="h-4 w-4 text-red-500" />;
    if (action.includes("schedule")) return <Calendar className="h-4 w-4 text-blue-500" />;
    if (action.includes("settings") || action.includes("profile")) return <Settings className="h-4 w-4 text-gray-500" />;
    if (action.includes("emergency") || action.includes("paused")) return <AlertOctagon className="h-4 w-4 text-red-500" />;
    return <History className="h-4 w-4" />;
  };

  const filteredLog = filterAction === "all"
    ? auditLog
    : auditLog.filter((entry) => entry.action.includes(filterAction));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            Audit Log
          </h1>
          <p className="text-muted-foreground">Complete history of autopilot actions</p>
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="generated">Content Generated</SelectItem>
            <SelectItem value="approved">Approvals</SelectItem>
            <SelectItem value="denied">Denials</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="schedule">Schedule Changes</SelectItem>
            <SelectItem value="settings">Settings Changes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="divide-y">
              {filteredLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 p-4 hover:bg-muted/50">
                  <div className="shrink-0 mt-1">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{entry.action.replace(/_/g, " ")}</span>
                      <Badge variant="outline" className="text-xs">
                        {entry.actorType === "autopilot" ? (
                          <><Bot className="h-3 w-3 mr-1" /> Autopilot</>
                        ) : (
                          <><Users className="h-3 w-3 mr-1" /> User</>
                        )}
                      </Badge>
                      {!entry.success && (
                        <Badge variant="destructive" className="text-xs">Failed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{entry.details}</p>
                    {entry.errorMessage && (
                      <p className="text-sm text-red-500 mt-1">{entry.errorMessage}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">
                    {format(entry.timestamp, "MMM d, h:mm a")}
                  </div>
                </div>
              ))}

              {filteredLog.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit log entries</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Main App component
function App() {
  const { activeView, setActiveView } = useAppStore();

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "autopilot":
        return <AutopilotView />;
      case "queue":
        return <QueueView />;
      case "compose":
        return <ComposeView />;
      case "calendar":
        return <CalendarViewComponent />;
      case "notifications":
        return <NotificationsView />;
      case "inbox":
        return <InboxView />;
      case "email":
        return <EmailView />;
      case "analytics":
        return <AnalyticsView />;
      case "brand":
        return <BrandProfileView />;
      case "accounts":
        return <AccountsView />;
      case "campaigns":
        return <CampaignsView />;
      case "assets":
        return <AssetsView />;
      case "audit":
        return <AuditLogView />;
      case "settings":
        return <SettingsView />;
      case "vertical-slice":
        return <PostsVerticalSlice />;
      default:
        return <DashboardView />;
    }
  };

  // Map activeView to page title and create button
  const getPageConfig = () => {
    const configs: Record<string, { title: string; createLabel?: string; onCreate?: () => void }> = {
      dashboard: { title: "Dashboard" },
      autopilot: { title: "Autopilot" },
      compose: { title: "Compose", createLabel: "New Post", onCreate: () => setActiveView("compose") },
      queue: { title: "Queue" },
      calendar: { title: "Calendar" },
      inbox: { title: "Inbox" },
      analytics: { title: "Analytics" },
      campaigns: { title: "Campaigns", createLabel: "New Campaign" },
      assets: { title: "Assets", createLabel: "Upload Asset" },
      accounts: { title: "Accounts" },
      settings: { title: "Settings" },
    };
    return configs[activeView] || { title: "Dashboard" };
  };

  const pageConfig = getPageConfig();
  const isRiskyPage = ["compose", "autopilot", "queue"].includes(activeView);
  const renderedView = renderView();

  return (
    <AppShell
      pageTitle={pageConfig.title}
      showBrandBanner={isRiskyPage}
      createButtonLabel={pageConfig.createLabel}
      onCreateClick={pageConfig.onCreate}
    >
      {renderedView}
    </AppShell>
  );
}
