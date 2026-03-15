import { NextResponse } from "next/server";
import { authenticateUser, getAllDoctorPatients, getPatientById } from "@/lib/omnicure/clinical-store";
import { pushAudit } from "@/lib/omnicure/audit-store";

type RequestPayload = {
  id?: string;
  password?: string;
  role?: "patient" | "doctor";
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;

  if (!body.id?.trim() || !body.password?.trim()) {
    return NextResponse.json(
      { error: "Please fill all required fields." },
      { status: 400 },
    );
  }

  const user = authenticateUser(body.id.trim(), body.password.trim(), body.role);

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (user.role === "doctor") {
    pushAudit({
      role: "doctor",
      actorId: user.id,
      message: "Doctor authenticated and portal session established.",
      status: "success",
    });

    return NextResponse.json({
      role: user.role,
      id: user.id,
      name: user.name,
      patientCount: getAllDoctorPatients(user.id).length,
    });
  }

  pushAudit({
    role: "patient",
    actorId: user.id,
    message: "Patient authenticated and monitoring dashboard unlocked.",
    status: "success",
  });

  const patient = getPatientById(user.id);
  const needsProfileSetup = !patient || patient.age < 1 || patient.heightCm < 1 || patient.weightKg < 1;

  return NextResponse.json({
    role: user.role,
    id: user.id,
    name: user.name,
    needsProfileSetup,
  });
}
