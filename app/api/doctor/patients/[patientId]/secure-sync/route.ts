import { NextResponse } from "next/server";
import { getAllDoctorPatients, getPatientById } from "@/lib/omnicure/clinical-store";
import {
  deriveU1ForPairing,
  generateDynamicSessionKey,
  initializeTA,
  performMutualAuthentication,
  registerDoctor,
  registerPatient,
} from "@/lib/omnicure/protocol";
import { pushAudit } from "@/lib/omnicure/audit-store";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

const sharedTA = initializeTA();
const sharedU1Nonce = deriveU1ForPairing(sharedTA);
const doctorRegistrationCache = new Map<string, ReturnType<typeof registerDoctor>>();
const patientRegistrationCache = new Map<string, ReturnType<typeof registerPatient>>();

const getDoctorRegistration = (doctorId: string) => {
  const cached = doctorRegistrationCache.get(doctorId);
  if (cached) {
    return cached;
  }

  const next = registerDoctor(sharedTA, { d1: doctorId });
  doctorRegistrationCache.set(doctorId, next);
  return next;
};

const getPatientRegistration = (patientId: string) => {
  const cached = patientRegistrationCache.get(patientId);
  if (cached) {
    return cached;
  }

  const next = registerPatient(sharedTA, { ui: patientId, g2: sharedTA.g2 });
  patientRegistrationCache.set(patientId, next);
  return next;
};

export async function POST(request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const requestUrl = new URL(request.url);
  const patient = getPatientById(patientId);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    doctorId?: string;
  };

  const doctorId = body.doctorId?.trim() || requestUrl.searchParams.get("doctorId")?.trim() || "doc-501";

  const canAccessPatient = getAllDoctorPatients(doctorId).some(
    (record) => record.id === patient.id,
  );

  if (!canAccessPatient) {
    pushAudit({
      role: "doctor",
      actorId: doctorId,
      message: `Secure transfer denied for patient ${patient.id}: patient not linked to doctor.`,
      status: "critical",
    });
    return NextResponse.json({ error: "Patient is not linked to this doctor" }, { status: 403 });
  }

  const timestampMs = Date.now();
  const doctorRegistration = getDoctorRegistration(doctorId);
  const patientRegistration = getPatientRegistration(patient.id);

  const authentication = performMutualAuthentication(sharedTA, {
    ui: patient.id,
    u1Nonce: sharedU1Nonce,
    timestampMs,
    u2Star: patientRegistration.u2,
    b1: patientRegistration.b1,
    b2: patientRegistration.b2,
    g2: patientRegistration.g2,
    u1Auth: patientRegistration.u1Auth,
    doctorD1Scalar: doctorRegistration.d1Scalar,
    doctorD1Key: doctorRegistration.d1Key,
    doctorD2: doctorRegistration.d2,
  });

  const isCryptoVerified =
    authentication.isUserHashValid &&
    authentication.isTimestampFresh &&
    authentication.bilinearVerified &&
    authentication.sessionKeyAgreed;

  if (!isCryptoVerified) {
    pushAudit({
      role: "doctor",
      actorId: doctorId,
      message: `Cryptographic authentication failed for patient ${patient.id}.`,
      status: "critical",
    });

    return NextResponse.json(
      { error: "Cryptographic verification failed during secure transfer." },
      { status: 401 },
    );
  }

  const session = generateDynamicSessionKey(BigInt(timestampMs), sharedU1Nonce, doctorId);

  pushAudit({
    role: "doctor",
    actorId: doctorId,
    message: `Secure ECC + bilinear-pairing bridge established for patient ${patient.name}.`,
    status: "success",
  });

  return NextResponse.json({
    status: "secure_transfer_complete",
    transferId: `sync-${Date.now()}`,
    secure: true,
    validUntil: session.expiresAtMs,
    cryptography: {
      ellipticCurve: true,
      bilinearPairing: authentication.bilinearVerified,
      timestampFresh: authentication.isTimestampFresh,
      mutualAuthentication: authentication.isUserHashValid,
      sessionKeyAgreement: authentication.sessionKeyAgreed,
    },
    patientData: patient,
    message: "Secure channel established. Clinical data delivered.",
  });
}
