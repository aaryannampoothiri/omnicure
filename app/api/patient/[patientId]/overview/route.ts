import { NextResponse } from "next/server";
import { getPatientById } from "@/lib/omnicure/clinical-store";

type RouteParams = {
  params: Promise<{ patientId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { patientId } = await params;
  const patient = getPatientById(patientId);

  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  return NextResponse.json({ patient });
}
