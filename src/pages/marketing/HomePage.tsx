import { Link, useNavigate } from "@tanstack/react-router";
import { StewardLogo } from "@/components/StewardLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Home/login: center card with lockup + email/password form.
 * Uses Steward CSS tokens (--steward-bg, --steward-surface, --steward-silver, --steward-steel, --steward-blue).
 */
export function HomePage() {
  const navigate = useNavigate();

  return (
    <section className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-[var(--steward-bg)] text-[var(--steward-silver)] py-12 px-4">
      <div className="w-full max-w-md rounded-lg bg-[var(--steward-surface)] p-8 shadow-xl">
        <div className="flex justify-center mb-8">
          <StewardLogo variant="lockup" size={44} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/app" });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[var(--steward-silver)]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              className="bg-[var(--steward-bg)]/50 border-[var(--steward-steel)]/50 text-[var(--steward-silver)] placeholder:text-[var(--steward-steel)]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[var(--steward-silver)]">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              className="bg-[var(--steward-bg)]/50 border-[var(--steward-steel)]/50 text-[var(--steward-silver)] placeholder:text-[var(--steward-steel)]"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[var(--steward-blue)] text-[var(--steward-silver)] hover:bg-[var(--steward-blue)]/90"
          >
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--steward-steel)]">
          New to Steward?{" "}
          <Link to="/app" className="text-[var(--steward-silver)] underline hover:no-underline">
            Get started
          </Link>
        </p>
      </div>
    </section>
  );
}
