import * as React from "react";
import {
	Bot,
	Megaphone,
	MessageSquare,
	PenSquare,
	Sparkles,
	TrendingUp,
	Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface CreateMenuProps {
	children: React.ReactNode;
	align?: "start" | "center" | "end";
	side?: "top" | "right" | "bottom" | "left";
	className?: string;
}

type MenuItemDef = {
	id: string;
	label: string;
	description?: string;
	icon: React.ComponentType<{ className?: string }>;
	status?: "new" | "soon";
	onSelect: () => void;
	disabled?: boolean;
};

export function CreateMenu({
	children,
	align = "end",
	side = "bottom",
	className,
}: CreateMenuProps) {
	const setActiveView = useAppStore((s) => s.setActiveView);
	const [open, setOpen] = React.useState(false);

	const comingSoon = (label: string) => {
		toast.message(`${label} is coming soon`, {
			description: "This capability is on the Steward roadmap.",
		});
		setOpen(false);
	};

	const items: MenuItemDef[] = [
		{
			id: "post",
			label: "Post",
			description: "Compose and schedule a social post",
			icon: PenSquare,
			onSelect: () => {
				setActiveView("compose");
				setOpen(false);
			},
		},
		{
			id: "ai",
			label: "Content with AI",
			description: "Generate drafts with OwlGPT",
			icon: Sparkles,
			onSelect: () => {
				setActiveView("autopilot");
				setOpen(false);
			},
		},
		{
			id: "dm",
			label: "DM automation",
			description: "Automate direct message workflows",
			icon: MessageSquare,
			status: "soon",
			disabled: true,
			onSelect: () => comingSoon("DM automation"),
		},
		{
			id: "youtube",
			label: "YouTube video",
			description: "Plan and publish video content",
			icon: Youtube,
			status: "soon",
			disabled: true,
			onSelect: () => comingSoon("YouTube video publishing"),
		},
		{
			id: "ad",
			label: "Ad",
			description: "Create a paid social campaign",
			icon: Megaphone,
			status: "soon",
			disabled: true,
			onSelect: () => comingSoon("Ads"),
		},
		{
			id: "boost",
			label: "Automated boost",
			description: "Boost top-performing posts automatically",
			icon: TrendingUp,
			status: "new",
			disabled: true,
			onSelect: () => comingSoon("Automated boost"),
		},
	];

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent
				align={align}
				side={side}
				className={cn("w-[min(100vw-2rem,320px)] p-1", className)}
			>
				{items.map((item, index) => (
					<React.Fragment key={item.id}>
						{index === 4 && <DropdownMenuSeparator />}
						<DropdownMenuItem
							disabled={item.disabled}
							onSelect={(e) => {
								e.preventDefault();
								item.onSelect();
							}}
							className="flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer"
						>
							<span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
								<item.icon className="h-4 w-4" />
							</span>
							<span className="flex min-w-0 flex-1 flex-col gap-0.5">
								<span className="flex items-center gap-2 text-sm font-medium">
									{item.label}
									{item.status === "new" && (
										<Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
											New
										</Badge>
									)}
									{item.status === "soon" && (
										<Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
											Coming soon
										</Badge>
									)}
								</span>
								{item.description && (
									<span className="text-xs text-muted-foreground">{item.description}</span>
								)}
							</span>
						</DropdownMenuItem>
					</React.Fragment>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/** Primary header CTA — opens the shared Create menu. */
export function CreatePostButton({
	size = "default",
	variant = "default",
	className,
}: {
	size?: "default" | "sm" | "lg";
	variant?: "default" | "outline" | "secondary";
	className?: string;
}) {
	return (
		<CreateMenu align="end">
			<Button size={size} variant={variant} className={className}>
				Create a post
			</Button>
		</CreateMenu>
	);
}
