import * as React from "react";
import { format } from "date-fns";
import {
	BarChart3,
	Calendar,
	CheckCircle2,
	ChevronRight,
	Clock,
	Eye,
	Link2,
	PenSquare,
	Sparkles,
	TrendingUp,
	Users,
	X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/app-store";
import { usePosts, useSocialAccounts } from "@/hooks/use-api";
import { CreateMenu, CreatePostButton } from "@/components/create/CreateMenu";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { ErrorDisplay } from "@/components/ui/error-display";
import type { Post } from "@/types/app";

type ProfileRow = { id: string; display_name: string | null };

type ChecklistStatus = "done" | "next" | "pending";

interface ChecklistItem {
	id: string;
	title: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	status: ChecklistStatus;
	onAction?: () => void;
}

function statusBadge(status: ChecklistStatus) {
	switch (status) {
		case "done":
			return (
				<Badge variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700">
					Done
				</Badge>
			);
		case "next":
			return <Badge className="bg-primary/90">Next</Badge>;
		default:
			return (
				<Badge variant="outline" className="text-muted-foreground">
					Pending
				</Badge>
			);
	}
}

function PostRow({ post }: { post: Post }) {
	return (
		<div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background p-3">
			<PlatformIcon platform={post.platform} className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
			<div className="min-w-0 flex-1">
				<p className="line-clamp-2 text-sm">{post.content}</p>
				<div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
					{post.scheduledTime && <span>{format(new Date(post.scheduledTime), "MMM d, h:mm a")}</span>}
					<Badge variant="outline" className="h-5 text-[10px] capitalize">
						{post.status.replace("_", " ")}
					</Badge>
				</div>
			</div>
		</div>
	);
}

export function HomeDashboard() {
	const setActiveView = useAppStore((s) => s.setActiveView);
	const { currentOrganization } = useAppStore();

	const [profile, setProfile] = React.useState<ProfileRow | null>(null);
	const [profileLoading, setProfileLoading] = React.useState(true);
	const [gettingStartedDismissed, setGettingStartedDismissed] = React.useState(false);

	const { data: postsData, isLoading: postsLoading, isError: postsIsError, error: postsError, refetch: refetchPosts } =
		usePosts();
	const { data: accountsData, isLoading: accountsLoading, isError: accountsIsError, error: accountsError } =
		useSocialAccounts();

	React.useEffect(() => {
		const client = supabase;
		if (!client) {
			setProfileLoading(false);
			return;
		}
		let cancelled = false;
		(async () => {
			const {
				data: { session },
			} = await client.auth.getSession();
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
		return () => {
			cancelled = true;
		};
	}, []);

	const posts = postsData?.posts ?? [];
	const socialAccounts = accountsData?.accounts ?? [];
	const scheduledPosts = posts.filter((p) => p.status === "scheduled");
	const draftPosts = posts.filter((p) => p.status === "draft");
	const publishedWithMetrics = posts.filter((p) => p.status === "published" && p.metrics);
	const topPost = [...publishedWithMetrics].sort(
		(a, b) =>
			(b.metrics?.engagement ?? b.metrics?.likes ?? 0) - (a.metrics?.engagement ?? a.metrics?.likes ?? 0),
	)[0];

	const hasConnectedAccounts = socialAccounts.some((a) => a.isConnected);
	const hasScheduledPost = scheduledPosts.length > 0;
	const hasDraft = draftPosts.length > 0;
	const hasAnalytics = publishedWithMetrics.length > 0;

	const checklist: ChecklistItem[] = [
		{
			id: "connect",
			title: "Connect your social accounts",
			description: "Link the channels you want Steward to manage.",
			icon: Link2,
			status: hasConnectedAccounts ? "done" : "next",
			onAction: () => setActiveView("accounts"),
		},
		{
			id: "schedule",
			title: "Create and schedule a post",
			description: "Draft content and put it on your calendar.",
			icon: PenSquare,
			status: hasScheduledPost ? "done" : hasConnectedAccounts ? "next" : "pending",
		},
		{
			id: "analytics",
			title: "See your analytics reports",
			description: "Review performance once posts are published.",
			icon: BarChart3,
			status: hasAnalytics ? "done" : "pending",
			onAction: () => setActiveView("analytics"),
		},
		{
			id: "trending",
			title: "Stay on top of trending topics",
			description: "Use listening insights to shape your content.",
			icon: TrendingUp,
			status: "pending",
			onAction: () => setActiveView("queue"),
		},
		{
			id: "calendar",
			title: "Check your social calendar",
			description: "See what's planned across the week.",
			icon: Calendar,
			status: hasScheduledPost ? "done" : "pending",
			onAction: () => setActiveView("calendar"),
		},
		{
			id: "ai",
			title: "Create quick content with AI",
			description: "Generate on-brand drafts with OwlGPT.",
			icon: Sparkles,
			status: hasDraft ? "done" : "pending",
			onAction: () => setActiveView("autopilot"),
		},
	];

	const completedSteps = checklist.filter((c) => c.status === "done").length;
	const progressPct = Math.round((completedSteps / checklist.length) * 100);

	const isLoading = profileLoading || postsLoading || accountsLoading;
	const hasError = postsIsError || accountsIsError;

	const displayName = (profile?.display_name ?? "").trim() || "there";
	const trialLine =
		currentOrganization?.billingStatus === "trialing" && currentOrganization.trialEndsAt
			? `Trial ends ${format(new Date(currentOrganization.trialEndsAt), "MMM d, yyyy")}`
			: currentOrganization?.billingStatus === "active"
				? `${currentOrganization.billingPlan} plan · Active`
				: null;

	if (isLoading) {
		return (
			<div className="mx-auto max-w-[1200px] space-y-6 px-0 py-0">
				<LoadingSkeleton className="h-10 w-72" />
				<LoadingSkeleton className="h-48 w-full rounded-xl" />
				<div className="grid gap-4 lg:grid-cols-3">
					<LoadingSkeleton className="h-64 rounded-xl lg:col-span-2" />
					<LoadingSkeleton className="h-64 rounded-xl" />
				</div>
			</div>
		);
	}

	if (hasError) {
		return (
			<div className="mx-auto max-w-[1200px] px-0 py-0">
				<ErrorDisplay error={postsError || accountsError} onRetry={() => refetchPosts()} title="Failed to load home" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[1200px] space-y-6 px-0 py-0">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					{trialLine && <p className="mb-1 text-xs font-medium text-muted-foreground">{trialLine}</p>}
					<h1 className="text-2xl font-bold tracking-tight md:text-3xl">Welcome, {displayName}!</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Your command center for planning, creating, and publishing social content.
					</p>
				</div>
				<CreatePostButton className="shrink-0" />
			</div>

			{!gettingStartedDismissed && (
				<Card className="rounded-xl border-border/70 shadow-sm">
					<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
						<div>
							<CardTitle className="text-lg">Getting Started</CardTitle>
							<CardDescription>Complete these steps to get the most from Steward.</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 shrink-0"
							aria-label="Dismiss getting started"
							onClick={() => setGettingStartedDismissed(true)}
						>
							<X className="h-4 w-4" />
						</Button>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center gap-3">
							<Progress value={progressPct} className="h-2 flex-1" />
							<span className="text-xs font-medium text-muted-foreground">
								{completedSteps}/{checklist.length}
							</span>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							{checklist.map((item) => (
								<div
									key={item.id}
									className="flex gap-3 rounded-xl border border-border/60 bg-background p-3"
								>
									<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
										<item.icon className="h-4 w-4 text-muted-foreground" />
									</span>
									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-2">
											<p className="text-sm font-medium leading-snug">{item.title}</p>
											{statusBadge(item.status)}
										</div>
										<p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
										{item.onAction && item.status !== "done" && (
											<Button variant="link" className="h-auto px-0 text-xs" onClick={item.onAction}>
												Open <ChevronRight className="ml-0.5 h-3 w-3" />
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
				<div className="space-y-4 lg:col-span-2 lg:space-y-6">
					<Card className="rounded-xl border-border/70 shadow-sm">
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between gap-2">
								<div>
									<CardTitle className="text-base">Listening · Trending topics</CardTitle>
									<CardDescription>Sample topics to inspire your next post.</CardDescription>
								</div>
								<Badge variant="outline" className="text-[10px]">
									Suggestions
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{[
								{ topic: "AI workflow automation", volume: "High interest in your industry" },
								{ topic: "Short-form video strategy", volume: "Rising across connected platforms" },
							].map((row) => (
								<div
									key={row.topic}
									className="flex flex-col gap-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div>
										<p className="text-sm font-medium">{row.topic}</p>
										<p className="text-xs text-muted-foreground">{row.volume}</p>
									</div>
									<CreateMenu align="end">
										<Button variant="outline" size="sm">
											Create draft post
										</Button>
									</CreateMenu>
								</div>
							))}
						</CardContent>
					</Card>

					<Card className="rounded-xl border-border/70 shadow-sm">
						<CardHeader className="flex flex-row items-center justify-between pb-3">
							<div>
								<CardTitle className="text-base">Scheduled posts</CardTitle>
								<CardDescription>Content queued to go live.</CardDescription>
							</div>
							<Button variant="ghost" size="sm" onClick={() => setActiveView("calendar")}>
								View calendar
							</Button>
						</CardHeader>
						<CardContent className="space-y-3">
							{scheduledPosts.length === 0 ? (
								<div className="rounded-lg border border-dashed p-6 text-center">
									<Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
									<p className="text-sm font-medium">No scheduled posts</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Schedule content from Create or the Plan calendar.
									</p>
									<CreateMenu align="center">
										<Button className="mt-4" size="sm">
											Create a post
										</Button>
									</CreateMenu>
								</div>
							) : (
								scheduledPosts.slice(0, 4).map((post) => <PostRow key={post.id} post={post} />)
							)}
						</CardContent>
					</Card>

					<Card className="rounded-xl border-border/70 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Drafts</CardTitle>
							<CardDescription>Work in progress before scheduling.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{draftPosts.length === 0 ? (
								<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
									No drafts yet. Start from Create → Post.
								</div>
							) : (
								draftPosts.slice(0, 4).map((post) => <PostRow key={post.id} post={post} />)
							)}
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4 lg:space-y-6">
					<Card className="rounded-xl border-border/70 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Social performance score</CardTitle>
							<CardDescription>Placeholder until analytics are fully wired.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex h-28 items-center justify-center rounded-lg border border-dashed bg-muted/30">
								<div className="text-center">
									<p className="text-3xl font-bold text-muted-foreground/40">—</p>
									<p className="text-xs text-muted-foreground">Score unavailable</p>
								</div>
							</div>
							<Button variant="outline" className="w-full" onClick={() => setActiveView("analytics")}>
								Check progress
							</Button>
						</CardContent>
					</Card>

					<Card className="rounded-xl border-border/70 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Social accounts</CardTitle>
							<CardDescription>{socialAccounts.length} connected</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{socialAccounts.length === 0 ? (
								<div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
									No accounts connected yet.
								</div>
							) : (
								socialAccounts.slice(0, 4).map((account) => (
									<div key={account.id} className="flex items-center gap-3 rounded-lg border p-2.5">
										<PlatformIcon platform={account.platform} className="h-4 w-4 text-muted-foreground" />
										<div className="min-w-0 flex-1">
											<p className="truncate text-sm font-medium">{account.displayName}</p>
											<p className="truncate text-xs text-muted-foreground">@{account.username}</p>
										</div>
										{account.isConnected && (
											<CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-label="Connected" />
										)}
									</div>
								))
							)}
							<Button variant="outline" className="w-full" onClick={() => setActiveView("accounts")}>
								<Users className="mr-2 h-4 w-4" />
								Connect more accounts
							</Button>
						</CardContent>
					</Card>

					<Card className="rounded-xl border-border/70 shadow-sm">
						<CardHeader className="pb-3">
							<CardTitle className="text-base">Most engaging post</CardTitle>
							<CardDescription>Based on published post metrics when available.</CardDescription>
						</CardHeader>
						<CardContent>
							{topPost ? (
								<div className="space-y-2">
									<PostRow post={topPost} />
									<div className="flex gap-4 text-xs text-muted-foreground">
										<span className="flex items-center gap-1">
											<Eye className="h-3 w-3" />
											{(topPost.metrics?.impressions ?? 0).toLocaleString()} impressions
										</span>
									</div>
								</div>
							) : (
								<div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
									Publish posts to see engagement highlights here.
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
