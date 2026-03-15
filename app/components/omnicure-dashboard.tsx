"use client";

import { useMemo, useState } from "react";

type ApiResult = {
  status?: string;
  error?: string;
  protocolId?: string;
  latencyMs?: number;
  benchmarkStatus?: string;
  [key: string]: unknown;
};

const pretty = (value: unknown) => JSON.stringify(value, null, 2);

const cardClass = "rounded-2xl border border-foreground/15 p-5";

export default function OmnicureDashboard() {
  const [doctorId, setDoctorId] = useState("DOC-001");
  const [userId, setUserId] = useState("PAT-001");
  const [protocolId, setProtocolId] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [initResult, setInitResult] = useState<ApiResult | null>(null);
  const [doctorResult, setDoctorResult] = useState<ApiResult | null>(null);
  const [patientResult, setPatientResult] = useState<ApiResult | null>(null);
  const [authResult, setAuthResult] = useState<ApiResult | null>(null);
  const [contextResult, setContextResult] = useState<ApiResult | null>(null);

  const isBusy = useMemo(() => busyAction !== null, [busyAction]);

  const callApi = async (url: string, body?: Record<string, unknown>) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body ?? {}),
    });

    const data = (await response.json().catch(() => ({}))) as ApiResult;
    if (!response.ok) {
      throw new Error(data.error ?? "Request failed");
    }

    return data;
  };

  const runInit = async () => {
    setBusyAction("init");
    setMessage("");

    try {
      const result = await callApi("/api/omnicure/init");
      setInitResult(result);
      setProtocolId(result.protocolId ?? "");
      setDoctorResult(null);
      setPatientResult(null);
      setAuthResult(null);
      setContextResult(null);
      setMessage("Trusted Authority initialized successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "TA initialization failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const runDoctorRegistration = async () => {
    if (!protocolId) {
      setMessage("Initialize TA first to get a protocolId.");
      return;
    }

    setBusyAction("doctor");
    setMessage("");

    try {
      const result = await callApi("/api/omnicure/register/doctor", {
        protocolId,
        doctorId,
      });
      setDoctorResult(result);
      setMessage("Doctor registration completed (Phase A). ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Doctor registration failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const runPatientRegistration = async () => {
    if (!protocolId) {
      setMessage("Initialize TA first to get a protocolId.");
      return;
    }

    setBusyAction("patient");
    setMessage("");

    try {
      const result = await callApi("/api/omnicure/register/patient", {
        protocolId,
        userId,
      });
      setPatientResult(result);
      setMessage("Patient registration completed (Phase A). ");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Patient registration failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const runAuthentication = async () => {
    if (!protocolId) {
      setMessage("Initialize TA first to get a protocolId.");
      return;
    }

    setBusyAction("auth");
    setMessage("");

    try {
      const result = await callApi("/api/omnicure/authenticate", {
        protocolId,
      });
      setAuthResult(result);
      setMessage("Mutual authentication and session key generation completed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const refreshContext = async () => {
    if (!protocolId) {
      setMessage("Initialize TA first to get a protocolId.");
      return;
    }

    setBusyAction("context");
    setMessage("");

    try {
      const response = await fetch(`/api/omnicure/context/${protocolId}`);
      const data = (await response.json().catch(() => ({}))) as ApiResult;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not fetch protocol context.");
      }

      setContextResult(data);
      setMessage("Protocol context refreshed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Context refresh failed.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className={cardClass}>
        <h2 className="text-xl font-semibold tracking-tight">Protocol Control Panel</h2>
        <p className="mt-2 text-sm leading-6 text-foreground/75">
          Run the complete backend lifecycle: TA initialization, registration,
          mutual authentication, and dynamic session key issuance.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-foreground/75">Doctor ID (D1)</span>
            <input
              value={doctorId}
              onChange={(event) => setDoctorId(event.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none"
              placeholder="DOC-001"
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-foreground/75">Patient ID (Ui)</span>
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none"
              placeholder="PAT-001"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="mb-1 block text-foreground/75">Protocol ID</span>
          <input
            value={protocolId}
            onChange={(event) => setProtocolId(event.target.value)}
            className="w-full rounded-lg border border-foreground/20 bg-transparent px-3 py-2 outline-none"
            placeholder="Generated after TA initialization"
          />
        </label>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={runInit}
            disabled={isBusy}
            className="rounded-lg border border-foreground/30 px-3 py-2 text-sm font-medium hover:bg-foreground/10 disabled:opacity-50"
          >
            {busyAction === "init" ? "Initializing..." : "1) Initialize TA"}
          </button>

          <button
            type="button"
            onClick={runDoctorRegistration}
            disabled={isBusy}
            className="rounded-lg border border-foreground/30 px-3 py-2 text-sm font-medium hover:bg-foreground/10 disabled:opacity-50"
          >
            {busyAction === "doctor" ? "Registering..." : "2) Register Doctor"}
          </button>

          <button
            type="button"
            onClick={runPatientRegistration}
            disabled={isBusy}
            className="rounded-lg border border-foreground/30 px-3 py-2 text-sm font-medium hover:bg-foreground/10 disabled:opacity-50"
          >
            {busyAction === "patient" ? "Registering..." : "3) Register Patient"}
          </button>

          <button
            type="button"
            onClick={runAuthentication}
            disabled={isBusy}
            className="rounded-lg border border-foreground/30 px-3 py-2 text-sm font-medium hover:bg-foreground/10 disabled:opacity-50"
          >
            {busyAction === "auth" ? "Authenticating..." : "4) Authenticate + Session"}
          </button>
        </div>

        <button
          type="button"
          onClick={refreshContext}
          disabled={isBusy}
          className="mt-2 w-full rounded-lg border border-foreground/30 px-3 py-2 text-sm font-medium hover:bg-foreground/10 disabled:opacity-50"
        >
          {busyAction === "context" ? "Refreshing..." : "Refresh Protocol Context"}
        </button>

        <p className="mt-4 text-sm text-foreground/75">{message}</p>
      </article>

      <article className={cardClass}>
        <h2 className="text-xl font-semibold tracking-tight">Runtime Status</h2>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-medium">Protocol:</span> {protocolId || "Not initialized"}
          </p>
          <p>
            <span className="font-medium">Authentication:</span> {authResult?.status ?? "Pending"}
          </p>
          <p>
            <span className="font-medium">Latency:</span>{" "}
            {typeof authResult?.latencyMs === "number"
              ? `${authResult.latencyMs} ms`
              : "N/A"}
          </p>
          <p>
            <span className="font-medium">Benchmark:</span> {authResult?.benchmarkStatus ?? "N/A"}
          </p>
        </div>

        <div className="mt-4 grid gap-3">
          <details className="rounded-lg border border-foreground/15 p-3" open>
            <summary className="cursor-pointer text-sm font-semibold">Init Response</summary>
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-foreground/80">
              {pretty(initResult)}
            </pre>
          </details>

          <details className="rounded-lg border border-foreground/15 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Doctor Registration</summary>
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-foreground/80">
              {pretty(doctorResult)}
            </pre>
          </details>

          <details className="rounded-lg border border-foreground/15 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Patient Registration</summary>
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-foreground/80">
              {pretty(patientResult)}
            </pre>
          </details>

          <details className="rounded-lg border border-foreground/15 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Authentication + Session</summary>
            <pre className="mt-2 max-h-40 overflow-auto text-xs text-foreground/80">
              {pretty(authResult)}
            </pre>
          </details>

          <details className="rounded-lg border border-foreground/15 p-3">
            <summary className="cursor-pointer text-sm font-semibold">Protocol Context Snapshot</summary>
            <pre className="mt-2 max-h-52 overflow-auto text-xs text-foreground/80">
              {pretty(contextResult)}
            </pre>
          </details>
        </div>
      </article>
    </section>
  );
}
