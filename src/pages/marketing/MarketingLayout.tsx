import { Link, Outlet } from "@tanstack/react-router";
import { StewardLogo } from "@/components/StewardLogo";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/brand";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/product", label: "Product" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/security-privacy", label: "Security & Privacy" },
  { to: "/docs", label: "Docs" },
  { to: "/contact", label: "Contact" },
] as const;

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-sidebar-border bg-sidebar">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <StewardLogo variant="full" height={32} />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <Link to="/app">Log in</Link>
            </Button>
            <Button asChild className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
              <Link to="/app">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
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
  );
}
