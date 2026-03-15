import { NextResponse } from "next/server";
import { getAllDoctorPatients, linkDoctorToPatient } from "@/lib/omnicure/clinical-store";
import { pushAudit } from "@/lib/omnicure/audit-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId") ?? "doc-501";

  const patients = getAllDoctorPatients(doctorId).map((patient) => ({
    id: patient.id,
    name: patient.name,
  }));

  return NextResponse.json({ patients });
}

type EnrollPayload = {
  doctorId?: string;
  patientId?: string;
  patientName?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ?? {}) as EnrollPayload;
  const doctorId = body.doctorId?.trim();
  const patientId = body.patientId?.trim();

  if (!doctorId || !patientId) {
    return NextResponse.json(
      { error: "Doctor ID and Patient ID are required" },
      { status: 400 },
    );
  }

  const result = linkDoctorToPatient(doctorId, patientId);

  if (!result.patient) {
    return NextResponse.json({ error: result.error ?? "Unable to enroll patient" }, { status: 404 });
  }

  if (body.patientName?.trim() && body.patientName.trim().toLowerCase() !== result.patient.name.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "Patient ID exists but patient name does not match" },
      { status: 400 },
    );
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  pushAudit({
    role: "doctor",
    actorId: doctorId,
    message: `Patient ${result.patient.name} (${result.patient.id}) added to enrolled list.`,
    status: "success",
  });

  return NextResponse.json({
    status: "patient_enrolled",
    patient: {
      id: result.patient.id,
      name: result.patient.name,
      age: result.patient.age,
      condition: result.patient.condition,
    },
  });
}
