import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2, Settings, Play, BarChart3 } from "lucide-react";

const STEPS = [
  { icon: Link2, title: "Connect", description: "Link your social accounts and brand." },
  { icon: Settings, title: "Set brand rules", description: "Define voice, do/don'ts, and content pillars." },
  { icon: Play, title: "Run", description: "Choose Manual, Approval, or Autopilot and let Steward work." },
  { icon: BarChart3, title: "Review", description: "Check analytics, top posts, and exports." },
] as const;

export function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[var(--text-h1)] font-semibold tracking-tight text-foreground">
        How it Works
      </h1>
      <p className="mt-2 text-[var(--text-body)] text-muted-foreground max-w-2xl">
        Connect → Set brand rules → Run → Review. Four steps to autonomous, on-brand social.
      </p>

      <ol className="mt-12 space-y-8">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <li key={title} className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[var(--text-h3)] font-semibold text-foreground">
                {i + 1}. {title}
              </h2>
              <p className="mt-1 text-[var(--text-body)] text-muted-foreground">
                {description}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight className="ml-auto hidden h-5 w-5 text-muted-foreground sm:block" />
            )}
          </li>
        ))}
      </ol>

      <div className="mt-12 flex gap-4">
        <Button asChild>
          <Link to="/app">Get started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/product">Product</Link>
        </Button>
      </div>
    </div>
  );
}
