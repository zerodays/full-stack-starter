import { useState } from "react";
import { Button } from "~/components/ui/button";
import { signIn, signOut, signUp, useSession } from "~/lib/auth-client";
import { withSpan } from "~/tracing";

export function AuthDemo() {
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Demo User");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = () =>
    withSpan("auth.sign_up", { component: "AuthDemo" }, async () => {
      setError(null);
      setStatus("Signing up...");

      const result = await signUp.email({ email, password, name });

      if (result.error) {
        setError(result.error.message ?? "Signup failed");
        setStatus(null);
      } else {
        setStatus("Signed up successfully!");
      }
    });

  const handleSignIn = () =>
    withSpan("auth.sign_in", { component: "AuthDemo" }, async () => {
      setError(null);
      setStatus("Signing in...");

      const result = await signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Sign in failed");
        setStatus(null);
      } else {
        setStatus("Signed in successfully!");
      }
    });

  const handleSignOut = () =>
    withSpan("auth.sign_out", { component: "AuthDemo" }, async () => {
      setError(null);
      setStatus("Signing out...");

      await signOut();
      setStatus("Signed out successfully!");
    });

  if (isPending) {
    return <div className="text-muted-foreground">Loading session...</div>;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border p-6">
      <h2 className="font-semibold text-xl">Auth Demo</h2>

      {session ? (
        <div className="flex flex-col gap-4">
          <div className="rounded bg-green-50 p-3 text-green-800 text-sm dark:bg-green-950 dark:text-green-200">
            <p className="font-medium">Signed in as:</p>
            <p>{session.user.name}</p>
            <p className="text-green-600 dark:text-green-400">
              {session.user.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleSignUp} className="flex-1">
              Sign Up
            </Button>
            <Button variant="outline" onClick={handleSignIn} className="flex-1">
              Sign In
            </Button>
          </div>
        </div>
      )}

      {status && <p className="text-muted-foreground text-sm">{status}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-muted-foreground text-xs">
        Auth actions are wrapped in OpenTelemetry spans. Check Axiom for traces!
      </p>
    </div>
  );
}
