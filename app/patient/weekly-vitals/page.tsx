"use client";

import { useEffect, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

type WeeklyVitalsForm = {
  weekLabel: string;
  averageHeartRateBpm: string;
  averageSpo2: string;
  averageSugarMgDl: string;
  averageSystolic: string;
  averageDiastolic: string;
  adherencePercent: string;
};

const initialForm: WeeklyVitalsForm = {
  weekLabel: "",
  averageHeartRateBpm: "",
  averageSpo2: "",
  averageSugarMgDl: "",
  averageSystolic: "",
  averageDiastolic: "",
  adherencePercent: "",
};

export default function PatientWeeklyVitalsPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [form, setForm] = useState<WeeklyVitalsForm>(initialForm);
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
      setStatus(error instanceof Error ? error.message : "Unable to load weekly vitals");
    });
  }, []);

  const submitWeeklyVitals = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    const response = await fetch(`/api/patient/${session.id}/records/weeklyVitals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        weekLabel: form.weekLabel,
        averageHeartRateBpm: Number(form.averageHeartRateBpm),
        averageSpo2: Number(form.averageSpo2),
        averageSugarMgDl: Number(form.averageSugarMgDl),
        averageSystolic: Number(form.averageSystolic),
        averageDiastolic: Number(form.averageDiastolic),
        adherencePercent: Number(form.adherencePercent),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };

    if (!response.ok || !data.patient) {
      setStatus(data.error ?? "Unable to save weekly vitals");
      return;
    }

    setOverview(data.patient);
    setForm(initialForm);
    setStatus("Weekly vitals updated.");
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Trend Entry</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Update Weekly Vitals</h2>
        <div className="mt-5 grid gap-3">
          <input
            value={form.weekLabel}
            onChange={(event) => setForm((current) => ({ ...current, weekLabel: event.target.value }))}
            placeholder="Week label"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.averageHeartRateBpm}
              onChange={(event) => setForm((current) => ({ ...current, averageHeartRateBpm: event.target.value }))}
              placeholder="Average heart rate"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
            <input
              value={form.averageSpo2}
              onChange={(event) => setForm((current) => ({ ...current, averageSpo2: event.target.value }))}
              placeholder="Average SpO2"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.averageSugarMgDl}
              onChange={(event) => setForm((current) => ({ ...current, averageSugarMgDl: event.target.value }))}
              placeholder="Average sugar"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
            <input
              value={form.adherencePercent}
              onChange={(event) => setForm((current) => ({ ...current, adherencePercent: event.target.value }))}
              placeholder="Adherence percent"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.averageSystolic}
              onChange={(event) => setForm((current) => ({ ...current, averageSystolic: event.target.value }))}
              placeholder="Average systolic"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
            <input
              value={form.averageDiastolic}
              onChange={(event) => setForm((current) => ({ ...current, averageDiastolic: event.target.value }))}
              placeholder="Average diastolic"
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </div>

          <button type="button" onClick={submitWeeklyVitals} className="btn-primary rounded-xl px-4 py-2.5 ui-label">
            Save Weekly Vitals
          </button>
          <p className="text-sm text-[var(--text-body)]">{status}</p>
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Weekly Vitals History</h2>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {(overview?.weeklyVitals ?? []).map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.weekLabel}</p>
              <div className="mt-3 grid gap-2 ui-label text-[var(--text-body)]">
                <p>Avg HR: {item.averageHeartRateBpm} bpm</p>
                <p>Avg SpO2: {item.averageSpo2}%</p>
                <p>Avg Sugar: {item.averageSugarMgDl} mg/dL</p>
                <p>Avg BP: {item.averageSystolic}/{item.averageDiastolic}</p>
              </div>
              <p className="mt-3 ui-label text-[var(--text-body)]">Adherence {item.adherencePercent}%</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}