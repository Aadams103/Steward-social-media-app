import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="text-[var(--text-h1)] font-semibold tracking-tight text-foreground">
        Pricing
      </h1>
      <p className="mt-2 text-[var(--text-body)] text-muted-foreground max-w-2xl">
        Early Access — join the waitlist and we&apos;ll reach out with pricing and onboarding.
      </p>

      <Card className="mt-12 max-w-md">
        <CardHeader>
          <CardTitle className="text-[var(--text-h2)]">Early Access</CardTitle>
          <p className="text-[var(--text-body)] text-muted-foreground">
            Be among the first to run your social presence on Steward.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-[var(--text-small)] text-foreground">
            {[
              "Manual, Approval, and Autopilot modes",
              "Brand Profile and content pillars",
              "Approval workflows and audit log",
              "Per-platform analytics and CSV export",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <Button asChild className="w-full">
            <Link to="/contact">Join waitlist</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button variant="outline" asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
