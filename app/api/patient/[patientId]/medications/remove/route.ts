import { NextResponse } from "next/server";
import { removeMedicationLog } from "@/lib/omnicure/clinical-store";
import { pushAudit } from "@/lib/omnicure/audit-store";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

type RequestPayload = {
  medicationId?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;

  if (!body.medicationId) {
    return NextResponse.json({ error: "medicationId is required" }, { status: 400 });
  }

  const updated = removeMedicationLog(patientId, body.medicationId);

  if (!updated) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  pushAudit({
    role: "patient",
    actorId: patientId,
    message: `Medication log entry removed.`,
    status: "success",
  });

  return NextResponse.json({ status: "removed", patient: updated });
}
