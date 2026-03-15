import { NextResponse } from "next/server";
import {
  generateDynamicSessionKey,
  hashToBigInt,
  initializeTA,
  performMutualAuthentication,
  registerDoctor,
  registerPatient,
} from "@/lib/omnicure/protocol";

type RequestPayload = {
  doctorId?: string;
  userId?: string;
};

const serializeBigInt = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInt(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeBigInt(nested)]),
    );
  }

  return value;
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;

  const doctorId = body.doctorId ?? "DOC-001";
  const userId = body.userId ?? "PAT-001";

  const ta = initializeTA();

  const doctor = registerDoctor(ta, {
    d1: doctorId,
    g3: hashToBigInt(`g3:${doctorId}`),
  });

  const patient = registerPatient(ta, {
    ui: userId,
    g2: ta.g2,
  });

  const timestampMs = Date.now();
  const u1Nonce = hashToBigInt(`dc-nonce:${userId}:${timestampMs}`);
  const authentication = performMutualAuthentication(ta, {
    ui: userId,
    u1Nonce,
    timestampMs,
    u2Star: patient.u2,
    g2: patient.g2,
    b1: patient.b1,
    b2: patient.b2,
    u1Auth: patient.u1Auth,
    doctorD1Scalar: doctor.d1Scalar,
    doctorD1Key: doctor.d1Key,
    doctorD2: doctor.d2,
  });

  if (
    !authentication.isUserHashValid ||
    !authentication.isTimestampFresh ||
    !authentication.bilinearVerified ||
    !authentication.sessionKeyAgreed
  ) {
    return NextResponse.json(
      {
        status: "rejected",
        reason: "Authentication checks failed",
        details: serializeBigInt(authentication),
      },
      { status: 401 },
    );
  }

  const session = generateDynamicSessionKey(BigInt(timestampMs), u1Nonce, doctorId);

  return NextResponse.json({
    status: "authenticated",
    ta: serializeBigInt(ta),
    registration: serializeBigInt({ doctor, patient }),
    authentication: serializeBigInt(authentication),
    session: serializeBigInt(session),
    notes: {
      targetLatencyMs: "20-30",
      keyPolicy: "Dynamic session key expires automatically",
      scalability: "Modular phase-based functions suitable for institutional deployment",
    },
  });
}
