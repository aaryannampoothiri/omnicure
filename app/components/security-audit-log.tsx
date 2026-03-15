"use client";

import { useEffect, useState } from "react";

type ProtocolRow = {
  protocolId: string;
  createdAtMs: number;
  authentication?: {
    sessionKeyAgreed?: boolean;
  };
};

export default function SecurityAuditLog() {
  const [rows, setRows] = useState<ProtocolRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/omnicure/init")
      .then((response) => response.json())
      .then((data: { protocols?: ProtocolRow[]; error?: string }) => {
        if (!data.protocols) {
          throw new Error(data.error ?? "Unable to load security audit entries");
        }
        setRows(data.protocols.slice(0, 6));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load security audit entries");
      });
  }, []);

  return (
    <article className="glass-panel rounded-xl p-4">
      <h3 className="ui-header text-[var(--text-heading)]">Security Audit Log</h3>
      <p className="mt-1 ui-label text-[var(--text-body)]">Protocol verification timeline for secure channel sessions.</p>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--border)] bg-white">
        <table className="min-w-full text-left">
          <thead className="bg-[var(--surface)]">
            <tr>
              <th className="px-3 py-2 ui-label text-[var(--text-body)]">Protocol ID</th>
              <th className="px-3 py-2 ui-label text-[var(--text-body)]">Timestamp</th>
              <th className="px-3 py-2 ui-label text-[var(--text-body)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-sm text-[var(--text-muted)]" colSpan={3}>
                  No protocol entries yet. Start a mutual authentication cycle.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const verified = row.authentication?.sessionKeyAgreed ?? false;
                return (
                  <tr key={row.protocolId} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2 ui-mono text-[var(--text-body)]">{row.protocolId.slice(0, 8)}...</td>
                    <td className="px-3 py-2 ui-label text-[var(--text-body)]">{new Date(row.createdAtMs).toLocaleString()}</td>
                    <td className="px-3 py-2 ui-label">
                      <span className={verified ? "text-emerald-700" : "text-[var(--text-muted)]"}>
                        {verified ? "Verified" : "Pending"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}
