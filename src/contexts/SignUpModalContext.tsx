import * as React from "react";

type SignUpModalContextValue = {
  openSignUp: () => void;
  closeSignUp: () => void;
  isOpen: boolean;
};

const SignUpModalContext = React.createContext<SignUpModalContextValue | null>(null);

export function SignUpModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const value: SignUpModalContextValue = React.useMemo(
    () => ({
      openSignUp: () => setIsOpen(true),
      closeSignUp: () => setIsOpen(false),
      isOpen,
    }),
    [isOpen],
  );
  return (
    <SignUpModalContext.Provider value={value}>
      {children}
    </SignUpModalContext.Provider>
  );
}

export function useSignUpModal() {
  const ctx = React.useContext(SignUpModalContext);
  if (!ctx) {
    return {
      openSignUp: () => {},
      closeSignUp: () => {},
      isOpen: false,
    };
  }
  return ctx;
}
