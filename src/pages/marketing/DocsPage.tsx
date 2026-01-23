import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Bot, Settings, BarChart3 } from "lucide-react";

const SECTIONS = [
  { icon: Bot, title: "Modes & Autopilot", description: "Manual, Approval, and Autopilot. How to configure and switch." },
  { icon: Settings, title: "Brand Profile", description: "Voice, do/don'ts, forbidden topics, and content pillars." },
  { icon: BarChart3, title: "Analytics", description: "Per-platform metrics, top posts, time series, and CSV export." },
] as const;

export function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[var(--text-h1)] font-semibold tracking-tight text-foreground">
        Docs & Help Center
      </h1>
      <p className="mt-2 text-[var(--text-body)] text-muted-foreground max-w-2xl">
        Guides and references to get the most out of Steward.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        {SECTIONS.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-[var(--text-h3)]">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-[var(--text-small)] text-muted-foreground">
              {description}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 flex items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 py-4">
        <BookOpen className="h-8 w-8 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-[var(--text-body)] font-medium text-foreground">
            Full documentation coming soon.
          </p>
          <p className="text-[var(--text-small)] text-muted-foreground">
            For now, explore the app or get in touch for support.
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link to="/app">Open app</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/contact">Contact</Link>
        </Button>
      </div>
    </div>
  );
}
