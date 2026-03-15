"use client";

import { useEffect, useMemo, useState } from "react";

type HandshakeModalProps = {
  open: boolean;
  onClose: () => void;
  onComplete?: () => void;
};

export default function HandshakeModal({ open, onClose, onComplete }: HandshakeModalProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 8, 100);
        if (next === 100) {
          onComplete?.();
        }
        return next;
      });
    }, 180);

    return () => {
      clearInterval(timer);
    };
  }, [open, onComplete]);

  const finished = useMemo(() => progress >= 100, [progress]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mutual Authentication">
      <div className="glass-panel w-full max-w-xl rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="ui-header text-[var(--text-heading)]">Data Transfer</h2>
            <p className="mt-1 ui-label text-[var(--text-body)]">
              Transferring requested patient data.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary rounded-lg px-3 py-1 ui-label hover:bg-[var(--surface-alt)] active:translate-y-px"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-alt)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)]">Transferring data... {progress}%</p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="ui-label text-[var(--text-body)]">
            {finished ? "Transfer complete." : "Please wait..."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="btn-primary rounded-lg px-4 py-2 ui-label  active:translate-y-px"
          >
            {finished ? "Continue" : "Hide"}
          </button>
        </div>
      </div>
    </div>
  );
}
