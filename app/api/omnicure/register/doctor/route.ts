import { NextResponse } from "next/server";
import { getContextOrResponse, serializeBigInt } from "@/app/api/omnicure/_shared";
import { hashToBigInt, registerDoctor } from "@/lib/omnicure/protocol";
import { updateProtocolContext } from "@/lib/omnicure/store";

type RequestPayload = {
  protocolId?: string;
  doctorId?: string;
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;
  const protocolId = body.protocolId;
  const doctorId = body.doctorId ?? "DOC-001";

  if (!protocolId) {
    return NextResponse.json({ error: "protocolId is required" }, { status: 400 });
  }

  const found = getContextOrResponse(protocolId);
  if (found.response) {
    return found.response;
  }

  const context = found.context;
  const doctor = registerDoctor(context.ta, {
    d1: doctorId,
    g3: hashToBigInt(`g3:${doctorId}`),
  });

  const updated = updateProtocolContext(protocolId, (current) => ({
    ...current,
    doctor,
  }));

  return NextResponse.json({
    status: "doctor_registered",
    protocolId,
    doctor: serializeBigInt(doctor),
    context: serializeBigInt(updated),
  });
}
