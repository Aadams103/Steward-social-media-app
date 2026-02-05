import { Link, Outlet } from "@tanstack/react-router";
import { GetStartedModal } from "@/components/auth/GetStartedModal";
import { StewardLogo } from "@/components/StewardLogo";
import { Button } from "@/components/ui/button";
import { SignUpModalProvider, useSignUpModal } from "@/contexts/SignUpModalContext";
import { APP_NAME, APP_SHORT_TAGLINE } from "@/config/brand";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/product", label: "Product" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/security-privacy", label: "Security & Privacy" },
  { to: "/docs", label: "Docs" },
  { to: "/contact", label: "Contact" },
] as const;

function MarketingHeader() {
  const { openSignUp, isOpen, closeSignUp } = useSignUpModal();
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--steward-steel)]/40 bg-[var(--steward-surface)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <StewardLogo variant="mark" size={36} />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[var(--steward-silver)]">{APP_NAME}</span>
              <span className="text-xs text-[var(--steward-steel)]">{APP_SHORT_TAGLINE}</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-2 text-sm font-medium text-[var(--steward-steel)] hover:text-[var(--steward-silver)] rounded-md transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/auth"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Login
            </Link>
            <Button
              type="button"
              className="bg-[var(--steward-blue)] text-[var(--steward-silver)] hover:bg-[var(--steward-blue)]/90"
              onClick={openSignUp}
            >
              Get started
            </Button>
          </div>
        </div>
      </header>
      <GetStartedModal open={isOpen} onOpenChange={(open) => { if (!open) closeSignUp(); }} />
    </>
  );
}

export function MarketingLayout() {
  return (
    <SignUpModalProvider>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <MarketingHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      <footer className="border-t border-border py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/security-privacy" className="hover:text-foreground">Security & Privacy</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
    </SignUpModalProvider>
  );
}
