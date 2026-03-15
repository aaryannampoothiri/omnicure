import { NextResponse } from "next/server";
import { addMedicationLog } from "@/lib/omnicure/clinical-store";
import { pushAudit } from "@/lib/omnicure/audit-store";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

type RequestPayload = {
  medicine?: string;
  dueAt?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;

  if (!body.medicine?.trim()) {
    return NextResponse.json({ error: "medicine is required" }, { status: 400 });
  }

  if (!body.dueAt) {
    return NextResponse.json({ error: "dueAt is required" }, { status: 400 });
  }

  const updated = addMedicationLog(patientId, {
    medicine: body.medicine.trim(),
    dueAt: body.dueAt,
  });

  if (!updated) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  pushAudit({
    role: "patient",
    actorId: patientId,
    message: `Medication added: ${body.medicine.trim()}.`,
    status: "success",
  });

  return NextResponse.json({ status: "added", patient: updated });
}
