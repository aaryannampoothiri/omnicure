export type AuditRole = "patient" | "doctor" | "system";

export type AuditEntry = {
  id: string;
  role: AuditRole;
  actorId: string;
  message: string;
  status: "success" | "warning" | "critical";
  timestamp: string;
};

const auditLog: AuditEntry[] = [
  {
    id: "log-1",
    role: "system",
    actorId: "omnicure-core",
    message: "Trusted Authority initialized for secure channels.",
    status: "success",
    timestamp: new Date().toISOString(),
  },
];

export const pushAudit = (entry: Omit<AuditEntry, "id" | "timestamp">) => {
  auditLog.unshift({
    id: `log-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
};

export const getAuditFor = (role: AuditRole | "all", actorId?: string): AuditEntry[] => {
  return auditLog
    .filter((entry) => {
      if (role !== "all" && entry.role !== role && entry.role !== "system") {
        return false;
      }

      if (actorId && entry.actorId !== actorId && entry.role !== "system") {
        return false;
      }

      return true;
    })
    .slice(0, 50);
};
