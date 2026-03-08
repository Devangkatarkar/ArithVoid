"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErr(error.message);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[#355A78]">
          Email
        </label>
        <input
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl bg-white/60 px-4 py-3 text-[#0A2342] outline-none ring-1 ring-white/40 backdrop-blur transition placeholder:text-[#7d96ab] focus:ring-[#7CC7F2]"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[#355A78]">
          Password
        </label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl bg-white/60 px-4 py-3 text-[#0A2342] outline-none ring-1 ring-white/40 backdrop-blur transition placeholder:text-[#7d96ab] focus:ring-[#7CC7F2]"
          required
        />
      </div>

      {err ? (
        <div className="rounded-2xl bg-red-50/85 px-4 py-3 text-sm text-red-600 backdrop-blur">
          {err}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-[#0A2342] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#123A63] disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-xs text-[#6B879D]">
        Access is limited to authorized company accounts.
      </p>
    </form>
  );
}