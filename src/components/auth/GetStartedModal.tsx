import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  X,
} from "lucide-react";

const signUpSchema = z.object({
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long")
    .trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),
  orgName: z
    .string()
    .min(2, "Organization name is required")
    .max(100, "Organization name is too long")
    .trim(),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export type GetStartedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GetStartedModal({ open, onOpenChange }: GetStartedModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", orgName: "" },
  });

  // Reset step when modal is closed (e.g. from parent) so next open starts fresh
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(1);
        setSignUpError(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const onSignUpSubmit = async (data: SignUpFormValues) => {
    if (isLoading) return;
    setSignUpError(null);
    setIsLoading(true);

    const client = supabase.client;
    if (!client) {
      setSignUpError("Authentication is not configured. Please try again later.");
      setIsLoading(false);
      return;
    }

    const { data: authData, error: signUpErr } = await client.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
      },
    });

    if (signUpErr) {
      setSignUpError(signUpErr.message ?? "Sign up failed. Please try again.");
      setIsLoading(false);
      return;
    }

    const user = authData.user;
    if (!user) {
      setSignUpError("Account created but session could not be established. Try logging in.");
      setIsLoading(false);
      return;
    }

    const { error: profileErr } = await client
      .from("profiles")
      .insert({
        id: user.id,
        display_name: data.fullName,
        email: data.email,
        full_name: data.fullName,
      });

    if (profileErr) {
      setSignUpError(
        "Account created but profile could not be saved. You can complete setup after logging in."
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setStep(2);
  };

  const handleSocialConnect = async (provider: "twitter" | "linkedin_oidc") => {
    const client = supabase.client;
    if (!client) return;
    await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    });
    // OAuth redirects the user away from the modal; no need to close it here.
  };

  const onCompleteSetup = () => {
    onOpenChange(false);
    navigate({ to: "/app" });
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setStep(1), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] p-0 gap-0 border-border overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* CUSTOM HEADER with Explicit X Button */}
        <div className="bg-primary p-6 text-primary-foreground relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight">
              {step === 1 && "Create your Workspace"}
              {step === 2 && "Connect a Channel"}
            </h2>
            <p className="text-primary-foreground/80 text-sm mt-1.5">
              {step === 1 && "Start managing your social presence today."}
              {step === 2 && "Connect one account to get the data flowing. You will be redirected to the provider to sign in."}
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 bg-background">
          {/* STEP 1: FORM */}
          {step === 1 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit(onSignUpSubmit)(e);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...form.register("fullName")}
                      className="pl-9"
                      placeholder="Jane Doe"
                      autoFocus
                    />
                  </div>
                  {form.formState.errors.fullName && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...form.register("orgName")}
                      className="pl-9"
                      placeholder="Acme Inc."
                    />
                  </div>
                  {form.formState.errors.orgName && (
                    <p className="text-destructive text-xs">
                      {form.formState.errors.orgName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Work Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...form.register("email")}
                    type="email"
                    className="pl-9"
                    placeholder="jane@company.com"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    {...form.register("password")}
                    className="pl-9"
                    placeholder="••••••••"
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {signUpError && (
                <p className="text-destructive text-sm" role="alert">
                  {signUpError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Account
              </Button>
            </form>
          )}

          {/* STEP 2: SOCIAL CONNECT - OAuth redirects user away from modal */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <ConnectButton
                  icon="/brand/steward/steward-mark-black.svg"
                  label="Connect X (Twitter)"
                  provider="twitter"
                  onConnect={handleSocialConnect}
                />
                <ConnectButton
                  icon="/brand/steward/steward-mark-black.svg"
                  label="Connect LinkedIn"
                  provider="linkedin_oidc"
                  onConnect={handleSocialConnect}
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCompleteSetup}
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
                <Button type="button" onClick={onCompleteSetup} className="gap-2">
                  Continue to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConnectButton({
  icon,
  label,
  provider,
  onConnect,
}: {
  icon: string;
  label: string;
  provider: "twitter" | "linkedin_oidc";
  onConnect: (provider: "twitter" | "linkedin_oidc") => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onConnect(provider)}
      className="flex items-center p-3 border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left w-full group"
    >
      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center mr-3">
        <img src={icon} alt="" className="h-4 w-4 opacity-70" role="presentation" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
