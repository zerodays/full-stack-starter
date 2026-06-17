import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { signIn, signOut, signUp, useSession } from "~/lib/auth-client";
import { withSpan } from "~/tracing";

export function AuthDemo() {
  const { t } = useTranslation("common");
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Demo User");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = () =>
    withSpan("auth.sign_up", { component: "AuthDemo" }, async () => {
      setError(null);
      setStatus(t("signingUp"));

      const result = await signUp.email({ email, password, name });

      if (result.error) {
        setError(result.error.message ?? t("signupFailed"));
        setStatus(null);
      } else {
        setStatus(t("signedUpSuccess"));
      }
    });

  const handleSignIn = () =>
    withSpan("auth.sign_in", { component: "AuthDemo" }, async () => {
      setError(null);
      setStatus(t("signingIn"));

      const result = await signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? t("signinFailed"));
        setStatus(null);
      } else {
        setStatus(t("signedInSuccess"));
      }
    });

  const handleSignOut = () =>
    withSpan("auth.sign_out", { component: "AuthDemo" }, async () => {
      setError(null);
      setStatus(t("signingOut"));

      await signOut();
      setStatus(t("signedOutSuccess"));
    });

  if (isPending) {
    return <div className="text-muted-foreground">{t("loadingSession")}</div>;
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border p-6">
      <h2 className="font-semibold text-xl">{t("authDemoTitle")}</h2>

      {session ? (
        <div className="flex flex-col gap-4">
          <div className="rounded bg-green-50 p-3 text-green-800 text-sm dark:bg-green-950 dark:text-green-200">
            <p className="font-medium">{t("signedInAs")}</p>
            <p>{session.user.name}</p>
            <p className="text-green-600 dark:text-green-400">
              {session.user.email}
            </p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            {t("signOut")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder={t("authNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder={t("authEmailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder={t("authPasswordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleSignUp} className="flex-1">
              {t("signUp")}
            </Button>
            <Button variant="outline" onClick={handleSignIn} className="flex-1">
              {t("signIn")}
            </Button>
          </div>
        </div>
      )}

      {status && <p className="text-muted-foreground text-sm">{status}</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <p className="text-muted-foreground text-xs">{t("authSpanNote")}</p>
    </div>
  );
}
