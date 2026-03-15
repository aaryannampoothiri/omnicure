"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

type VitalsForm = {
  recordedAt: string;
  heartRateBpm: string;
  spo2: string;
  sugarMgDl: string;
  bloodPressure: string;
  temperatureC: string;
};

const initialForm: VitalsForm = {
  recordedAt: "",
  heartRateBpm: "",
  spo2: "",
  sugarMgDl: "",
  bloodPressure: "",
  temperatureC: "",
};

export default function PatientVitalsPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [form, setForm] = useState<VitalsForm>(initialForm);
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
      setStatus(error instanceof Error ? error.message : "Unable to load vitals");
    });
  }, []);

  const submitDailyVitals = async () => {
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
        recordedAt: form.recordedAt || new Date().toISOString(),
        heartRateBpm: Number(form.heartRateBpm),
        spo2: Number(form.spo2),
        sugarMgDl: Number(form.sugarMgDl),
        bloodPressure: form.bloodPressure,
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
    setStatus("Vitals saved.");
  };

  const comparisonData = useMemo(() => {
    const thisWeek = overview?.weeklyVitals.find((item) => item.weekLabel.toLowerCase().includes("this"));
    const previousWeek = overview?.weeklyVitals.find((item) => item.weekLabel.toLowerCase().includes("previous"));

    if (!thisWeek || !previousWeek) {
      return [];
    }

    return [
      { metric: "Heart Rate", thisWeek: thisWeek.averageHeartRateBpm, previousWeek: previousWeek.averageHeartRateBpm },
      { metric: "SpO2", thisWeek: thisWeek.averageSpo2, previousWeek: previousWeek.averageSpo2 },
      { metric: "Sugar", thisWeek: thisWeek.averageSugarMgDl, previousWeek: previousWeek.averageSugarMgDl },
      { metric: "Systolic", thisWeek: thisWeek.averageSystolic, previousWeek: previousWeek.averageSystolic },
      { metric: "Diastolic", thisWeek: thisWeek.averageDiastolic, previousWeek: previousWeek.averageDiastolic },
    ];
  }, [overview]);

  return (
    <section className="grid gap-5">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Vitals Console</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Daily Entry + Weekly Trend</h2>
        <p className="mt-1 text-sm text-[var(--text-body)]">Capture today’s measurements and compare with the previous week.</p>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <input
            type="datetime-local"
            value={form.recordedAt}
            onChange={(event) => setForm((current) => ({ ...current, recordedAt: event.target.value }))}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <input
            value={form.bloodPressure}
            onChange={(event) => setForm((current) => ({ ...current, bloodPressure: event.target.value }))}
            placeholder="Blood pressure (e.g. 120/80)"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <input
            value={form.heartRateBpm}
            onChange={(event) => setForm((current) => ({ ...current, heartRateBpm: event.target.value }))}
            placeholder="Heart rate"
            type="number"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <input
            value={form.spo2}
            onChange={(event) => setForm((current) => ({ ...current, spo2: event.target.value }))}
            placeholder="SpO2"
            type="number"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <input
            value={form.sugarMgDl}
            onChange={(event) => setForm((current) => ({ ...current, sugarMgDl: event.target.value }))}
            placeholder="Sugar mg/dL"
            type="number"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <input
            value={form.temperatureC}
            onChange={(event) => setForm((current) => ({ ...current, temperatureC: event.target.value }))}
            placeholder="Temperature C"
            type="number"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
        </div>

        <button
          type="button"
          onClick={submitDailyVitals}
          className="mt-4 btn-primary rounded-xl px-4 py-2.5 ui-label"
        >
          Save Daily Vitals
        </button>
        <p className="mt-2 text-sm text-[var(--text-body)]">{status}</p>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-[var(--text-heading)]">This Week vs Previous Week</h3>
        <div className="mt-4 h-72 rounded-2xl border border-[var(--border)] bg-white p-4">
          {comparisonData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonData}>
                <CartesianGrid stroke="#E7E7E7" strokeDasharray="3 3" />
                <XAxis dataKey="metric" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="thisWeek" stroke="#057C8B" strokeWidth={2} />
                <Line type="monotone" dataKey="previousWeek" stroke="#94a3b8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="ui-label text-[var(--text-body)]">Need both this-week and previous-week entries to show comparison.</p>
          )}
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h3 className="text-xl font-semibold text-[var(--text-heading)]">Recent Daily Vitals</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--text-muted)]">
              <tr>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Recorded</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">BP</th>
                <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">HR</th>
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
                  <td className="px-3 py-2">{item.heartRateBpm}</td>
                  <td className="px-3 py-2">{item.spo2}%</td>
                  <td className="px-3 py-2">{item.sugarMgDl}</td>
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
