/**
 * Wraps a plan-gated feature. Renders children when the current organization's
 * plan includes the feature; otherwise shows a polished upgrade CTA instead of
 * broken or silently disabled UI.
 */

import type * as React from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppStore } from "@/store/app-store";
import type { PlanFeature } from "@/types/app";
import {
	FEATURE_LABELS,
	getUpgradeMessage,
	hasFeature,
} from "@/lib/plan-capabilities";

interface UpgradeGateProps {
	feature: PlanFeature;
	children: React.ReactNode;
	/** Optional extra context shown under the headline. */
	description?: string;
}

export function UpgradeGate({ feature, children, description }: UpgradeGateProps) {
	const { currentOrganization, setActiveView } = useAppStore();

	const plan = currentOrganization?.billingPlan ?? "free";
	if (hasFeature(plan, feature)) {
		return <>{children}</>;
	}

	return (
		<Card className="border-dashed">
			<CardContent className="flex flex-col items-center gap-4 py-12 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					<Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
				</div>
				<div className="space-y-1">
					<h3 className="text-lg font-semibold">
						{FEATURE_LABELS[feature]} is locked
					</h3>
					<p className="text-sm text-muted-foreground max-w-md">
						{getUpgradeMessage(feature)}
						{description ? ` ${description}` : ""}
					</p>
				</div>
				<Button onClick={() => setActiveView("settings")} className="gap-2">
					<Sparkles className="h-4 w-4" aria-hidden="true" />
					View Plans
				</Button>
			</CardContent>
		</Card>
	);
}
