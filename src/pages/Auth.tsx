import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2, LockKeyhole, Mail } from "lucide-react";
import { loginWithEmail } from "@/auth/login";
import { AppLogo } from "@/components/AppLogo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) {
        void navigate({ to: "/app" });
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;

    setMessage(null);
    setIsLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      await navigate({ to: "/app" });
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--steward-bg)] px-4 py-8 text-slate-950 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-slate-300 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Steward
        </Link>

        <Card className="border-white/10 shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex justify-center">
              <AppLogo variant="lockup" theme="dark" size={36} />
            </div>
            <div>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription className="mt-2">
                Log in to manage your brands, content, approvals, and publishing.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-11 pl-9"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-11 pl-9"
                    required
                  />
                </div>
              </div>

              {!isSupabaseConfigured ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    Authentication is not configured for this deployment.
                  </AlertDescription>
                </Alert>
              ) : null}

              {message ? (
                <Alert variant="destructive" role="alert">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}

              <Button
                type="submit"
                className="min-h-11 w-full"
                disabled={isLoading || !isSupabaseConfigured}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Log in
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New to Steward?{" "}
                <Link to="/" className="font-medium text-primary hover:underline">
                  Create your workspace
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
