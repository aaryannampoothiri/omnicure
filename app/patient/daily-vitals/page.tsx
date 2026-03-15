"use client";

import { useEffect, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

type DailyVitalsForm = {
  recordedAt: string;
  bloodPressure: string;
  heartRateBpm: string;
  spo2: string;
  sugarMgDl: string;
  temperatureC: string;
};

const initialForm: DailyVitalsForm = {
  recordedAt: "",
  bloodPressure: "",
  heartRateBpm: "",
  spo2: "",
  sugarMgDl: "",
  temperatureC: "",
};

export default function PatientDailyVitalsPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [form, setForm] = useState<DailyVitalsForm>(initialForm);
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
      setStatus(error instanceof Error ? error.message : "Unable to load daily vitals");
    });
  }, []);

  const submitDailyVital = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    const response = await fetch(`/api/patient/${session.id}/records/dailyVitals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recordedAt: form.recordedAt,
        bloodPressure: form.bloodPressure,
        heartRateBpm: Number(form.heartRateBpm),
        spo2: Number(form.spo2),
        sugarMgDl: Number(form.sugarMgDl),
        temperatureC: Number(form.temperatureC),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };

    if (!response.ok || !data.patient) {
      setStatus(data.error ?? "Unable to save daily vitals");
      return;
    }

    setOverview(data.patient);
    setForm(initialForm);
    setStatus("Daily vitals updated.");
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Vitals Entry</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Update Daily Vitals</h2>
        <div className="mt-5 grid gap-3">
          <input
            type="datetime-local"
            value={form.recordedAt}
            onChange={(event) => setForm((current) => ({ ...current, recordedAt: event.target.value }))}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <input
            value={form.bloodPressure}
            onChange={(event) => setForm((current) => ({ ...current, bloodPressure: event.target.value }))}
            placeholder="Blood pressure"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.heartRateBpm}
              onChange={(event) => setForm((current) => ({ ...current, heartRateBpm: event.target.value }))}
              placeholder="Heart rate bpm"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
            <input
              value={form.spo2}
              onChange={(event) => setForm((current) => ({ ...current, spo2: event.target.value }))}
              placeholder="SpO2"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.sugarMgDl}
              onChange={(event) => setForm((current) => ({ ...current, sugarMgDl: event.target.value }))}
              placeholder="Sugar mg/dL"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
            <input
              value={form.temperatureC}
              onChange={(event) => setForm((current) => ({ ...current, temperatureC: event.target.value }))}
              placeholder="Temperature C"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </div>

          <button type="button" onClick={submitDailyVital} className="btn-primary rounded-xl px-4 py-2.5 ui-label">
            Save Daily Vitals
          </button>
          <p className="text-sm text-[var(--text-body)]">{status}</p>
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Recorded Daily Vitals</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Recorded</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">BP</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Heart Rate</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">SpO2</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Sugar</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Temp</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.dailyVitals ?? []).map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] text-[var(--text-body)]">
                  <td className="px-3 py-2">{new Date(item.recordedAt).toLocaleString()}</td>
                  <td className="px-3 py-2">{item.bloodPressure}</td>
                  <td className="px-3 py-2">{item.heartRateBpm} bpm</td>
                  <td className="px-3 py-2">{item.spo2}%</td>
                  <td className="px-3 py-2">{item.sugarMgDl} mg/dL</td>
                  <td className="px-3 py-2">{item.temperatureC} C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}