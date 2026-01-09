import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

export default function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMsg(data.message));
  }, []);

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
        Server says: <strong>{msg}</strong>
      </p>
      <Button>Test me</Button>
    </div>
  );
}
