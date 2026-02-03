import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "@tanstack/react-router";
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
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  orgName: z.string().min(2, "Organization name is required"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export type GetStartedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GetStartedModal({ open, onOpenChange }: GetStartedModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "", orgName: "" },
  });

  // Reset step when modal is closed (e.g. from parent) so next open starts fresh
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => setStep(1), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const onSignUpSubmit = async (data: SignUpFormValues) => {
    if (isLoading) return;
    setIsLoading(true);
    console.log("Creating Account:", data);

    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 1500);
  };

  const onCompleteSetup = () => {
    setStep(3);
    setTimeout(() => {
      onOpenChange(false);
      navigate({ to: "/app" });
    }, 2000);
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
              {step === 3 && "Initializing..."}
            </h2>
            <p className="text-primary-foreground/80 text-sm mt-1.5">
              {step === 1 && "Start managing your social presence today."}
              {step === 2 && "Connect one account to get the data flowing."}
              {step === 3 && "We are setting up your secure environment."}
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

          {/* STEP 2: SOCIAL CONNECT */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-3">
                <ConnectButton
                  icon="/brand/steward/steward-mark-black.svg"
                  label="Connect X (Twitter)"
                />
                <ConnectButton
                  icon="/brand/steward/steward-mark-black.svg"
                  label="Connect LinkedIn"
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

          {/* STEP 3: LOADING */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Finalizing account setup...
              </p>
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
}: {
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center p-3 border border-input rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors text-left w-full group"
    >
      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center mr-3">
        <img src={icon} alt="" className="h-4 w-4 opacity-70" role="presentation" />
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
