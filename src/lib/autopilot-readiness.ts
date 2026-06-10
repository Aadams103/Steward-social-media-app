import type { AutopilotBrief, AutopilotSettings, BrandProfile, SocialAccount } from "@/types/app";

export type AutopilotReadinessStatus = "setup_needed" | "ready" | "active" | "paused";

export interface AutopilotReadiness {
	status: AutopilotReadinessStatus;
	label: string;
	hasBrandProfile: boolean;
	hasConnectedAccounts: boolean;
	hasBrief: boolean;
	hasCadence: boolean;
	hasScheduledContent: boolean;
}

export function getAutopilotReadiness(input: {
	brandProfile: BrandProfile | null;
	socialAccounts: SocialAccount[];
	brief: AutopilotBrief | null | undefined;
	settings: AutopilotSettings;
	scheduledCount: number;
}): AutopilotReadiness {
	const hasBrandProfile = Boolean(input.brandProfile?.brandName?.trim());
	const hasConnectedAccounts = input.socialAccounts.some((a) => a.isConnected);
	const hasBrief = Boolean((input.brief?.brandName ?? "").trim());
	const hasCadence = Object.values(input.settings.platformCadence ?? {}).some((n) => n > 0);
	const hasScheduledContent = input.scheduledCount > 0;

	const setupComplete =
		hasBrandProfile && hasConnectedAccounts && hasBrief && hasCadence;

	let status: AutopilotReadinessStatus = "setup_needed";
	if (input.settings.isPaused) {
		status = "paused";
	} else if (input.settings.operatingMode !== "manual" && setupComplete) {
		status = "active";
	} else if (setupComplete) {
		status = "ready";
	}

	const label =
		status === "paused"
			? "Paused"
			: status === "active"
				? "Active"
				: status === "ready"
					? "Ready"
					: "Setup needed";

	return {
		status,
		label,
		hasBrandProfile,
		hasConnectedAccounts,
		hasBrief,
		hasCadence,
		hasScheduledContent,
	};
}
