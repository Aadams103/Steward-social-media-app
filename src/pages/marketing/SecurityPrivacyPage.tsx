import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Shield, Lock, FileCheck } from "lucide-react";

export function SecurityPrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[var(--text-h1)] font-semibold tracking-tight text-foreground">
        Security & Privacy
      </h1>
      <p className="mt-2 text-[var(--text-body)] text-muted-foreground max-w-2xl">
        We take security and privacy seriously. Your data and credentials are protected.
      </p>

      <div className="mt-12 space-y-8">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-[var(--text-h3)] font-semibold text-foreground">
              Data protection
            </h2>
            <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
              OAuth tokens and credentials are stored securely. We never store your social account passwords.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-[var(--text-h3)] font-semibold text-foreground">
              Access control
            </h2>
            <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
              Role-based access, approval workflows, and audit logs so you know who did what and when.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-[var(--text-h3)] font-semibold text-foreground">
              Compliance
            </h2>
            <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
              Brand rules, forbidden topics, and compliance checks help you stay on-side with policy.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Button variant="outline" asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
