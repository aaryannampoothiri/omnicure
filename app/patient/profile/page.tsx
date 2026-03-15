"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchPatientOverview, type PatientOverview } from "@/app/components/patient-api";
import { getSession } from "@/app/components/session-utils";

type ProfileForm = {
  name: string;
  age: string;
  heightCm: string;
  weightKg: string;
};

const emptyForm: ProfileForm = {
  name: "",
  age: "",
  heightCm: "",
  weightKg: "",
};

export default function PatientProfilePage() {
  const searchParams = useSearchParams();
  const isSetupFlow = searchParams.get("setup") === "1";
  const [overview, setOverview] = useState<PatientOverview | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      return;
    }

    fetchPatientOverview(session.id)
      .then((patient) => {
        setOverview(patient);
        setForm({
          name: patient.name,
          age: String(patient.age),
          heightCm: String(patient.heightCm),
          weightKg: String(patient.weightKg),
        });
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Unable to load profile");
      });
  }, []);

  const submitProfile = async () => {
    const session = getSession();
    if (!session) {
      return;
    }

    const response = await fetch(`/api/patient/${session.id}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { patient?: PatientOverview; error?: string };
    if (!response.ok || !data.patient) {
      setStatus(data.error ?? "Unable to update profile");
      return;
    }

    setOverview(data.patient);
    const currentSession = getSession();
    if (currentSession) {
      localStorage.setItem(
        "omnicure_session",
        JSON.stringify({ ...currentSession, needsProfileSetup: false, name: data.patient.name }),
      );
    }
    setStatus(isSetupFlow ? "Profile setup completed. You can now use all sections." : "Profile updated successfully.");
  };

  return (
    <section className="grid gap-4">
      <article className="glass-panel rounded-xl p-4">
        <h2 className="ui-header text-[var(--text-heading)]">Profile</h2>
        <p className="mt-1 ui-label text-[var(--text-body)]">
          {isSetupFlow ? "Complete your profile to start using the patient portal." : "Update your basic details."}
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Age</span>
            <input
              value={form.age}
              onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
              placeholder="Age"
              type="number"
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Height</span>
            <input
              value={form.heightCm}
              onChange={(event) => setForm((current) => ({ ...current, heightCm: event.target.value }))}
              placeholder="Height (cm)"
              type="number"
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Weight</span>
            <input
              value={form.weightKg}
              onChange={(event) => setForm((current) => ({ ...current, weightKg: event.target.value }))}
              placeholder="Weight (kg)"
              type="number"
              className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={submitProfile}
          className="mt-4 btn-primary rounded-lg px-4 py-2 ui-label "
        >
          Save Profile
        </button>

        <p className="mt-3 text-sm text-[var(--text-body)]">{status}</p>
      </article>

      {overview ? (
        <article className="glass-panel rounded-xl p-4">
          <h3 className="ui-header text-[var(--text-heading)]">Current Details</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Name</p>
              <p className="mt-2 ui-label text-[var(--text-heading)]">{overview.name}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Age</p>
              <p className="mt-2 ui-label text-[var(--text-heading)]">{overview.age}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Height</p>
              <p className="mt-2 ui-label text-[var(--text-heading)]">{overview.heightCm} cm</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">Weight</p>
              <p className="mt-2 ui-label text-[var(--text-heading)]">{overview.weightKg} kg</p>
            </div>
          </div>
        </article>
      ) : null}
    </section>
  );
}
