import { NextResponse } from "next/server";
import { logMedicationTaken } from "@/lib/omnicure/clinical-store";
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

  const updated = logMedicationTaken(patientId, body.medicationId);

  if (!updated) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const medication = updated.medications.find((item) => item.id === body.medicationId);
  pushAudit({
    role: "patient",
    actorId: patientId,
    message: `Medication intake logged: ${medication?.medicine ?? "Scheduled dose"}.`,
    status: "success",
  });

  return NextResponse.json({
    status: "logged",
    patient: updated,
  });
}
