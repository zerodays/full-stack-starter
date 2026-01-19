import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AuthDemo } from "~/components/auth-demo";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import i18n from "./i18n/i18n";
import { api } from "./lib/api";
import { withSpan } from "./tracing";

export default function App() {
  const { t } = useTranslation("common");
  const [name, setName] = useState("");

  const demoTraceOptions = api["demo-trace"].$get.mutationOptions({});
  const demoTrace = useMutation({
    ...demoTraceOptions,
    mutationFn: (args: Parameters<typeof demoTraceOptions.mutationFn>[0]) =>
      withSpan("ui.click.demo_trace", { component: "App" }, () =>
        demoTraceOptions.mutationFn(args),
      ),
  });

  const msg = demoTrace.isPending
    ? "Loading..."
    : (demoTrace.data?.message ?? t("enterName"));

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
      <div className="flex gap-2">
        <Input
          placeholder={t("namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && name && demoTrace.mutate({ query: { name } })
          }
        />
        <Button
          onClick={() => demoTrace.mutate({ query: { name } })}
          disabled={!name}
        >
          {t("sayHello")}
        </Button>
      </div>
      <Button
        variant="outline"
        onClick={() =>
          i18n.changeLanguage(i18n.language === "en" ? "sl" : "en")
        }
      >
        {t("switchLang")}
      </Button>
      <AuthDemo />
    </div>
  );
}
