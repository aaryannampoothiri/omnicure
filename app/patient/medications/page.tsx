"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

const slotConfig = [
  { key: "07:30", label: "Morning", timeLabel: "07:30 AM" },
  { key: "13:00", label: "Afternoon", timeLabel: "01:00 PM" },
  { key: "17:00", label: "Evening", timeLabel: "05:00 PM" },
  { key: "20:30", label: "Night", timeLabel: "08:30 PM" },
] as const;

type SlotKey = (typeof slotConfig)[number]["key"];

const buildDueAt = (slotKey: SlotKey): string => {
  const today = new Date().toISOString().slice(0, 10);
  return `${today}T${slotKey}:00.000Z`;
};

export default function PatientMedicationsPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [status, setStatus] = useState("");
  const [addMedicine, setAddMedicine] = useState("");
  const [addSlot, setAddSlot] = useState<SlotKey>("07:30");
  const [addLoading, setAddLoading] = useState(false);
  const [addStatus, setAddStatus] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadOverview = async () => {
    const session = getSession();
    if (!session) return;
    const patient = await fetchPatientOverview(session.id);
    setOverview(patient);
  };

  useEffect(() => {
    loadOverview().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Unable to load medication records");
    });
  }, []);

  const loggedMedications = useMemo(() => {
    return (overview?.medications ?? []).sort(
      (left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime(),
    );
  }, [overview]);

  const getSlotMeta = (dueAt: string) => {
    const slot = new Date(dueAt).toISOString().slice(11, 16);
    const matched = slotConfig.find((item) => item.key === slot);
    return matched ?? { key: slot, label: "Other", timeLabel: "Scheduled" };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMedicine.trim()) return;
    const session = getSession();
    if (!session) return;

    setAddLoading(true);
    setAddStatus("");
    try {
      const res = await fetch(`/api/patient/${session.id}/medications/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicine: addMedicine.trim(), dueAt: buildDueAt(addSlot) }),
      });
      const data = (await res.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };
      if (!res.ok || !data.patient) {
        setAddStatus(data.error ?? "Failed to add medication.");
      } else {
        setOverview(data.patient);
        setAddMedicine("");
        setAddStatus("Medication added.");
      }
    } catch {
      setAddStatus("Network error.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (medicationId: string) => {
    const session = getSession();
    if (!session) return;

    setRemovingId(medicationId);
    try {
      const res = await fetch(`/api/patient/${session.id}/medications/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medicationId }),
      });
      const data = (await res.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };
      if (res.ok && data.patient) {
        setOverview(data.patient);
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <section className="grid gap-4">
      {/* Add medication form */}
      <article className="glass-panel rounded-xl p-5">
        <h2 className="ui-header text-[var(--text-heading)]">Add Medication</h2>
        <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="ui-label text-[var(--text-body)]">Medicine Name</label>
            <input
              type="text"
              value={addMedicine}
              onChange={(e) => setAddMedicine(e.target.value)}
              placeholder="e.g. Paracetamol 500mg"
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)]"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="ui-label text-[var(--text-body)]">Slot</label>
            <select
              value={addSlot}
              onChange={(e) => setAddSlot(e.target.value as SlotKey)}
              className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-heading)]"
            >
              {slotConfig.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label} — {s.timeLabel}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={addLoading}
            className="self-start rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {addLoading ? "Adding…" : "Add Medication"}
          </button>
          {addStatus && <p className="text-sm text-[var(--text-body)]">{addStatus}</p>}
        </form>
      </article>

      {/* Logged medications list */}
      <article className="glass-panel rounded-xl p-5">
        <h2 className="ui-header text-[var(--text-heading)]">Medication Records</h2>
        <p className="mt-1 ui-label text-[var(--text-body)]">
          Slots: Morning 07:30, Afternoon 01:00, Evening 05:00, Night 08:30.
        </p>

        <div className="mt-4 space-y-3">
          {loggedMedications.length === 0 ? (
            <p className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--text-body)]">
              No medicines logged.
            </p>
          ) : (
            loggedMedications.map((entry) => {
              const slot = getSlotMeta(entry.dueAt);
              return (
                <div key={entry.id} className="flex items-start justify-between rounded-2xl border border-[var(--border)] bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-heading)]">{entry.medicine}</p>
                    <p className="mt-1 text-sm text-[var(--text-body)]">
                      {slot.label} ({slot.timeLabel})
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {entry.taken ? "Taken" : "Pending"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    disabled={removingId === entry.id}
                    className="ml-4 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {removingId === entry.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              );
            })
          )}
          {status && <p className="text-sm text-[var(--text-body)]">{status}</p>}
        </div>
      </article>
    </section>
  );
}