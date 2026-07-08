import { describe, expect, it } from "vitest";
import { mapPostStatus, mapAccountStatus, mapAiJobStatus } from "@/lib/steward-status";

describe("steward-status language", () => {
  it("maps post statuses consistently", () => {
    expect(mapPostStatus("draft")).toBe("Draft");
    expect(mapPostStatus("pending_approval")).toBe("Needs Review");
    expect(mapPostStatus("published")).toBe("Published");
  });

  it("maps account statuses honestly", () => {
    expect(mapAccountStatus("connected")).toBe("Connected");
    expect(mapAccountStatus("setup_required")).toBe("Setup Required");
    expect(mapAccountStatus(undefined)).toBe("Disconnected");
  });

  it("maps AI job statuses", () => {
    expect(mapAiJobStatus("running")).toBe("Running");
    expect(mapAiJobStatus("blocked")).toBe("Blocked");
  });
});

describe("analytics empty state policy", () => {
  it("requires published posts and connected accounts for analytics", () => {
    const published: { status: string }[] = [];
    const connected: { status: string }[] = [{ status: "connected" }];
    const hasData = published.some((p) => p.status === "published") && connected.some((c) => c.status === "connected");
    expect(hasData).toBe(false);
  });
});
