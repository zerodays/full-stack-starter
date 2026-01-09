import { useState, useEffect } from "react"

export default function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMsg(data.message));
  }, []);

  return (
    <div className="h-screen w-screen flex items-center justify-center flex-col gap-8">
      <div className="flex flex-row gap-4">
        <img src="https://react.dev/images/brand/logo_light.svg" alt="React Logo" className="w-10 h-10" />
        <p className="text-4xl font-bold">+</p>
        <img src="https://hono.dev/images/logo.svg" alt="Hono Logo" className="w-10 h-10" />
        <p className="text-4xl font-bold">+</p>
        <img src="https://tailwindcss.com/_next/static/media/tailwindcss-mark.d52e9897.svg" alt="Tailwind CSS Logo" className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-bold">React + Hono + Tailwind CSS</h1>
      <p className="text-lg">
        Server says: <strong>{msg}</strong>
      </p>
    </div>
  );
}
