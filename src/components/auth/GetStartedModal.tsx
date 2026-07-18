import { useNavigate } from "@tanstack/react-router";
import { LockKeyhole, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type GetStartedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function GetStartedModal({ open, onOpenChange }: GetStartedModalProps) {
  const navigate = useNavigate();

  const goToLogin = () => {
    onOpenChange(false);
    void navigate({ to: "/auth" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-[500px] [&>button]:hidden" showCloseButton={false}>
        <div className="relative bg-primary p-6 text-primary-foreground">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-full p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="text-center">
            <DialogTitle className="text-xl font-bold tracking-tight">Private build</DialogTitle>
            <DialogDescription className="mt-1.5 text-sm text-primary-foreground/80">
              Steward is currently available to its owner while live publishing is completed.
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-5 bg-background p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium">Owner access only</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Public account creation is paused. The finished release will open with controlled access.
            </p>
          </div>
          <Button type="button" className="w-full" onClick={goToLogin}>
            Owner login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
