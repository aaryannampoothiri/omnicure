"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSession } from "@/app/components/session-utils";
import type { PatientOverview } from "@/app/components/patient-api";

type SecureSyncResult = {
  transferId: string;
  validUntil: number;
  message: string;
  patientData: PatientOverview;
  error?: string;
};


export default function DoctorPatientDetailPage() {
  const params = useParams<{ patientId: string }>();
  const [result, setResult] = useState<SecureSyncResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Preparing transfer...");
  const [progress, setProgress] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [medicationForm, setMedicationForm] = useState({
    medicine: "",
    dosage: "",
    frequency: "1 - 0 - 0 - 1",
    notes: "",
  });
  const [adviceForm, setAdviceForm] = useState({
    note: "",
  });

  const queryParam = (key: string) => {
    if (typeof window === "undefined") {
      return null;
    }

    return new URLSearchParams(window.location.search).get(key);
  };

  const showDaily = queryParam("daily") !== "0";
  const showWeekly = queryParam("weekly") !== "0";
  const showRecords = queryParam("records") !== "0";

  useEffect(() => {
    const session = getSession();
    const queryDoctorId = queryParam("doctorId")?.trim() ?? "";
    const doctorId = session?.id ?? queryDoctorId;
    if (!doctorId) {
      setLoading(false);
      setProgress(0);
      setMessage("Doctor session not found. Please go back and start transfer again.");
      return;
    }

    const loadPatient = async () => {
      setLoading(true);
      setProgress(32);
      setMessage("Starting transfer request...");

      const progressTimer = setInterval(() => {
        setProgress((current) => (current < 95 ? current + 10 : current));
      }, 100);

      try {
        const response = await fetch(`/api/doctor/patients/${params.patientId}/secure-sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ doctorId }),
        });

        const data = (await response.json().catch(() => ({}))) as SecureSyncResult;

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to access patient records");
        }

        setResult(data);
        setProgress(100);
        setMessage("Data transfer successful.");
      } catch (loadError) {
        setProgress(0);
        setMessage(loadError instanceof Error ? loadError.message : "Unable to access patient records");
      } finally {
        clearInterval(progressTimer);
        setLoading(false);
      }
    };

    loadPatient().catch(() => {
      setLoading(false);
    });
  }, [params.patientId]);

  const ongoingMeds = useMemo(
    () => {
      if (!result) {
        return [];
      }

      const careItems = result.patientData.careMedications.filter(
        (item) => item.status?.toLowerCase() !== "previous",
      );

      const careMedicineNames = new Set(
        careItems.map((item) => item.medicine.trim().toLowerCase()).filter(Boolean),
      );

      const loggedFallback = result.patientData.medications
        .filter((item) => !careMedicineNames.has(item.medicine.trim().toLowerCase()))
        .map((item) => ({
          id: item.id,
          medicine: item.medicine,
          dosage: "As logged by patient",
          frequency: `Scheduled ${new Date(item.dueAt).toISOString().slice(11, 16)}`,
          prescribedBy: "Patient Log",
          notes: item.taken ? "Marked as taken" : "Pending",
        }));

      return [...careItems, ...loggedFallback];
    },
    [result],
  );
  const previousMeds = useMemo(
    () => result?.patientData.careMedications.filter((item) => item.status === "previous") ?? [],
    [result],
  );

  const submitMedication = async () => {
    const session = getSession();
    if (!session || session.role !== "doctor") {
      setActionStatus("Doctor session required.");
      return;
    }

    if (!medicationForm.medicine.trim() || !medicationForm.dosage.trim() || !medicationForm.frequency.trim()) {
      setActionStatus("Medicine, dosage and frequency are required.");
      return;
    }

    if (!/^\s*\d+\s*-\s*\d+\s*-\s*\d+\s*-\s*\d+\s*$/.test(medicationForm.frequency.trim())) {
      setActionStatus("Frequency must be in format: 0 - 0 - 0 - 0");
      return;
    }

    setActionLoading(true);
    setActionStatus("");

    try {
      const response = await fetch(`/api/patient/${params.patientId}/records/careMedications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          medicine: medicationForm.medicine.trim(),
          dosage: medicationForm.dosage.trim(),
          frequency: medicationForm.frequency.trim(),
          status: "ongoing",
          prescribedBy: session.name,
          startedAt: new Date().toISOString().slice(0, 10),
          notes: medicationForm.notes.trim(),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };

      if (!response.ok || !data.patient) {
        throw new Error(data.error ?? "Unable to prescribe medication");
      }

      setResult((current) => (current ? { ...current, patientData: data.patient! } : current));
      setMedicationForm({ medicine: "", dosage: "", frequency: "1 - 0 - 0 - 1", notes: "" });
      setActionStatus("Medication prescribed successfully.");
    } catch (submitError) {
      setActionStatus(submitError instanceof Error ? submitError.message : "Unable to prescribe medication");
    } finally {
      setActionLoading(false);
    }
  };

  const submitAdvice = async () => {
    const session = getSession();
    if (!session || session.role !== "doctor") {
      setActionStatus("Doctor session required.");
      return;
    }

    if (!adviceForm.note.trim()) {
      setActionStatus("Advice note cannot be empty.");
      return;
    }

    setActionLoading(true);
    setActionStatus("");

    try {
      const response = await fetch(`/api/patient/${params.patientId}/records/advice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          doctorName: session.name,
          note: adviceForm.note.trim(),
          createdAt: new Date().toISOString(),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };

      if (!response.ok || !data.patient) {
        throw new Error(data.error ?? "Unable to add advice");
      }

      setResult((current) => (current ? { ...current, patientData: data.patient! } : current));
      setAdviceForm({ note: "" });
      setActionStatus("Advice added successfully.");
    } catch (submitError) {
      setActionStatus(submitError instanceof Error ? submitError.message : "Unable to add advice");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="grid gap-5">
      <article className="glass-panel rounded-2xl p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Data Transfer</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Patient Data Console</h2>
            <p className="mt-1 text-sm text-[var(--text-body)]">{message}</p>
          </div>
          {!loading && result ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-body)]">
              Transfer completed at {new Date().toLocaleTimeString()}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-alt)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Transferring data... {progress}%</p>
          </div>
        ) : null}
      </article>

      {!loading && !result ? <p className="ui-label text-[var(--text-body)]">Transfer failed. Please try again.</p> : null}

      {result ? (
        <>
          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="glass-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Patient</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">{result.patientData.name}</h3>
              <p className="mt-1 text-sm text-[var(--text-body)]">
                {result.patientData.condition} - Age {result.patientData.age} - {result.patientData.heightCm} cm - {result.patientData.weightKg} kg
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Blood Pressure</p>
                  <p className="ui-header text-[var(--text-heading)]">{result.patientData.health.bloodPressure}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Heart Rate</p>
                  <p className="ui-header text-[var(--text-heading)]">{result.patientData.health.heartRateBpm} bpm</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">SpO2</p>
                  <p className="ui-header text-[var(--text-heading)]">{result.patientData.health.spo2}%</p>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Sugar</p>
                  <p className="ui-header text-[var(--text-heading)]">{result.patientData.health.sugarMgDl} mg/dL</p>
                </div>
              </div>
            </article>

            <article className="glass-panel rounded-2xl p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Granted Access</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {showDaily ? <span className="rounded-full border border-[var(--border-strong)] bg-[var(--primary-light)] px-3 py-1 text-sm text-[var(--primary)]">Daily vitals</span> : null}
                {showWeekly ? <span className="rounded-full border border-[var(--border-strong)] bg-[var(--primary-light)] px-3 py-1 text-sm text-[var(--primary)]">Weekly vitals</span> : null}
                {showRecords ? <span className="rounded-full border border-[var(--border-strong)] bg-[var(--primary-light)] px-3 py-1 text-sm text-[var(--primary)]">Medical records</span> : null}
              </div>

              <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Devices</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {result.patientData.devices.map((device) => (
                    <div key={device.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                      <p className="ui-label text-[var(--text-heading)]">{device.name}</p>
                      <p className="text-sm text-[var(--text-body)]">{device.model} - {device.identifier}</p>
                      <p className="text-sm text-[var(--text-body)]">
                        {device.connected ? "Connected" : "Offline"}
                        {device.lastSyncedAt ? ` - ${new Date(device.lastSyncedAt).toLocaleString()}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-[var(--text-heading)]">Prescribe Medication</h3>
              <p className="mt-1 text-sm text-[var(--text-body)]">
                Frequency format: Morning 07:30 - Afternoon 13:00 - Evening 17:00 - Night 20:30
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={medicationForm.medicine}
                  onChange={(event) => setMedicationForm((current) => ({ ...current, medicine: event.target.value }))}
                  placeholder="Medicine name"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--text-heading)]"
                />
                <input
                  value={medicationForm.dosage}
                  onChange={(event) => setMedicationForm((current) => ({ ...current, dosage: event.target.value }))}
                  placeholder="Dosage"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--text-heading)]"
                />
                <input
                  value={medicationForm.frequency}
                  onChange={(event) => setMedicationForm((current) => ({ ...current, frequency: event.target.value }))}
                  placeholder="0 - 0 - 0 - 0"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--text-heading)]"
                />
                <textarea
                  rows={3}
                  value={medicationForm.notes}
                  onChange={(event) => setMedicationForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Notes"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--text-heading)]"
                />
                <button
                  type="button"
                  onClick={submitMedication}
                  disabled={actionLoading}
                  className="btn-primary w-full rounded-xl px-4 py-2.5 ui-label disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Add Medication"}
                </button>
              </div>
            </article>

            <article className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-[var(--text-heading)]">Add Doctor Advice</h3>
              <p className="mt-1 text-sm text-[var(--text-body)]">Share new advice after reviewing transferred records.</p>
              <div className="mt-4 space-y-3">
                <textarea
                  rows={6}
                  value={adviceForm.note}
                  onChange={(event) => setAdviceForm({ note: event.target.value })}
                  placeholder="Write advice for the patient"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--text-heading)]"
                />
                <button
                  type="button"
                  onClick={submitAdvice}
                  disabled={actionLoading}
                  className="btn-primary w-full rounded-xl px-4 py-2.5 ui-label disabled:opacity-60"
                >
                  {actionLoading ? "Saving..." : "Add Advice"}
                </button>
                <p className="text-sm text-[var(--text-body)]">{actionStatus}</p>
              </div>
            </article>
          </section>

          {showDaily ? (
            <article className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-[var(--text-heading)]">Daily Vitals</h3>
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
                    {result.patientData.dailyVitals.map((item) => (
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
          ) : null}

          {showWeekly ? (
            <article className="glass-panel rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-[var(--text-heading)]">Weekly Vitals</h3>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {result.patientData.weeklyVitals.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">{item.weekLabel}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 ui-label text-[var(--text-body)]">
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
          ) : null}

          {showRecords ? (
            <section className="grid gap-5 lg:grid-cols-2">
              <article className="glass-panel rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-[var(--text-heading)]">Ongoing Medications</h3>
                <div className="mt-4 space-y-3">
                  {ongoingMeds.length === 0 ? (
                    <p className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--text-body)]">
                      No ongoing medications available in transferred data.
                    </p>
                  ) : (
                    ongoingMeds.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                        <p className="ui-label text-[var(--text-heading)]">{item.medicine}</p>
                        <p className="mt-1 text-sm text-[var(--text-body)]">{item.dosage} - {item.frequency}</p>
                        <p className="mt-1 text-sm text-[var(--text-body)]">Prescribed by {item.prescribedBy}</p>
                        <p className="mt-2 text-sm text-[var(--text-body)]">{item.notes}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="glass-panel rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-[var(--text-heading)]">Previous Medications</h3>
                <div className="mt-4 space-y-3">
                  {previousMeds.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                      <p className="ui-label text-[var(--text-heading)]">{item.medicine}</p>
                      <p className="mt-1 text-sm text-[var(--text-body)]">{item.dosage} - {item.frequency}</p>
                      <p className="mt-1 text-sm text-[var(--text-body)]">
                        {item.startedAt} to {item.endedAt ?? "Ongoing"}
                      </p>
                      <p className="mt-2 text-sm text-[var(--text-body)]">{item.notes}</p>
                    </div>
                  ))}
                </div>
              </article>

              <article className="glass-panel rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-[var(--text-heading)]">Medical History</h3>
                <div className="mt-4 space-y-3">
                  {result.patientData.medicalHistory.map((item) => (
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

              <article className="glass-panel rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-[var(--text-heading)]">Lab Reports</h3>
                <div className="mt-4 space-y-3">
                  {result.patientData.labReports.map((item) => (
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
          ) : null}
        </>
      ) : null}
    </section>
  );
}