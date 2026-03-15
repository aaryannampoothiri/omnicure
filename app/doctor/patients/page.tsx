"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/app/components/session-utils";

type DoctorPatientListItem = {
  id: string;
  name: string;
};

type AccessState = {
  daily: boolean;
  weekly: boolean;
  records: boolean;
};

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<DoctorPatientListItem[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState("");
  const [enrollForm, setEnrollForm] = useState({
    patientId: "",
    patientName: "",
    notes: "",
  });
  const [accessState, setAccessState] = useState<AccessState>({
    daily: true,
    weekly: true,
    records: true,
  });

  const loadPatients = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/doctor/patients?doctorId=${session.id}`);
      const data = (await response.json().catch(() => ({}))) as { patients?: DoctorPatientListItem[]; error?: string };

      if (!response.ok || !data.patients) {
        throw new Error(data.error ?? "Unable to load enrolled patients");
      }

      const patientsList = data.patients;
      setPatients(patientsList);
      if (patientsList.length > 0) {
        setSelectedPatientId((current) => current || patientsList[0]!.id);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load enrolled patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients().catch(() => {
      setLoading(false);
    });
  }, []);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  );

  const openAccessModal = (patientId: string) => {
    setSelectedPatientId(patientId);
    setAccessState({ daily: true, weekly: true, records: true });
    router.prefetch(`/doctor/patients/${patientId}`);
    setModalOpen(true);
  };

  const continueToPatient = () => {
    if (!selectedPatientId || (!accessState.daily && !accessState.weekly && !accessState.records)) {
      return;
    }

    const session = getSession();
    const query = new URLSearchParams();
    if (accessState.daily) {
      query.set("daily", "1");
    }
    if (accessState.weekly) {
      query.set("weekly", "1");
    }
    if (accessState.records) {
      query.set("records", "1");
    }
    if (session?.id) {
      query.set("doctorId", session.id);
    }

    setModalOpen(false);
    router.push(`/doctor/patients/${selectedPatientId}?${query.toString()}`);
  };

  const enrollPatient = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    setEnrollStatus("");

    if (!enrollForm.patientId.trim()) {
      setEnrollStatus("Patient ID is required.");
      return;
    }

    const response = await fetch("/api/doctor/patients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        doctorId: session.id,
        patientId: enrollForm.patientId.trim(),
        patientName: enrollForm.patientName.trim() || undefined,
        notes: enrollForm.notes.trim() || undefined,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      patient?: { id: string; name: string };
    };

    if (!response.ok) {
      setEnrollStatus(data.error ?? "Unable to add patient.");
      return;
    }

    setEnrollStatus(`Patient ${data.patient?.name ?? enrollForm.patientId.trim()} added successfully.`);
    setEnrollForm({ patientId: "", patientName: "", notes: "" });
    await loadPatients();
  };

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">
      <article className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Doctor Patients</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-heading)]">Enrolled Patients</h2>
            <p className="mt-1 text-sm text-[var(--text-body)]">
              Click a patient to start transfer and fetch records using patient ID linkage.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Total</p>
            <p className="text-2xl font-semibold text-[var(--text-heading)]">{patients.length}</p>
          </div>
        </div>

        {loading ? <p className="mt-4 text-sm text-[var(--text-body)]">Loading patients...</p> : null}

        <div className="mt-4 grid gap-2">
          {patients.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-body)]">
              No enrolled patients yet. Add a patient from the panel on the right.
            </div>
          ) : null}

          {patients.map((patient) => {
            const active = patient.id === selectedPatientId;

            return (
              <button
                key={patient.id}
                type="button"
                onClick={() => openAccessModal(patient.id)}
                className={`rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                    : "border-[var(--border)] bg-white hover:border-[var(--border-strong)] hover:bg-[var(--primary-light)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--text-heading)]">{patient.name}</p>
                  <p className="text-xs text-[var(--text-body)]">ID: {patient.id}</p>
                </div>
              </button>
            );
          })}
        </div>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Enroll by Patient ID</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-heading)]">Add Patient</h2>
        <p className="mt-1 text-sm text-[var(--text-body)]">Doctor and patient are linked by patient ID.</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">Patient ID</span>
            <input
              value={enrollForm.patientId}
              onChange={(event) => setEnrollForm((current) => ({ ...current, patientId: event.target.value }))}
              placeholder="Enter patient ID"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">Patient Name (optional)</span>
            <input
              value={enrollForm.patientName}
              onChange={(event) => setEnrollForm((current) => ({ ...current, patientName: event.target.value }))}
              placeholder="Optional name verification"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-body)] mb-1.5">Notes (optional)</span>
            <textarea
              rows={3}
              value={enrollForm.notes}
              onChange={(event) => setEnrollForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Additional details"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)]"
            />
          </label>

          <button
            type="button"
            onClick={enrollPatient}
            className="btn-primary w-full rounded-xl px-4 py-2.5 ui-label"
          >
            Add Patient to List
          </button>

          <p className="text-sm text-[var(--text-body)]">{enrollStatus}</p>
        </div>

        {selectedPatient ? (
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Selected</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-heading)]">{selectedPatient.name}</p>
            <p className="mt-1 text-sm text-[var(--text-body)]">Patient ID {selectedPatient.id}</p>
            <button
              type="button"
              onClick={() => openAccessModal(selectedPatient.id)}
              className="mt-4 btn-primary w-full rounded-xl px-4 py-2.5 ui-label"
            >
              Request Data Transfer
            </button>
          </div>
        ) : null}
      </article>

      {modalOpen && selectedPatient ? (
        <div className="modal-backdrop">
          <div className="glass-panel w-full max-w-lg rounded-xl p-5">
            <h2 className="ui-header text-[var(--text-heading)]">Transfer Patient Records</h2>
            <p className="mt-1 ui-label text-[var(--text-body)]">
              Choose what to transfer for {selectedPatient.name} before opening the patient data console.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-white p-3">
                <input
                  type="checkbox"
                  checked={accessState.daily}
                  onChange={(event) =>
                    setAccessState((current) => ({ ...current, daily: event.target.checked }))
                  }
                />
                <div>
                  <p className="ui-label text-[var(--text-heading)]">Daily vitals</p>
                  <p className="text-sm text-[var(--text-body)]">Individual time-stamped daily observations.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-white p-3">
                <input
                  type="checkbox"
                  checked={accessState.weekly}
                  onChange={(event) =>
                    setAccessState((current) => ({ ...current, weekly: event.target.checked }))
                  }
                />
                <div>
                  <p className="ui-label text-[var(--text-heading)]">Weekly vitals</p>
                  <p className="text-sm text-[var(--text-body)]">Aggregated weekly trends and adherence summary.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-white p-3">
                <input
                  type="checkbox"
                  checked={accessState.records}
                  onChange={(event) =>
                    setAccessState((current) => ({ ...current, records: event.target.checked }))
                  }
                />
                <div>
                  <p className="ui-label text-[var(--text-heading)]">Full medical records</p>
                  <p className="text-sm text-[var(--text-body)]">
                    Ongoing medications, previous medications, medical history, lab reports, and advice.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary rounded-lg px-4 py-2 ui-label"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={continueToPatient}
                disabled={!accessState.daily && !accessState.weekly && !accessState.records}
                className="btn-primary rounded-lg px-4 py-2 ui-label disabled:opacity-50"
              >
                Start Transfer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
