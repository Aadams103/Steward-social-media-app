import * as React from "react";
import { FileEdit, Filter, LayoutGrid, MessageSquare, PenTool, Sparkles, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import { usePosts } from "@/hooks/use-api";
import { cn } from "@/lib/utils";

type PlanSection = "calendar" | "drafts" | "content" | "approvals" | "dm" | "whiteboard";

interface PlanPageProps {
	/** Existing calendar workspace (week/month/day views). */
	calendar: React.ReactNode;
}

function PlanPlaceholder({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<Card className="rounded-xl border-dashed">
			<CardHeader>
				<CardTitle className="text-base">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground">Coming soon in a future Steward release.</p>
			</CardContent>
		</Card>
	);
}

export function PlanPage({ calendar }: PlanPageProps) {
	const [section, setSection] = React.useState<PlanSection>("calendar");
	const setActiveView = useAppStore((s) => s.setActiveView);
	const { data: postsData } = usePosts();
	const drafts = (postsData?.posts ?? []).filter((p) => p.status === "draft");

	return (
		<div className="mx-auto max-w-[1240px] space-y-4 px-0 md:space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Plan</h1>
				<p className="text-sm text-muted-foreground">Your content calendar and workflow hub.</p>
			</div>

			<Tabs value={section} onValueChange={(v) => setSection(v as PlanSection)}>
				<TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
					{[
						{ id: "calendar" as const, label: "Calendar" },
						{ id: "drafts" as const, label: "Drafts", count: drafts.length },
						{ id: "content" as const, label: "Content" },
						{ id: "approvals" as const, label: "Approvals" },
						{ id: "dm" as const, label: "DM automation" },
						{ id: "whiteboard" as const, label: "Whiteboard", badge: "New" },
					].map((tab) => (
						<TabsTrigger
							key={tab.id}
							value={tab.id}
							className={cn(
								"rounded-full border border-transparent px-4 py-1.5 text-sm data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm",
							)}
						>
							{tab.label}
							{"count" in tab && (tab.count ?? 0) > 0 && (
								<Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px]">
									{tab.count}
								</Badge>
							)}
							{"badge" in tab && tab.badge && (
								<Badge className="ml-2 h-5 px-1.5 text-[10px]">{tab.badge}</Badge>
							)}
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{section === "calendar" && (
				<Card className="rounded-xl border-border/70 bg-muted/20 shadow-sm">
					<CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
								<Sparkles className="h-4 w-4 text-primary" />
							</span>
							<div>
								<p className="text-sm font-medium">Flight AI suggestions</p>
								<p className="text-xs text-muted-foreground">
									Generate a weekly plan or fill empty calendar slots — review before scheduling.
								</p>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button size="sm" variant="outline" onClick={() => setActiveView("flight-ai")}>
								Generate plan with Flight AI
							</Button>
							<Button size="sm" onClick={() => setActiveView("autopilot")}>
								<Bot className="mr-1.5 h-3.5 w-3.5" />
								Send to Autopilot
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{section === "calendar" && calendar}

			{section === "drafts" && (
				<div className="space-y-4">
					{drafts.length === 0 ? (
						<PlanPlaceholder
							title="No drafts"
							description="Draft posts you save from Create will appear here."
						/>
					) : (
						drafts.map((post) => (
							<Card key={post.id} className="rounded-xl">
								<CardContent className="flex items-center justify-between gap-4 p-4">
									<div className="min-w-0">
										<p className="line-clamp-2 text-sm">{post.content}</p>
										<p className="mt-1 text-xs capitalize text-muted-foreground">{post.platform}</p>
									</div>
									<Button size="sm" variant="outline" onClick={() => setActiveView("compose")}>
										Edit
									</Button>
								</CardContent>
							</Card>
						))
					)}
				</div>
			)}

			{section === "content" && (
				<PlanPlaceholder title="Content library" description="Organize reusable assets and templates." />
			)}
			{section === "approvals" && (
				<PlanPlaceholder
					title="Approvals"
					description="Review posts before they go live."
				/>
			)}
			{section === "dm" && (
				<PlanPlaceholder title="DM automation" description="Automated direct message workflows." />
			)}
			{section === "whiteboard" && (
				<PlanPlaceholder title="Whiteboard" description="Visual campaign planning board." />
			)}
		</div>
	);
}

/** Compact filters button for the calendar toolbar. */
export const PlanCalendarFiltersButton = React.forwardRef<
	HTMLButtonElement,
	React.ComponentPropsWithoutRef<typeof Button>
>(function PlanCalendarFiltersButton({ className, ...props }, ref) {
	return (
		<Button ref={ref} variant="outline" size="sm" className={cn("gap-2", className)} {...props}>
			<Filter className="h-4 w-4" />
			Filters
		</Button>
	);
});

export const PLAN_SECTION_ICONS = {
	drafts: FileEdit,
	content: LayoutGrid,
	approvals: PenTool,
	dm: MessageSquare,
};
