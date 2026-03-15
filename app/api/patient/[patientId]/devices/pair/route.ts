import { NextResponse } from "next/server";
import { pairDevice } from "@/lib/omnicure/clinical-store";
import { pushAudit } from "@/lib/omnicure/audit-store";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

type RequestPayload = {
  deviceName?: string;
  model?: string;
  identifier?: string;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;

  if (!body.deviceName || !body.model || !body.identifier) {
    return NextResponse.json(
      { error: "deviceName, model and identifier are required" },
      { status: 400 },
    );
  }

  const updated = pairDevice(patientId, body.deviceName, body.model, body.identifier);

  if (!updated) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  pushAudit({
    role: "patient",
    actorId: patientId,
    message: `Device paired: ${body.deviceName} (${body.identifier}).`,
    status: "success",
  });

  return NextResponse.json({
    status: "paired",
    patient: updated,
  });
}
