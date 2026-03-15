"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getSession } from "@/app/components/session-utils";

export default function DoctorHomePage() {
  const doctorName = useMemo(() => {
    const session = getSession();
    return session?.role === "doctor" ? session.name : "Doctor";
  }, []);

  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Doctor Dashboard</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-heading)]">Welcome {doctorName}</h2>
        <p className="mt-2 text-sm text-[var(--text-body)]">
          Manage enrolled patients by patient ID and request data transfer only when needed.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/doctor/patients"
            className="rounded-2xl border border-[var(--border)] bg-white p-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
          >
            <p className="text-sm font-semibold text-[var(--text-heading)]">Patients</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Add and manage list</p>
          </Link>

          <Link
            href="/doctor/logs"
            className="rounded-2xl border border-[var(--border)] bg-white p-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
          >
            <p className="text-sm font-semibold text-[var(--text-heading)]">Logs</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Review portal activity</p>
          </Link>
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-[var(--text-heading)]">Connection Rule</h3>
        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-sm text-[var(--text-body)]">
            Doctor and patient are connected strictly by patient ID. After adding a patient ID in the patients page,
            selecting that patient initiates data transfer.
          </p>
        </div>
      </article>
    </section>
  );
}