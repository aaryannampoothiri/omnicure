"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

export default function PatientPrescriptionsPage() {
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
        setError(loadError instanceof Error ? loadError.message : "Failed to load prescriptions");
      });
  }, []);

  const medicationHistory = useMemo(() => {
    return overview?.medications.filter((medication) => medication.taken) ?? [];
  }, [overview]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!overview) {
    return <p className="text-sm text-[var(--text-body)]">Loading prescriptions...</p>;
  }

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Medication Plan</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Prescriptions</h2>
        <div className="mt-4 space-y-3">
          {overview.prescriptions.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-body)]">
              No active prescriptions available.
            </div>
          ) : null}
          {overview.prescriptions.map((prescription) => (
            <div key={prescription.id} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
              <p className="font-semibold text-[var(--text-heading)]">{prescription.medicine}</p>
              <p className="text-[var(--text-body)]">{prescription.dosage} - {prescription.frequency}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {prescription.startDate} to {prescription.endDate}
              </p>
            </div>
          ))}
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Medication History</h2>
        <div className="mt-4 space-y-3">
          {medicationHistory.length === 0 ? (
            <p className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-muted)]">No medication intake logged yet.</p>
          ) : (
            medicationHistory.map((history) => (
              <div key={history.id} className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm">
                <p className="font-semibold text-[var(--text-heading)]">{history.medicine}</p>
                <p className="text-[var(--text-body)]">
                  Taken at {history.takenAt ? new Date(history.takenAt).toLocaleString() : "N/A"}
                </p>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
