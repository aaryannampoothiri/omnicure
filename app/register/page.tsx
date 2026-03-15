"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type RegisterResponse = {
  id: string;
  role: "patient" | "doctor";
  message: string;
};

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!name.trim() || !id.trim() || !email.trim() || !password.trim()) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, id, email, password }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<RegisterResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to register account");
      }

      setMessage(data.message ?? "Account created");
      setTimeout(() => router.push("/login"), 900);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Unable to register account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center surf-background px-4 py-10">
      <div className="w-full max-w-md">
        <section className="w-full rounded-2xl bg-white p-8" style={{ boxShadow: "0px 0px 15px 0px rgb(6 125 140 / 0.05), 0px 4.787px 10.531px -3px rgb(6 125 140 / 0.27), 0px 15px 33px -4px rgb(6 125 140 / 0.09)" }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)] mb-1">Secure Enrollment</p>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text-heading)] mb-1">Create account</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Join OmniCure — fill in your details below</p>

          {/* Role selector */}
          <div className="flex rounded-xl bg-[var(--surface)] p-1 mb-6 gap-1">
            {(["doctor", "patient"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex flex-1 items-center justify-center rounded-lg py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  role === r
                    ? "bg-white text-[var(--primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-body)]"
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">Full Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--border-strong)]"
                required
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">
                {role === "doctor" ? "Username" : "Patient ID"}
              </span>
              <input
                value={id}
                onChange={(event) => setId(event.target.value)}
                placeholder={role === "doctor" ? "Choose a username" : "Choose a patient ID"}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--border-strong)]"
                required
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">Email</span>
              <input
                value={email}
                type="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--border-strong)]"
                required
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">Password</span>
              <input
                value={password}
                type="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--border-strong)]"
                required
              />
            </label>

            {error ? (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>
            ) : null}
            {message ? (
              <p className="rounded-lg bg-[var(--primary-light)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--primary)]">{message}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-[var(--text-muted)]">Already have an account? </span>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              Sign in
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
