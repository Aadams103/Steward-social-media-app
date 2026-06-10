import * as React from "react";
import { format } from "date-fns";
import {
	Bot,
	CalendarDays,
	Loader2,
	Sparkles,
	Send,
	Wand2,
	Hash,
	Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import {
	useAutopilotBrief,
	useAutopilotGenerate,
	useCreatePost,
	useCurrentBrand,
	useGenerateStrategyPlan,
	usePosts,
	useSocialAccounts,
} from "@/hooks/use-api";
import type { AutopilotDraftPost, AutopilotGenerateResponse } from "@/types/app";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const QUICK_PROMPTS = [
	{ id: "captions", label: "3 caption ideas", icon: Wand2 },
	{ id: "plan", label: "Weekly content plan", icon: CalendarDays },
	{ id: "hashtags", label: "Hashtag suggestions", icon: Hash },
	{ id: "ideas", label: "Post ideas for my brand", icon: Lightbulb },
] as const;

export function FlightAIView() {
	const setActiveView = useAppStore((s) => s.setActiveView);
	const { brandProfile, activeBrandId } = useAppStore();

	const { data: briefData, isLoading: briefLoading } = useAutopilotBrief();
	const { data: brandData } = useCurrentBrand();
	const { data: accountsData } = useSocialAccounts();
	const { data: postsData } = usePosts();

	const generatePlan = useGenerateStrategyPlan();
	const generateAutopilot = useAutopilotGenerate();
	const createPost = useCreatePost();

	const [prompt, setPrompt] = React.useState("");
	const [outputs, setOutputs] = React.useState<AutopilotGenerateResponse | null>(null);
	const [isGenerating, setIsGenerating] = React.useState(false);

	const isAllMode = activeBrandId === "all";
	const connectedAccounts = (accountsData?.accounts ?? []).filter((a) => a.isConnected);
	const brandName = brandData?.name ?? brandProfile?.brandName ?? briefData?.brandName ?? "your brand";
	const hasBrief = Boolean((briefData?.brandName ?? "").trim());
	const scheduledCount = (postsData?.posts ?? []).filter((p) => p.status === "scheduled").length;

	const runGeneration = async (userPrompt?: string) => {
		if (isAllMode) {
			toast.error("Select a specific brand to use Flight AI.");
			return;
		}
		if (!hasBrief) {
			toast.message("Complete your brand brief first", {
				description: "Flight AI uses your Autopilot brief for on-brand suggestions.",
				action: {
					label: "Open Autopilot",
					onClick: () => setActiveView("autopilot"),
				},
			});
			return;
		}

		setIsGenerating(true);
		try {
			const from = format(new Date(), "yyyy-MM-dd");
			const to = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
			const result = await generateAutopilot.mutateAsync({ from, to });
			setOutputs(result);
			if (userPrompt) {
				toast.success("Flight AI generated content based on your brand context.");
			} else {
				toast.success("Content plan and drafts are ready for review.");
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Flight AI could not generate content.");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleQuickPrompt = async (id: (typeof QUICK_PROMPTS)[number]["id"]) => {
		const labels: Record<string, string> = {
			captions: `Write 3 caption ideas for ${brandName}`,
			plan: `Generate a weekly content plan for ${brandName}`,
			hashtags: `Suggest hashtags for ${brandName}'s next post`,
			ideas: `Give me post ideas for ${brandName}`,
		};
		setPrompt(labels[id] ?? "");
		if (id === "plan") {
			setIsGenerating(true);
			try {
				await generatePlan.mutateAsync();
				await runGeneration(labels[id]);
			} catch {
				setIsGenerating(false);
			}
		} else {
			await runGeneration(labels[id]);
		}
	};

	const sendDraftToQueue = async (draft: AutopilotDraftPost) => {
		try {
			await createPost.mutateAsync({
				content: draft.caption,
				platform: draft.platform,
				status: "draft",
				hashtags: draft.hashtags,
				authorId: "user1",
			});
			toast.success("Draft saved — review in Plan or Autopilot.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save draft.");
		}
	};

	if (briefLoading) {
		return (
			<div className="mx-auto max-w-[960px] space-y-4">
				<LoadingSkeleton className="h-10 w-64" />
				<LoadingSkeleton className="h-48 w-full rounded-xl" />
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-[960px] space-y-6">
			<div>
				<h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
					<Sparkles className="h-6 w-6 text-primary" />
					Flight AI
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Your AI social media manager — captions, ideas, strategy, and calendar help for{" "}
					<span className="font-medium text-foreground">{brandName}</span>.
				</p>
			</div>

			{isAllMode && (
				<Alert>
					<Bot className="h-4 w-4" />
					<AlertTitle>All Brands view</AlertTitle>
					<AlertDescription>
						Select a single brand to generate on-brand content with Flight AI.
					</AlertDescription>
				</Alert>
			)}

			{!hasBrief && !isAllMode && (
				<Alert>
					<Lightbulb className="h-4 w-4" />
					<AlertTitle>Brand brief recommended</AlertTitle>
					<AlertDescription className="flex flex-wrap items-center gap-2">
						Flight AI works best with your Autopilot brand brief.
						<Button size="sm" variant="outline" onClick={() => setActiveView("autopilot")}>
							Configure Autopilot
						</Button>
					</AlertDescription>
				</Alert>
			)}

			<Card className="rounded-xl border-border/70 shadow-sm">
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Ask Flight AI</CardTitle>
					<CardDescription>
						{connectedAccounts.length > 0
							? `${connectedAccounts.length} connected account${connectedAccounts.length === 1 ? "" : "s"} · ${scheduledCount} scheduled post${scheduledCount === 1 ? "" : "s"}`
							: "Connect accounts for platform-aware suggestions."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Textarea
						placeholder="Ask Flight AI for captions, post ideas, a weekly plan, or hashtag suggestions…"
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						rows={3}
						className="resize-none"
					/>
					<div className="flex flex-wrap gap-2">
						{QUICK_PROMPTS.map((item) => (
							<Button
								key={item.id}
								type="button"
								variant="outline"
								size="sm"
								className="gap-1.5"
								disabled={isGenerating || isAllMode}
								onClick={() => handleQuickPrompt(item.id)}
							>
								<item.icon className="h-3.5 w-3.5" />
								{item.label}
							</Button>
						))}
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							disabled={isGenerating || isAllMode || !prompt.trim()}
							onClick={() => runGeneration(prompt.trim())}
							className="gap-2"
						>
							{isGenerating ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Send className="h-4 w-4" />
							)}
							Ask Flight AI
						</Button>
						<Button variant="outline" onClick={() => setActiveView("autopilot")}>
							Open Autopilot
						</Button>
					</div>
				</CardContent>
			</Card>

			{outputs && (
				<div className="grid gap-4 lg:grid-cols-2">
					<Card className="rounded-xl">
						<CardHeader className="pb-2">
							<CardTitle className="text-base">Plan summary</CardTitle>
							<CardDescription>Ready to review — not published automatically.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<p>{outputs.plan.overview}</p>
							<div>
								<p className="mb-1 font-medium">Content pillars</p>
								<ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
									{outputs.plan.pillars.map((pillar, i) => (
										<li key={i}>{pillar}</li>
									))}
								</ul>
							</div>
							<Button size="sm" variant="outline" onClick={() => setActiveView("calendar")}>
								Review in Plan
							</Button>
						</CardContent>
					</Card>

					<Card className="rounded-xl">
						<CardHeader className="pb-2">
							<CardTitle className="text-base">Draft posts</CardTitle>
							<CardDescription>{outputs.drafts.length} drafts · status: Ready to draft</CardDescription>
						</CardHeader>
						<CardContent className="max-h-80 space-y-3 overflow-y-auto">
							{outputs.drafts.map((draft, i) => (
								<div key={i} className="rounded-lg border border-border/60 p-3">
									<div className="mb-2 flex items-center gap-2">
										<PlatformIcon platform={draft.platform} className="h-4 w-4" />
										<Badge variant="outline" className="text-[10px] capitalize">
											{draft.platform}
										</Badge>
										<Badge variant="secondary" className="text-[10px]">
											Needs approval
										</Badge>
									</div>
									<p className="line-clamp-3 text-sm">{draft.caption}</p>
									{draft.hashtags && draft.hashtags.length > 0 && (
										<p className="mt-1 text-xs text-muted-foreground">
											{draft.hashtags.map((h) => `#${h}`).join(" ")}
										</p>
									)}
									<div className="mt-2 flex gap-2">
										<Button size="sm" variant="outline" onClick={() => sendDraftToQueue(draft)}>
											Save draft
										</Button>
										<Button size="sm" onClick={() => setActiveView("autopilot")}>
											Send to Autopilot
										</Button>
									</div>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			)}

			<Card className="rounded-xl border-dashed">
				<CardContent className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-sm font-medium">Turn suggestions into a managed calendar</p>
						<p className="text-xs text-muted-foreground">
							Flight AI drafts content · Autopilot schedules and queues · Plan shows your calendar.
						</p>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={() => setActiveView("calendar")}>
							Open Plan
						</Button>
						<Button size="sm" onClick={() => setActiveView("autopilot")}>
							Configure Autopilot
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
