import { useState } from "react";
import { loginWithEmail } from "../auth/login";
import { signUpWithEmail } from "../auth/signup";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignUp() {
    setMessage("Signing up...");
    try {
      await signUpWithEmail(email, password, displayName || undefined);
      setMessage("Signed up successfully.");
    } catch (error: any) {
      setMessage(error?.message ?? "Failed to sign up.");
    }
  }

  async function handleLogin() {
    setMessage("Logging in...");
    try {
      await loginWithEmail(email, password);
      setMessage("Logged in successfully.");
    } catch (error: any) {
      setMessage(error?.message ?? "Failed to log in.");
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: 480, margin: "0 auto" }}>
      <h1>Auth</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label>
          Display name (signup only)
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button type="button" onClick={handleSignUp}>
            Sign Up
          </button>
          <button type="button" onClick={handleLogin}>
            Log In
          </button>
        </div>
        {message && (
          <p style={{ marginTop: "0.75rem" }}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

