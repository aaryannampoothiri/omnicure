"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/app/components/session-utils";

type AuditEntry = {
  id: string;
  role: "patient" | "doctor" | "system";
  actorId: string;
  message: string;
  status: "success" | "warning" | "critical";
  timestamp: string;
};

const statusTone: Record<AuditEntry["status"], string> = {
  success: "text-emerald-700",
  warning: "text-amber-600",
  critical: "text-rose-600",
};

export default function DoctorLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      return;
    }

    fetch(`/api/logs?role=doctor&actorId=${session.id}`)
      .then((response) => response.json())
      .then((data: { logs?: AuditEntry[]; error?: string }) => {
        if (!data.logs) {
          throw new Error(data.error ?? "Unable to load session history");
        }
        setLogs(data.logs);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load session history");
      });
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <section className="glass-panel rounded-2xl p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Audit Trail</p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--text-heading)]">Session History</h2>
      <p className="mt-1 text-sm text-[var(--text-body)]">Clinical bridge and transfer activity timeline.</p>

      <div className="mt-5 space-y-3">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-body)]">
            No activity logged yet.
          </div>
        ) : null}
        {logs.map((log) => (
          <article key={log.id} className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <p className={`rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] ${statusTone[log.status]}`}>
                {log.status}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{new Date(log.timestamp).toLocaleString()}</p>
            </div>
            <p className="mt-2 ui-label text-[var(--text-body)]">{log.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
