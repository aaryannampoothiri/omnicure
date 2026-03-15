"use client";

import { useEffect, useState } from "react";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

type PairForm = {
  deviceName: string;
  model: string;
  identifier: string;
};

export default function PatientDevicesPage() {
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [form, setForm] = useState<PairForm>({ deviceName: "", model: "", identifier: "" });
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
      setStatus(error instanceof Error ? error.message : "Failed to load devices");
    });
  }, []);

  const pairDevice = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    if (!form.deviceName.trim() || !form.model.trim() || !form.identifier.trim()) {
      setStatus("Please fill in all device fields.");
      return;
    }

    setStatus("Pairing device...");

    const response = await fetch(`/api/patient/${session.id}/devices/pair`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ deviceName: form.deviceName.trim(), model: form.model.trim(), identifier: form.identifier.trim() }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      status?: string;
      error?: string;
      patient?: PatientOverview;
    };

    if (!response.ok || !data.patient) {
      setStatus(data.error ?? "Could not pair the device");
      return;
    }

    setOverview(data.patient);
    setForm({ deviceName: "", model: "", identifier: "" });
    setStatus(`${form.deviceName.trim()} connected. Data will be available for doctor-requested transfer.`);
  };

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <article className="glass-panel rounded-2xl p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">IoMT Link</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Device Pairing</h2>
        <p className="mt-1 text-sm text-[var(--text-body)]">
          Connect IoMT devices to stream health signals to your care team.
        </p>

        <div className="mt-5 space-y-3">
          <input
            type="text"
            placeholder="Device name (e.g. Wristband)"
            value={form.deviceName}
            onChange={(e) => setForm((f) => ({ ...f, deviceName: e.target.value }))}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Model (e.g. OmniWear Pro)"
            value={form.model}
            onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)]"
          />
          <input
            type="text"
            placeholder="Bluetooth ID (e.g. BT:AA:BB:CC:DD:EE)"
            value={form.identifier}
            onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={pairDevice}
            className="btn-primary w-full rounded-xl px-4 py-2.5 text-sm font-medium active:translate-y-px"
          >
            Pair Device
          </button>
        </div>

        <p className="mt-3 text-sm text-[var(--text-body)]">{status}</p>
      </article>

      <article className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)]">Connected Devices</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {(overview?.devices ?? []).length === 0 ? (
            <li className="rounded-2xl border border-[var(--border)] bg-white p-5 text-[var(--text-body)]">
              No devices connected yet.
            </li>
          ) : null}
          {(overview?.devices ?? []).map((device) => (
            <li key={device.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
              <p className="font-medium text-[var(--text-heading)]">{device.name}</p>
              <p className="text-[var(--text-body)]">{device.model} - {device.identifier}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {device.connected ? "Connected" : "Not connected"} - Last update:{" "}
                {device.lastSyncedAt ? new Date(device.lastSyncedAt).toLocaleString() : "N/A"}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
