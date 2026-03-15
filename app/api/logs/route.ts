import { NextResponse } from "next/server";
import { getAuditFor, type AuditRole } from "@/lib/omnicure/audit-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = (searchParams.get("role") ?? "all") as AuditRole | "all";
  const actorId = searchParams.get("actorId") ?? undefined;

  return NextResponse.json({
    logs: getAuditFor(role, actorId),
  });
}
