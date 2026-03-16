"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type LoginResponse = {
  id: string;
  name: string;
  role: "patient" | "doctor";
  needsProfileSetup?: boolean;
};

const DEMO_CREDENTIALS = {
  doctor: {
    id: "demo_doc",
    password: "demo123",
  },
  patient: {
    id: "demo_patient",
    password: "demo123",
  },
} as const;

const DoctorIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="6" cy="5" r="2" />
    <path d="M6 7v6c0 2 2 4 4 4h1" />
    <path d="M11 17h4a5 5 0 0 0 5-5V5h-4" />
    <circle cx="17" cy="5" r="2" />
  </svg>
);

const PatientIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="7" r="3" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/patient");
    router.prefetch("/doctor");
  }, [router]);

  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (nextRole: "patient" | "doctor") => {
    setRole(nextRole);
  };

  const autofillDemo = (nextRole: "patient" | "doctor") => {
    setRole(nextRole);
    setId(DEMO_CREDENTIALS[nextRole].id);
    setPassword(DEMO_CREDENTIALS[nextRole].password);
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!id.trim() || !password.trim()) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, password, role }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<LoginResponse> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to login");
      }

      localStorage.setItem(
        "omnicure_session",
        JSON.stringify({
          id: data.id,
          name: data.name,
          role: data.role,
          needsProfileSetup: Boolean(data.needsProfileSetup),
        }),
      );

      const nextParam = new URLSearchParams(window.location.search).get("next");
      const destination = nextParam
        || (data.role === "patient" && data.needsProfileSetup ? "/patient/profile?setup=1" : data.role === "doctor" ? "/doctor" : "/patient");
      router.replace(destination);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : "Unable to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center surf-background px-4 py-10">
      <div className="w-full max-w-md">
        {/* Card */}
        <section className="w-full rounded-2xl bg-white p-8" style={{ boxShadow: "0px 0px 15px 0px rgb(6 125 140 / 0.05), 0px 4.787px 10.531px -3px rgb(6 125 140 / 0.27), 0px 15px 33px -4px rgb(6 125 140 / 0.09)" }}>
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="OmniCure" width={196} height={68} priority className="h-14 w-auto object-contain" />
          </div>

          {/* Heading */}
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text-heading)] mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--text-muted)] mb-6">Sign in to your OmniCure account</p>

          {/* Role selector */}
          <div className="flex rounded-xl bg-[var(--surface)] p-1 mb-6 gap-1">
            {(["doctor", "patient"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  role === r
                    ? "bg-white text-[var(--primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-body)]"
                }`}
              >
                {r === "doctor" ? <DoctorIcon /> : <PatientIcon />}
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">
                {role === "doctor" ? "Username" : "Patient ID"}
              </span>
              <input
                value={id}
                onChange={(event) => setId(event.target.value)}
                placeholder={role === "doctor" ? "Enter username" : "Enter patient ID"}
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
                placeholder="Enter password"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--border-strong)]"
                required
              />
            </label>

            {error ? (
              <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-sm text-[var(--text-muted)]">Don&apos;t have an account? </span>
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            >
              Register
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Demo Credentials</p>
            <div className="mt-2 grid gap-2">
              <div className="rounded-lg border border-[var(--border)] bg-white p-2 text-xs text-[var(--text-body)]">
                <p className="font-semibold text-[var(--text-heading)]">Doctor</p>
                <p>ID: demo_doc</p>
                <p>Password: demo123</p>
                <button
                  type="button"
                  onClick={() => autofillDemo("doctor")}
                  className="mt-1 text-[11px] font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  Use doctor demo
                </button>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-white p-2 text-xs text-[var(--text-body)]">
                <p className="font-semibold text-[var(--text-heading)]">Patient</p>
                <p>ID: demo_patient</p>
                <p>Password: demo123</p>
                <button
                  type="button"
                  onClick={() => autofillDemo("patient")}
                  className="mt-1 text-[11px] font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  Use patient demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
