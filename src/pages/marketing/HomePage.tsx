import { Link } from "@tanstack/react-router";
import { StewardLogo } from "@/components/StewardLogo";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

/**
 * Marketing homepage hero. Copy must match exactly (headline, subhead, proof row, skeptic).
 */
export function HomePage() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex justify-center mb-8">
          <StewardLogo variant="full" scheme="dark" height={40} />
        </div>

        <h1 className="text-center text-[var(--text-h1)] font-semibold tracking-tight text-foreground sm:text-4xl">
          First-Class Care for Your Brand&apos;s Presence.
        </h1>

        <p className="mt-4 text-center text-[var(--text-body)] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Steward autonomously publishes, monitors, and protects your social media—so you don&apos;t have to.
        </p>

        <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 list-none">
          <li className="flex items-center gap-2 text-[var(--text-body)] text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
            On-brand content, automatically
          </li>
          <li className="flex items-center gap-2 text-[var(--text-body)] text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
            Approvals when you want them
          </li>
          <li className="flex items-center gap-2 text-[var(--text-body)] text-foreground">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
            Monitoring that doesn&apos;t miss mentions
          </li>
        </ul>

        <p className="mt-8 text-center text-[var(--text-body)] text-muted-foreground max-w-2xl mx-auto">
          Steward is an autonomous social media manager you configure once to run your presence safely.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/app">Get started</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/product">Learn more</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
