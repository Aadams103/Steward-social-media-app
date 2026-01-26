import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom";
import { SettingsOverlay, type SettingsSectionId } from "./SettingsOverlay";

describe("SettingsOverlay", () => {
  const renderOverlay = (section: SettingsSectionId = "my-account") => {
    const onOpenChange = vi.fn();
    const onSectionChange = vi.fn();
    render(
      <SettingsOverlay
        open
        section={section}
        onOpenChange={onOpenChange}
        onSectionChange={onSectionChange}
      />
    );
    return { onOpenChange, onSectionChange };
  };

  it("renders My Account explainer when opened on my-account", () => {
    renderOverlay("my-account");
    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(
      screen.getByText(/personal identity and preferences as the human operator/i)
    ).toBeInTheDocument();
  });

  it("switches sections when a different tab is clicked", async () => {
    const user = userEvent.setup();
    const { onSectionChange } = renderOverlay("my-account");
    const stewardTab = screen.getByRole("tab", { name: /My Steward/i });
    await user.click(stewardTab);
    expect(onSectionChange).toHaveBeenCalledWith("my-steward");
  });
});

