"use client";

import { useEffect, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

type LabTestFormRow = {
  testName: string;
  result: string;
  note: string;
};

type LabForm = {
  name: string;
  collectedOn: string;
  tests: LabTestFormRow[];
};

const initialForm: LabForm = {
  name: "",
  collectedOn: "",
  tests: [{ testName: "", result: "", note: "" }],
};

export default function PatientLabReportsPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [form, setForm] = useState<LabForm>(initialForm);
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
      setStatus(error instanceof Error ? error.message : "Unable to load lab reports");
    });
  }, []);

  const addTestRow = () => {
    setForm((current) => ({
      ...current,
      tests: [...current.tests, { testName: "", result: "", note: "" }],
    }));
  };

  const updateTestRow = (index: number, key: keyof LabTestFormRow, value: string) => {
    setForm((current) => ({
      ...current,
      tests: current.tests.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [key]: value } : row,
      ),
    }));
  };

  const submitLabReport = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    const response = await fetch(`/api/patient/${session.id}/records/labReports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };

    if (!response.ok || !data.patient) {
      setStatus(data.error ?? "Unable to save lab report");
      return;
    }

    setOverview(data.patient);
    setForm(initialForm);
    setStatus("Lab report updated.");
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Records</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Update Lab Reports</h2>
        <div className="mt-5 grid gap-3">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Report name"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />
          <input
            type="date"
            value={form.collectedOn}
            onChange={(event) => setForm((current) => ({ ...current, collectedOn: event.target.value }))}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
          />

          <div className="space-y-3">
            {form.tests.map((test, index) => (
              <div key={`${index}-${test.testName}`} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Test {index + 1}</p>
                <div className="mt-2 grid gap-2">
                  <input
                    value={test.testName}
                    onChange={(event) => updateTestRow(index, "testName", event.target.value)}
                    placeholder="Test name"
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
                  />
                  <input
                    value={test.result}
                    onChange={(event) => updateTestRow(index, "result", event.target.value)}
                    placeholder="Result"
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
                  />
                  <textarea
                    value={test.note}
                    onChange={(event) => updateTestRow(index, "note", event.target.value)}
                    rows={2}
                    placeholder="Lab note"
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTestRow}
            className="rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--text-body)] hover:bg-[var(--surface)]"
          >
            + Add Test
          </button>

          <button type="button" onClick={submitLabReport} className="btn-primary rounded-xl px-4 py-2.5 ui-label">
            Save Lab Report
          </button>
          <p className="text-sm text-[var(--text-body)]">{status}</p>
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Lab Report Archive</h2>
        <div className="mt-4 space-y-3">
          {overview?.labReports.map((item) => (
            <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="ui-label text-[var(--text-heading)]">{item.name}</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">Collected {item.collectedOn}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Test</th>
                      <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Result</th>
                      <th className="px-3 py-2 text-[11px] uppercase tracking-[0.16em]">Lab Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.tests.map((test) => (
                      <tr key={test.id} className="border-b border-[var(--border)] text-[var(--text-body)]">
                        <td className="px-3 py-2">{test.testName}</td>
                        <td className="px-3 py-2">{test.result}</td>
                        <td className="px-3 py-2">{test.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
