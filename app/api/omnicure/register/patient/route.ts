import { NextResponse } from "next/server";
import { getContextOrResponse, serializeBigInt } from "@/app/api/omnicure/_shared";
import { registerPatient } from "@/lib/omnicure/protocol";
import { updateProtocolContext } from "@/lib/omnicure/store";

type RequestPayload = {
  protocolId?: string;
  userId?: string;
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;
  const protocolId = body.protocolId;
  const userId = body.userId ?? "PAT-001";

  if (!protocolId) {
    return NextResponse.json({ error: "protocolId is required" }, { status: 400 });
  }

  const found = getContextOrResponse(protocolId);
  if (found.response) {
    return found.response;
  }

  const context = found.context;
  const patient = registerPatient(context.ta, {
    ui: userId,
    g2: context.ta.g2,
  });

  const updated = updateProtocolContext(protocolId, (current) => ({
    ...current,
    patient,
  }));

  return NextResponse.json({
    status: "patient_registered",
    protocolId,
    patient: serializeBigInt(patient),
    context: serializeBigInt(updated),
  });
}
