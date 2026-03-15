import { NextResponse } from "next/server";
import { pushAudit } from "@/lib/omnicure/audit-store";
import { getPatientById, updatePatientProfile } from "@/lib/omnicure/clinical-store";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const patient = getPatientById(patientId);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      id: patient.id,
      name: patient.name,
      age: patient.age,
      heightCm: patient.heightCm,
      weightKg: patient.weightKg,
    },
  });
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const body = ((await request.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;

  const result = updatePatientProfile(patientId, {
    name: String(body.name ?? ""),
    age: Number(body.age ?? 0),
    heightCm: Number(body.heightCm ?? 0),
    weightKg: Number(body.weightKg ?? 0),
    password: typeof body.password === "string" ? body.password : undefined,
  });

  if (result.error || !result.patient) {
    return NextResponse.json({ error: result.error ?? "Profile update failed" }, { status: 400 });
  }

  pushAudit({
    role: "patient",
    actorId: patientId,
    message: "Patient profile updated.",
    status: "success",
  });

  return NextResponse.json({ patient: result.patient });
}
