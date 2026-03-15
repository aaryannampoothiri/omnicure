import { performance } from "node:perf_hooks";
import { NextResponse } from "next/server";
import { getContextOrResponse, serializeBigInt } from "@/app/api/omnicure/_shared";
import {
  generateDynamicSessionKey,
  hashToBigInt,
  performMutualAuthentication,
} from "@/lib/omnicure/protocol";
import { updateProtocolContext } from "@/lib/omnicure/store";
import { pushAudit } from "@/lib/omnicure/audit-store";

type RequestPayload = {
  protocolId?: string;
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;
  const protocolId = body.protocolId;

  if (!protocolId) {
    return NextResponse.json({ error: "protocolId is required" }, { status: 400 });
  }

  const found = getContextOrResponse(protocolId);
  if (found.response) {
    return found.response;
  }

  const context = found.context;
  if (!context.doctor || !context.patient) {
    return NextResponse.json(
      { error: "Doctor and patient must be registered before authentication" },
      { status: 400 },
    );
  }

  const timestampMs = Date.now();
  const u1Nonce = hashToBigInt(`dc-nonce:${protocolId}:${timestampMs}`);
  const u2Star = context.patient.u2;

  const start = performance.now();
  const authentication = performMutualAuthentication(context.ta, {
    ui: context.patient.ui,
    u1Nonce,
    timestampMs,
    u2Star,
    g2: context.patient.g2,
    b1: context.patient.b1,
    b2: context.patient.b2,
    u1Auth: context.patient.u1Auth,
    doctorD1Scalar: context.doctor.d1Scalar,
    doctorD1Key: context.doctor.d1Key,
    doctorD2: context.doctor.d2,
  });
  const latencyMs = Number((performance.now() - start).toFixed(3));

  if (
    !authentication.isUserHashValid ||
    !authentication.isTimestampFresh ||
    !authentication.bilinearVerified ||
    !authentication.sessionKeyAgreed
  ) {
    return NextResponse.json(
      {
        status: "rejected",
        protocolId,
        latencyMs,
        authentication: serializeBigInt(authentication),
      },
      { status: 401 },
    );
  }

  const session = generateDynamicSessionKey(BigInt(timestampMs), u1Nonce, context.doctor.d1);
  pushAudit({
    role: "system",
    actorId: protocolId,
    message: `Mutual authentication complete. Optimized secure channel at ${latencyMs} ms.`,
    status: latencyMs <= 30 ? "success" : "warning",
  });

  const updated = updateProtocolContext(protocolId, (current) => ({
    ...current,
    authentication: {
      ...authentication,
      latencyMs,
      timestampMs,
      u1: u1Nonce,
    },
    session,
  }));

  return NextResponse.json({
    status: "authenticated",
    protocolId,
    latencyMs,
    benchmarkWindowMs: "20-30",
    benchmarkStatus: latencyMs <= 30 ? "within_target" : "above_target",
    authentication: serializeBigInt(authentication),
    session: serializeBigInt(session),
    context: serializeBigInt(updated),
  });
}
