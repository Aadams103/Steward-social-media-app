import { StewardLogo } from "@/components/StewardLogo";
import { Button } from "@/components/ui/button";
import { useSignUpModal } from "@/contexts/SignUpModalContext";
import { APP_NAME, APP_SHORT_TAGLINE } from "@/config/brand";

/**
 * Landing page (index). Does NOT redirect on session — always shows and waits for user input.
 * "Get started" opens the sign-up modal; "Login" in the header goes to /login.
 */
export function LandingPage() {
  const { openSignUp } = useSignUpModal();

  return (
    <section className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center bg-[var(--steward-bg)] text-[var(--steward-silver)] py-12 px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="flex justify-center">
          <StewardLogo variant="lockup" size={56} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[var(--steward-silver)]">
            {APP_NAME}
          </h1>
          <p className="text-lg text-[var(--steward-steel)]">
            {APP_SHORT_TAGLINE}
          </p>
        </div>
        <Button
          size="lg"
          className="bg-[var(--steward-blue)] text-[var(--steward-silver)] hover:bg-[var(--steward-blue)]/90 text-base px-8"
          onClick={openSignUp}
        >
          Get started
        </Button>
        <p className="text-sm text-[var(--steward-steel)]">
          Already have an account? Use the Log in button above.
        </p>
      </div>
    </section>
  );
}
