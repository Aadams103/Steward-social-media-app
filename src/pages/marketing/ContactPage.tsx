import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare } from "lucide-react";

export function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[var(--text-h1)] font-semibold tracking-tight text-foreground">
        Contact
      </h1>
      <p className="mt-2 text-[var(--text-body)] text-muted-foreground max-w-2xl">
        Demo, waitlist, or general questions—we&apos;re here to help.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        <a
          href="mailto:hello@steward.app"
          className="flex gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-[var(--text-h3)] font-semibold text-foreground">
              Email
            </h2>
            <p className="mt-1 text-[var(--text-small)] text-muted-foreground">
              hello@steward.app — Demo, waitlist, support.
            </p>
          </div>
        </a>
        <a
          href="#"
          className="flex gap-4 rounded-lg border border-border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-[var(--text-h3)] font-semibold text-foreground">
              Waitlist
            </h2>
            <p className="mt-1 text-[var(--text-small)] text-muted-foreground">
              Join early access and we&apos;ll be in touch.
            </p>
          </div>
        </a>
      </div>

      <div className="mt-12">
        <Button variant="outline" asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
