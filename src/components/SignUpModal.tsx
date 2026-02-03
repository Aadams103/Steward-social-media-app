import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SignUpModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Placeholder sign-up modal. Replace with real sign-up form (e.g. Supabase auth) when ready.
 */
export function SignUpModal({ open, onOpenChange }: SignUpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create an account</DialogTitle>
          <DialogDescription>
            Sign up for Steward to start managing your social media. (Sign-up form coming soon.)
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Placeholder: connect your auth provider (e.g. Supabase sign-up) here.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
