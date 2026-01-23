import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, CheckCircle2, Send, Calendar } from "lucide-react";

export function ProductPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[var(--text-h1)] font-semibold tracking-tight text-foreground">
        Product
      </h1>
      <p className="mt-2 text-[var(--text-body)] text-muted-foreground max-w-2xl">
        Steward offers three modes so you stay in control: Manual, Approval, and Autopilot.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Send className="h-5 w-5" />
            </div>
            <CardTitle className="text-[var(--text-h3)]">Manual</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-small)] text-muted-foreground">
            You request generation and manually publish or schedule. Full control, no surprises.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-[var(--text-h3)]">Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-small)] text-muted-foreground">
            AI runs automatically; every post requires your approval. Approvers, time windows, and audit logs.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <CardTitle className="text-[var(--text-h3)]">Autopilot</CardTitle>
          </CardHeader>
          <CardContent className="text-[var(--text-small)] text-muted-foreground">
            AI runs and publishes on schedule. Set brand rules once, then let Steward run your presence safely.
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="text-[var(--text-h2)] font-semibold text-foreground">Brand Profile</h2>
        <p className="mt-2 text-[var(--text-body)] text-muted-foreground max-w-2xl">
          Voice traits, do/don&apos;t rules, forbidden topics, compliance checks, and content pillars—all in one place.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link to="/app">Try Steward</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/how-it-works">How it works</Link>
        </Button>
      </div>
    </div>
  );
}
