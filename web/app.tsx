import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AuthDemo } from "~/components/auth-demo";
import { Button } from "~/components/ui/button";
import i18n from "./i18n/i18n";
import { withSpan } from "./tracing";

export default function App() {
  const { t } = useTranslation("common");

  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMsg(data.message));
  }, []);

  const triggerTrace = async () => {
    setMsg("Starting trace...");

    await withSpan(
      "ui.click.demo_button",
      { component: "App", event: "click" },
      async () => {
        const res = await fetch("/api/demo-trace");
        const data = await res.json();
        setMsg(data.message);
      },
    );
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-8">
      <div className="flex flex-row gap-4">
        <img
          src="https://react.dev/images/brand/logo_light.svg"
          alt="React Logo"
          className="h-10 w-10"
        />
        <p className="font-bold text-4xl">+</p>
        <img
          src="https://hono.dev/images/logo.svg"
          alt="Hono Logo"
          className="h-10 w-10"
        />
        <p className="font-bold text-4xl">+</p>
        <img
          src="https://tailwindcss.com/_next/static/media/tailwindcss-mark.d52e9897.svg"
          alt="Tailwind CSS Logo"
          className="h-10 w-10"
        />
      </div>
      <h1 className="font-bold text-4xl">React + Hono + Tailwind CSS</h1>
      <p className="text-lg">
        <Trans
          i18nKey="serverSays"
          values={{ message: msg }}
          components={{ strong: <strong /> }}
        />
      </p>
      <Button
        onClick={() =>
          i18n.changeLanguage(i18n.language === "en" ? "sl" : "en")
        }
      >
        {t("testMe")}
      </Button>
      <Button variant="outline" onClick={triggerTrace}>
        Trigger OpenTelemetry Trace
      </Button>
      <AuthDemo />
    </div>
  );
}
