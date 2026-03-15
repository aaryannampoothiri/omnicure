"use client";

import { useEffect, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

type HistoryForm = {
  title: string;
  category: "condition" | "surgery" | "allergy" | "visit";
  recordedOn: string;
  details: string;
};

const initialForm: HistoryForm = {
  title: "",
  category: "condition",
  recordedOn: "",
  details: "",
};

export default function PatientHistoryPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [form, setForm] = useState<HistoryForm>(initialForm);
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
    loadOverview().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Unable to load medical history");
    });
  }, []);

  const submitHistory = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    const response = await fetch(`/api/patient/${session.id}/records/medicalHistory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };

    if (!response.ok || !data.patient) {
      setStatus(data.error ?? "Unable to save medical history");
      return;
    }

    setOverview(data.patient);
    setForm(initialForm);
    setStatus("Medical history updated.");
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Records</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Update Medical History</h2>
        <div className="mt-5 grid gap-3">
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="History title"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as HistoryForm["category"],
                }))
              }
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            >
              <option value="condition">Condition</option>
              <option value="surgery">Surgery</option>
              <option value="allergy">Allergy</option>
              <option value="visit">Visit</option>
            </select>
            <input
              value={form.recordedOn}
              type="date"
              onChange={(event) => setForm((current) => ({ ...current, recordedOn: event.target.value }))}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </div>
          <textarea
            value={form.details}
            onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))}
            rows={5}
            placeholder="Details"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <button type="button" onClick={submitHistory} className="btn-primary rounded-xl px-4 py-2.5 ui-label">
            Save Medical History
          </button>
          <p className="text-sm text-[var(--text-body)]">{status}</p>
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Medical History Timeline</h2>
        <div className="mt-4 space-y-3">
          {overview?.medicalHistory.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="ui-label text-[var(--text-heading)]">{item.title}</p>
                <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {item.category}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--text-body)]">{item.recordedOn}</p>
              <p className="mt-2 text-sm text-[var(--text-body)]">{item.details}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}