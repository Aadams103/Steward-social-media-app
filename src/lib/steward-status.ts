/** Consistent Steward status language across the product UI. */

export type PostStatusLabel =
  | "Idea"
  | "Draft"
  | "Generated"
  | "Needs Review"
  | "Approved"
  | "Scheduled"
  | "Publishing"
  | "Published"
  | "Failed"
  | "Archived";

export type AiJobStatusLabel = "Queued" | "Running" | "Succeeded" | "Failed" | "Blocked" | "Canceled";

export type ApprovalStatusLabel =
  | "Not Required"
  | "Needs Review"
  | "Changes Requested"
  | "Approved"
  | "Rejected";

export type AccountStatusLabel =
  | "Connected"
  | "Disconnected"
  | "Expired"
  | "Limited"
  | "Setup Required";

export type PublishStatusLabel =
  | "Queued"
  | "Locked"
  | "Publishing"
  | "Succeeded"
  | "Failed"
  | "Retrying"
  | "Canceled"
  | "Skipped";

export function mapPostStatus(raw?: string | null): PostStatusLabel {
  const s = (raw ?? "draft").toLowerCase().replace(/_/g, " ");
  const map: Record<string, PostStatusLabel> = {
    idea: "Idea",
    draft: "Draft",
    generated: "Generated",
    pending: "Needs Review",
    "pending approval": "Needs Review",
    "needs review": "Needs Review",
    approved: "Approved",
    scheduled: "Scheduled",
    publishing: "Publishing",
    published: "Published",
    failed: "Failed",
    archived: "Archived",
  };
  return map[s] ?? "Draft";
}

export function mapAiJobStatus(raw?: string | null): AiJobStatusLabel {
  const s = (raw ?? "queued").toLowerCase();
  const map: Record<string, AiJobStatusLabel> = {
    queued: "Queued",
    running: "Running",
    succeeded: "Succeeded",
    failed: "Failed",
    blocked: "Blocked",
    canceled: "Canceled",
  };
  return map[s] ?? "Queued";
}

export function mapPublishStatus(raw?: string | null): PublishStatusLabel {
  const s = (raw ?? "queued").toLowerCase();
  const map: Record<string, PublishStatusLabel> = {
    queued: "Queued",
    locked: "Locked",
    publishing: "Publishing",
    succeeded: "Succeeded",
    failed: "Failed",
    retrying: "Retrying",
    canceled: "Canceled",
    skipped: "Skipped",
  };
  return map[s] ?? "Queued";
}

export function mapAccountStatus(raw?: string | null): AccountStatusLabel {
  const s = (raw ?? "disconnected").toLowerCase();
  if (s === "connected" || s === "active") return "Connected";
  if (s === "expired" || s === "token_expired") return "Expired";
  if (s === "limited" || s === "partial") return "Limited";
  if (s === "setup_required" || s === "pending") return "Setup Required";
  return "Disconnected";
}
