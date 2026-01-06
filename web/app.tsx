import { useState, useEffect } from "react";

export default function App() {
  const [msg, setMsg] = useState("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMsg(data.message));
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>React + Hono Setup</h1>
      <p>
        Server says: <strong>{msg}</strong>
      </p>
    </div>
  );
}
