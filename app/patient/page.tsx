"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

const quickLinks = [
  { href: "/patient/profile", label: "Profile" },
  { href: "/patient/vitals", label: "Vitals" },
  { href: "/patient/medications", label: "Medications" },
  { href: "/patient/history", label: "Medical History" },
  { href: "/patient/lab-reports", label: "Lab Reports" },
];

const slotConfig = [
  { key: "07:30", label: "Morning", timeLabel: "07:30 AM" },
  { key: "13:00", label: "Afternoon", timeLabel: "01:00 PM" },
  { key: "17:00", label: "Evening", timeLabel: "05:00 PM" },
  { key: "20:30", label: "Night", timeLabel: "08:30 PM" },
] as const;

export default function PatientDashboardPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const loadOverview = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    const patient = await fetchPatientOverview(session.id);
    setOverview(patient);
  };

  useEffect(() => {
    loadOverview().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load patient overview");
    });
  }, []);

  const todaysDoses = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (overview?.medications ?? [])
      .filter((entry) => entry.dueAt.slice(0, 10) === today)
      .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime());
  }, [overview]);

  const dosesBySlot = useMemo(() => {
    const grouped = {
      "07:30": [] as typeof todaysDoses,
      "13:00": [] as typeof todaysDoses,
      "17:00": [] as typeof todaysDoses,
      "20:30": [] as typeof todaysDoses,
    };

    for (const dose of todaysDoses) {
      const slot = new Date(dose.dueAt).toISOString().slice(11, 16) as keyof typeof grouped;
      if (slot in grouped) {
        grouped[slot].push(dose);
      }
    }

    return grouped;
  }, [todaysDoses]);

  const markTaken = async (medicationId: string) => {
    const session = getSession();
    if (!session) {
      return;
    }

    const response = await fetch(`/api/patient/${session.id}/medications/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ medicationId }),
    });

    const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };

    if (!response.ok || !data.patient) {
      setStatus(data.error ?? "Unable to log intake");
      return;
    }

    setOverview(data.patient);
    setStatus("Medication intake logged.");
  };

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!overview) {
    return <p className="ui-label text-[var(--text-body)]">Loading patient overview...</p>;
  }

  return (
    <section className="grid gap-5">
      <article className="glass-panel rounded-2xl p-6">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Patient Summary</p>
            <h2 className="mt-2 text-[1.65rem] font-bold leading-tight text-[var(--text-heading)]">{overview.name}</h2>
            <p className="mt-2 text-sm text-[var(--text-body)]">
              {overview.condition} - Age {overview.age} - {overview.heightCm} cm - {overview.weightKg} kg
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--primary-light)] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Care Access</p>
            <p className="mt-2 text-sm text-[var(--text-body)]">Your records are shared with the doctor only when a transfer is requested.</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="status-dot" />
              Transfer on doctor request
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Vitals Entries</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-heading)]">{overview.dailyVitals.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Weekly Trends</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-heading)]">{overview.weeklyVitals.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Medications</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-heading)]">{overview.careMedications.length}</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Lab Reports</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-heading)]">{overview.labReports.length}</p>
          </div>
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-[var(--text-heading)]">Update Portals</h3>
            <p className="mt-1 text-sm text-[var(--text-body)]">Choose a section to update your records.</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-[var(--border)] bg-white p-4 text-left transition hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
            >
              <p className="text-sm font-semibold text-[var(--text-heading)]">{link.label}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Open section</p>
            </Link>
          ))}
        </div>
      </article>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-[var(--text-heading)]">Medication Intake Today</h3>
          <p className="mt-1 text-sm text-[var(--text-body)]">Morning 07:30, Afternoon 01:00, Evening 05:00, Night 08:30.</p>
          <div className="mt-4 grid gap-3">
            {slotConfig.map((slot) => {
              const slotDoses = dosesBySlot[slot.key];
              return (
                <div key={slot.key} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {slot.label} ({slot.timeLabel})
                  </p>
                  <div className="mt-3 space-y-2">
                    {slotDoses.length === 0 ? (
                      <p className="text-sm text-[var(--text-body)]">No medicine</p>
                    ) : (
                      slotDoses.map((dose) => (
                        <div key={dose.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                          <p className="text-sm font-medium text-[var(--text-heading)]">{dose.medicine}</p>
                          <button
                            type="button"
                            onClick={() => markTaken(dose.id)}
                            disabled={dose.taken}
                            className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--text-body)] disabled:bg-[var(--primary-light)] disabled:text-[var(--primary)]"
                          >
                            {dose.taken ? "Taken" : "Mark Taken"}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            <p className="text-sm text-[var(--text-body)]">{status}</p>
          </div>
        </article>

        <article className="glass-panel rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-[var(--text-heading)]">Current Snapshot</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Blood Pressure</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-heading)]">{overview.health.bloodPressure}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Heart Rate</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-heading)]">{overview.health.heartRateBpm} bpm</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">SpO2</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-heading)]">{overview.health.spo2}%</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Sugar</p>
              <p className="mt-2 text-xl font-semibold text-[var(--text-heading)]">{overview.health.sugarMgDl} mg/dL</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}