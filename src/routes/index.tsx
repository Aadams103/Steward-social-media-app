import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { format, addDays, startOfWeek, isSameDay, formatDistanceToNow } from "date-fns";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppStore } from "@/store/app-store";
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
} from "@/types/app";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
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
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "brand", label: "Brand Profile", icon: Building2 },
    { id: "accounts", label: "Accounts", icon: Users },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "assets", label: "Assets", icon: Image },
    { id: "audit", label: "Audit Log", icon: History },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={cn(
      "flex flex-col h-full bg-zinc-900 text-white transition-all duration-300",
      sidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 border-b border-zinc-800">
        <h1 className={cn("font-bold text-xl", sidebarCollapsed && "hidden")}>
          SocialHub
        </h1>
        {sidebarCollapsed && (
          <div className="flex justify-center">
            <Megaphone className="h-6 w-6" />
          </div>
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

// Dashboard View
function DashboardView() {
  const { posts, socialAccounts, conversations, campaigns, autopilotSettings, scheduledSlots, autopilotNotifications } = useAppStore();

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

  const pendingApprovals = scheduledSlots.filter((s) => s.status === "pending_approval").length;
  const nextPost = scheduledSlots
    .filter((s) => s.status === "approved" || s.status === "pending_approval")
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())[0];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
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
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
              +12.5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1 text-green-500" />
              +8.2% from last week
            </p>
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
                    account.platform === "pinterest" && "bg-red-600/10"
                  )}>
                    <PlatformIcon platform={account.platform} className={cn(
                      "h-5 w-5",
                      account.platform === "facebook" && "text-blue-600",
                      account.platform === "instagram" && "text-pink-500",
                      account.platform === "linkedin" && "text-blue-700",
                      account.platform === "tiktok" && "text-gray-900",
                      account.platform === "pinterest" && "text-red-600"
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
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest social media posts</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}

// Post Composer View
function ComposeView() {
  const { posts, addPost, campaigns, socialAccounts } = useAppStore();
  const [content, setContent] = React.useState("");
  const [selectedPlatform, setSelectedPlatform] = React.useState<Platform>("facebook");
  const [selectedCampaign, setSelectedCampaign] = React.useState<string>("");
  const [scheduleDate, setScheduleDate] = React.useState("");
  const [scheduleTime, setScheduleTime] = React.useState("");
  const [isScheduled, setIsScheduled] = React.useState(false);


  const platformLimit = PLATFORM_LIMITS[selectedPlatform];
  const charCount = content.length;
  const isOverLimit = charCount > platformLimit.maxChars;

  const handlePublish = () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    if (isOverLimit) {
      toast.error(`Content exceeds ${platformLimit.maxChars} character limit`);
      return;
    }

    // Add to local state
    const newPost: Post = {
      id: Date.now().toString(),
      content,
      platform: selectedPlatform,
      status: isScheduled ? "scheduled" : "published",
      scheduledTime: isScheduled && scheduleDate && scheduleTime
        ? new Date(`${scheduleDate}T${scheduleTime}`)
        : undefined,
      publishedTime: !isScheduled ? new Date() : undefined,
      authorId: "user1",
      campaignId: selectedCampaign || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addPost(newPost);
    toast.success(isScheduled ? "Post scheduled!" : "Post published!");
    setContent("");
    setSelectedCampaign("");
    setScheduleDate("");
    setScheduleTime("");
    setIsScheduled(false);
  };

  const handleSaveDraft = () => {
    if (!content.trim()) {
      toast.error("Please enter some content");
      return;
    }

    const newPost: Post = {
      id: Date.now().toString(),
      content,
      platform: selectedPlatform,
      status: "draft",
      authorId: "user1",
      campaignId: selectedCampaign || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    addPost(newPost);
    toast.success("Draft saved!");
    setContent("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compose Post</h1>
        <p className="text-muted-foreground">Create and schedule content for your social media accounts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Composer */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Platform Selection */}
              <div className="flex gap-2">
                {PLATFORMS.map((platform) => {
                  const account = socialAccounts.find((a) => a.platform === platform.id);
                  return (
                    <Button
                      key={platform.id}
                      variant={selectedPlatform === platform.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPlatform(platform.id)}
                      disabled={!account?.isConnected}
                    >
                      <PlatformIcon platform={platform.id} className="h-4 w-4 mr-2" />
                      {platform.label}
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
                    <Button variant="ghost" size="sm">
                      <Image className="h-4 w-4 mr-1" />
                      Media
                    </Button>
                    <Button variant="ghost" size="sm">
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
              onClick={handlePublish}
              disabled={!content.trim() || isOverLimit}
            >
              {isScheduled ? "Schedule Post" : "Publish Now"}
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
    </div>
  );
}

// Calendar View
function CalendarViewComponent() {
  const {
    posts,
    calendarView,
    setCalendarView,
    selectedDate,
    setSelectedDate,
    platformFilter,
    setPlatformFilter,
  } = useAppStore();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getPostsForDate = (date: Date) => {
    return posts.filter((post) => {
      const postDate = post.scheduledTime || post.publishedTime || post.createdAt;
      return isSameDay(postDate, date) &&
        (platformFilter === "all" || post.platform === platformFilter);
    });
  };

  const navigateWeek = (direction: number) => {
    setSelectedDate(addDays(selectedDate, direction * 7));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">Schedule and manage your posts</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as Platform | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {PLATFORMS.map((platform) => (
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
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <span className="font-medium ml-4">
            {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
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

      {/* Week View */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayPosts = getPostsForDate(day);
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
                  {dayPosts.map((post) => (
                    <div
                      key={post.id}
                      className={cn(
                        "p-2 rounded-md text-xs cursor-pointer hover:opacity-80",
                        post.platform === "facebook" && "bg-blue-600/10 border-l-2 border-blue-600",
                        post.platform === "instagram" && "bg-pink-500/10 border-l-2 border-pink-500",
                        post.platform === "linkedin" && "bg-blue-700/10 border-l-2 border-blue-700",
                        post.platform === "tiktok" && "bg-gray-900/10 border-l-2 border-gray-900",
                        post.platform === "pinterest" && "bg-red-600/10 border-l-2 border-red-600"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <PlatformIcon platform={post.platform} className="h-3 w-3" />
                        <StatusBadge status={post.status} />
                      </div>
                      <p className="line-clamp-2">{post.content}</p>
                      {post.scheduledTime && (
                        <p className="text-muted-foreground mt-1">
                          {format(post.scheduledTime, "h:mm a")}
                        </p>
                      )}
                    </div>
                  ))}
                  {dayPosts.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No posts
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
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
function AccountsView() {
  const { socialAccounts } = useAppStore();
  const [connectDialogOpen, setConnectDialogOpen] = React.useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Social Accounts</h1>
          <p className="text-muted-foreground">Manage your connected social media accounts</p>
        </div>
        <Button onClick={() => setConnectDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Connect Account
        </Button>
      </div>

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
                    account.platform === "pinterest" && "bg-red-600"
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
                    <DropdownMenuItem className="text-red-600">Disconnect</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={account.isConnected ? "default" : "destructive"}>
                    {account.isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Followers</span>
                  <span className="font-medium">{account.followerCount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Sync</span>
                  <span className="text-sm">
                    {account.lastSync ? format(account.lastSync, "MMM d, h:mm a") : "Never"}
                  </span>
                </div>
                <Separator />
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Social Account</DialogTitle>
            <DialogDescription>
              Choose a platform to connect to your SocialHub account
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {PLATFORMS.map((platform) => (
              <Button
                key={platform.id}
                variant="outline"
                className="justify-start h-16"
                onClick={() => {
                  toast.info(`Connecting to ${platform.label}...`);
                  setConnectDialogOpen(false);
                }}
              >
                <PlatformIcon platform={platform.id} className="h-6 w-6 mr-4" />
                <div className="text-left">
                  <p className="font-medium">{platform.label}</p>
                  <p className="text-sm text-muted-foreground">Connect your {platform.label} account</p>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
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

// Assets View (placeholder)
function AssetsView() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Library</h1>
          <p className="text-muted-foreground">Manage your media files and templates</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload Asset
        </Button>
      </div>

      <Tabs defaultValue="images">
        <TabsList>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="hashtags">Hashtag Sets</TabsTrigger>
        </TabsList>
        <TabsContent value="images" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images uploaded yet</p>
              <p className="text-sm">Upload images to use in your posts</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="videos" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No videos uploaded yet</p>
              <p className="text-sm">Upload videos for your content</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates saved yet</p>
              <p className="text-sm">Save caption templates for quick posting</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hashtags" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hashtag sets created yet</p>
              <p className="text-sm">Create hashtag groups for easy reuse</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

// Settings View (placeholder)
function SettingsView() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your SocialHub preferences</p>
      </div>

      <div className="grid gap-6">
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
      </div>
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
    autopilotSettings,
    updateAutopilotSettings,
    scheduledSlots,
    weeklySchedule,
    lockWeek,
    unlockWeek,
    regenerateSchedule,
    brandProfile,
    autopilotNotifications,
    isAutopilotRunning,
  } = useAppStore();

  const pendingApprovals = scheduledSlots.filter((s) => s.status === "pending_approval").length;
  const approvedPosts = scheduledSlots.filter((s) => s.status === "approved").length;
  const nextPost = scheduledSlots
    .filter((s) => s.status === "approved" || s.status === "pending_approval")
    .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime())[0];

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

      {/* Status Banner */}
      {autopilotSettings.isPaused && (
        <Alert variant="destructive">
          <Pause className="h-4 w-4" />
          <AlertTitle>Autopilot is Paused</AlertTitle>
          <AlertDescription>
            {autopilotSettings.pauseReason || "No new posts will be generated or published until resumed."}
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
            <Zap className={cn("h-4 w-4", isAutopilotRunning && !autopilotSettings.isPaused ? "text-green-500" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {autopilotSettings.isPaused ? "Paused" : autopilotSettings.operatingMode === "manual" ? "Manual" : "Active"}
            </div>
            <p className="text-xs text-muted-foreground">
              {OPERATING_MODES.find((m) => m.id === autopilotSettings.operatingMode)?.label}
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
                      slot.platform === "pinterest" && "bg-red-600/10"
                    )}>
                      <PlatformIcon platform={slot.platform} className={cn(
                        "h-4 w-4",
                        slot.platform === "facebook" && "text-blue-600",
                        slot.platform === "instagram" && "text-pink-500",
                        slot.platform === "linkedin" && "text-blue-700",
                        slot.platform === "tiktok" && "text-gray-900",
                        slot.platform === "pinterest" && "text-red-600"
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
                value={autopilotSettings.approvalWindow}
                onValueChange={(v) => updateAutopilotSettings({ approvalWindow: v as typeof autopilotSettings.approvalWindow })}
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
                  checked={autopilotSettings.enableWebResearch}
                  onCheckedChange={(checked) => updateAutopilotSettings({ enableWebResearch: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Image Generation</p>
                  <p className="text-xs text-muted-foreground">AI-generated visuals</p>
                </div>
                <Switch
                  checked={autopilotSettings.enableImageGeneration}
                  onCheckedChange={(checked) => updateAutopilotSettings({ enableImageGeneration: checked })}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Platform Cadence (posts/week)</Label>
              {PLATFORMS.map((platform) => (
                <div key={platform.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PlatformIcon platform={platform.id} className="h-4 w-4" />
                    <span className="text-sm">{platform.label}</span>
                  </div>
                  <Input
                    type="number"
                    className="w-16 h-8 text-center"
                    value={autopilotSettings.platformCadence[platform.id]}
                    onChange={(e) => updateAutopilotSettings({
                      platformCadence: {
                        ...autopilotSettings.platformCadence,
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
                  slot.platform === "pinterest" && "bg-red-600/10"
                )}>
                  <PlatformIcon platform={slot.platform} className={cn(
                    "h-5 w-5",
                    slot.platform === "facebook" && "text-blue-600",
                    slot.platform === "instagram" && "text-pink-500",
                    slot.platform === "linkedin" && "text-blue-700",
                    slot.platform === "tiktok" && "text-gray-900",
                    slot.platform === "pinterest" && "text-red-600"
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
                  {brandProfile.writingDos.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newDos = [...brandProfile.writingDos];
                          newDos[index] = e.target.value;
                          updateBrandProfile({ writingDos: newDos });
                        }}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    updateBrandProfile({ writingDos: [...brandProfile.writingDos, ""] });
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
                  {brandProfile.writingDonts.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <Input
                        value={item}
                        onChange={(e) => {
                          const newDonts = [...brandProfile.writingDonts];
                          newDonts[index] = e.target.value;
                          updateBrandProfile({ writingDonts: newDonts });
                        }}
                      />
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    updateBrandProfile({ writingDonts: [...brandProfile.writingDonts, ""] });
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
                  {brandProfile.bannedWords.map((word, index) => (
                    <Badge key={index} variant="destructive" className="gap-1">
                      {word}
                      <button onClick={() => {
                        updateBrandProfile({
                          bannedWords: brandProfile.bannedWords.filter((_, i) => i !== index),
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
                  {brandProfile.bannedClaims.map((claim, index) => (
                    <Badge key={index} variant="destructive" className="gap-1">
                      {claim}
                      <button onClick={() => {
                        updateBrandProfile({
                          bannedClaims: brandProfile.bannedClaims.filter((_, i) => i !== index),
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
                  {brandProfile.services.map((service, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current Offers</Label>
                <div className="flex flex-wrap gap-2">
                  {brandProfile.offers.map((offer, index) => (
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
                {brandProfile.ctaLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={link.label}
                      onChange={(e) => {
                        const newLinks = [...brandProfile.ctaLinks];
                        newLinks[index] = { ...link, label: e.target.value };
                        updateBrandProfile({ ctaLinks: newLinks });
                      }}
                      placeholder="Label"
                      className="w-1/3"
                    />
                    <Input
                      value={link.url}
                      onChange={(e) => {
                        const newLinks = [...brandProfile.ctaLinks];
                        newLinks[index] = { ...link, url: e.target.value };
                        updateBrandProfile({ ctaLinks: newLinks });
                      }}
                      placeholder="URL"
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => {
                      updateBrandProfile({
                        ctaLinks: brandProfile.ctaLinks.filter((_, i) => i !== index),
                      });
                    }}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => {
                  updateBrandProfile({
                    ctaLinks: [...brandProfile.ctaLinks, { label: "", url: "" }],
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
                    {brandProfile.primaryColors.map((color, index) => (
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
                    {brandProfile.secondaryColors.map((color, index) => (
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
                  {brandProfile.doNotUseImagery.map((item, index) => (
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
                  const isSelected = brandProfile.postingGoals.includes(goal.id);
                  return (
                    <Button
                      key={goal.id}
                      variant={isSelected ? "default" : "outline"}
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => {
                        if (isSelected) {
                          updateBrandProfile({
                            postingGoals: brandProfile.postingGoals.filter((g) => g !== goal.id),
                          });
                        } else {
                          updateBrandProfile({
                            postingGoals: [...brandProfile.postingGoals, goal.id],
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
                {brandProfile.contentPillars.map((pillar, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="shrink-0">{index + 1}</Badge>
                    <Input
                      value={pillar}
                      onChange={(e) => {
                        const newPillars = [...brandProfile.contentPillars];
                        newPillars[index] = e.target.value;
                        updateBrandProfile({ contentPillars: newPillars });
                      }}
                    />
                    <Button variant="ghost" size="icon" onClick={() => {
                      updateBrandProfile({
                        contentPillars: brandProfile.contentPillars.filter((_, i) => i !== index),
                      });
                    }}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {brandProfile.contentPillars.length < 6 && (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    updateBrandProfile({
                      contentPillars: [...brandProfile.contentPillars, ""],
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
  const { activeView, sidebarCollapsed, setSidebarCollapsed, autopilotNotifications, autopilotSettings } = useAppStore();
  const pendingApprovals = autopilotNotifications.filter((n) => n.type === "pending_approval" && !n.isActioned).length;

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
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            {/* Autopilot Status Indicator */}
            {autopilotSettings.operatingMode !== "manual" && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                autopilotSettings.isPaused
                  ? "bg-yellow-500/10 text-yellow-600"
                  : "bg-green-500/10 text-green-600"
              )}>
                <div className={cn(
                  "h-2 w-2 rounded-full animate-pulse",
                  autopilotSettings.isPaused ? "bg-yellow-500" : "bg-green-500"
                )} />
                <Bot className="h-4 w-4" />
                <span className="font-medium">
                  {autopilotSettings.isPaused
                    ? "Paused"
                    : autopilotSettings.operatingMode === "autopilot"
                      ? "Autopilot Active"
                      : "Approval Mode"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 w-64"
              />
            </div>

            {/* Notifications with Badge */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {pendingApprovals > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {pendingApprovals}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2 border-b">
                  <span className="font-medium">Notifications</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => useAppStore.getState().setActiveView("notifications")}
                  >
                    View All
                  </Button>
                </div>
                <ScrollArea className="h-64">
                  {autopilotNotifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "p-3 border-b hover:bg-muted/50 cursor-pointer",
                        !notif.isRead && "bg-blue-500/5"
                      )}
                      onClick={() => {
                        useAppStore.getState().markNotificationRead(notif.id);
                        useAppStore.getState().setActiveView("notifications");
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <PlatformIcon platform={notif.platform} className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground capitalize">
                          {notif.type.replace("_", " ")}
                        </span>
                        {!notif.isRead && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-sm line-clamp-2">{notif.caption}</p>
                    </div>
                  ))}
                  {autopilotNotifications.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

            <Avatar className="h-8 w-8">
              <AvatarFallback>MT</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
