"use client";

import { useEffect, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

export default function PatientCommentsPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      return;
    }

    fetchPatientOverview(session.id)
      .then(setOverview)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Failed to load doctor advice");
      });
  }, []);

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  if (!overview) {
    return <p className="ui-label text-[var(--text-body)]">Loading doctor advice...</p>;
  }

  return (
    <section className="glass-panel rounded-2xl p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Care Notes</p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Doctor Advice</h2>
      <p className="mt-1 text-sm text-[var(--text-body)]">Latest comments shared by your doctor.</p>

      <div className="mt-5 space-y-3">
        {overview.advice.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-body)]">
            No advice shared yet.
          </div>
        ) : null}
        {overview.advice.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-sm leading-6 text-[var(--text-heading)]">{item.note}</p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {item.doctorName} - {new Date(item.createdAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
