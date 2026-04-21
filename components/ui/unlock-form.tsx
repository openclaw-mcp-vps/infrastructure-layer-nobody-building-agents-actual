"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnlockForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error || "Unable to unlock access.");
        return;
      }

      setMessage("Access unlocked. Redirecting to your dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error while verifying purchase email.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleUnlock} className="shell mt-4 p-5">
      <label htmlFor="unlock-email" className="text-sm font-medium">
        Already paid? Unlock with your checkout email
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <input
          id="unlock-email"
          className="input"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
        />
        <button className="btn btn-secondary" type="submit" disabled={busy}>
          {busy ? "Unlocking..." : "Unlock"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-green-300">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </form>
  );
}
