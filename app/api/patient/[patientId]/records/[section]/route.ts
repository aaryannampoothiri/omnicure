import { NextResponse } from "next/server";
import { pushAudit } from "@/lib/omnicure/audit-store";
import {
  createPatientSectionItem,
  getPatientById,
  type PatientRecordSection,
  upsertPatientSectionItem,
  addCareMedicationRecord,
  type CareMedicationRecord,
} from "@/lib/omnicure/clinical-store";

type RouteParams = {
  params: Promise<{
    patientId: string;
    section: string;
  }>;
};

const patientSections: PatientRecordSection[] = [
  "dailyVitals",
  "weeklyVitals",
  "careMedications",
  "advice",
  "medicalHistory",
  "labReports",
];

const isPatientSection = (value: string): value is PatientRecordSection => {
  return patientSections.includes(value as PatientRecordSection);
};

const parseBodyForSection = (section: PatientRecordSection, body: Record<string, unknown>) => {
  switch (section) {
    case "dailyVitals":
      return {
        id: typeof body.id === "string" ? body.id : undefined,
        recordedAt: String(body.recordedAt ?? new Date().toISOString()),
        heartRateBpm: Number(body.heartRateBpm ?? 0),
        spo2: Number(body.spo2 ?? 0),
        sugarMgDl: Number(body.sugarMgDl ?? 0),
        bloodPressure: String(body.bloodPressure ?? ""),
        temperatureC: Number(body.temperatureC ?? 0),
      };
    case "weeklyVitals":
      return {
        id: typeof body.id === "string" ? body.id : undefined,
        weekLabel: String(body.weekLabel ?? ""),
        averageHeartRateBpm: Number(body.averageHeartRateBpm ?? 0),
        averageSpo2: Number(body.averageSpo2 ?? 0),
        averageSugarMgDl: Number(body.averageSugarMgDl ?? 0),
        averageSystolic: Number(body.averageSystolic ?? 0),
        averageDiastolic: Number(body.averageDiastolic ?? 0),
        adherencePercent: Number(body.adherencePercent ?? 0),
      };
    case "careMedications":
      return {
        id: typeof body.id === "string" ? body.id : undefined,
        medicine: String(body.medicine ?? ""),
        dosage: String(body.dosage ?? ""),
        frequency: String(body.frequency ?? ""),
        status: body.status === "previous" ? "previous" : "ongoing",
        prescribedBy: String(body.prescribedBy ?? ""),
        startedAt: String(body.startedAt ?? ""),
        endedAt: body.endedAt ? String(body.endedAt) : null,
        notes: String(body.notes ?? ""),
      };
    case "advice":
      return {
        id: typeof body.id === "string" ? body.id : undefined,
        doctorName: String(body.doctorName ?? ""),
        note: String(body.note ?? ""),
        createdAt: String(body.createdAt ?? new Date().toISOString()),
      };
    case "medicalHistory":
      return {
        id: typeof body.id === "string" ? body.id : undefined,
        title: String(body.title ?? ""),
        category:
          body.category === "surgery" ||
          body.category === "allergy" ||
          body.category === "visit"
            ? body.category
            : "condition",
        recordedOn: String(body.recordedOn ?? ""),
        details: String(body.details ?? ""),
      };
    case "labReports":
    {
      const rawTests = Array.isArray(body.tests) ? body.tests : [];
      const tests = rawTests
        .filter((t): t is Record<string, unknown> => t !== null && typeof t === "object")
        .filter((t) => t.testName && t.result)
        .map((t) => ({
          id: typeof t.id === "string" ? t.id : crypto.randomUUID(),
          testName: String(t.testName),
          result: String(t.result),
          note: String(t.note ?? ""),
        }));
      return {
        id: typeof body.id === "string" ? body.id : undefined,
        name: String(body.name ?? ""),
        collectedOn: String(body.collectedOn ?? ""),
        tests,
      };
    }
  }
};

const validatePayload = (section: PatientRecordSection, payload: Record<string, unknown>) => {
  switch (section) {
    case "dailyVitals":
      return Boolean(payload.recordedAt && payload.bloodPressure);
    case "weeklyVitals":
      return Boolean(payload.weekLabel);
    case "careMedications":
      return Boolean(
        payload.medicine &&
          payload.dosage &&
          payload.frequency &&
          payload.prescribedBy &&
          payload.startedAt &&
          /^\s*\d+\s*-\s*\d+\s*-\s*\d+\s*-\s*\d+\s*$/.test(String(payload.frequency)),
      );
    case "advice":
      return Boolean(payload.doctorName && payload.note && payload.createdAt);
    case "medicalHistory":
      return Boolean(payload.title && payload.recordedOn && payload.details);
    case "labReports":
      return Boolean(
        payload.name &&
          payload.collectedOn &&
          Array.isArray(payload.tests) &&
          (payload.tests as unknown[]).length > 0,
      );
  }
};

export async function POST(request: Request, { params }: RouteParams) {
  const { patientId, section } = await params;

  if (!isPatientSection(section)) {
    return NextResponse.json({ error: "Unknown record section" }, { status: 400 });
  }

  const patient = getPatientById(patientId);
  if (!patient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const body = ((await request.json().catch(() => ({}))) ?? {}) as Record<string, unknown>;
  const payload = parseBodyForSection(section, body) as Record<string, unknown>;

  if (!validatePayload(section, payload)) {
    return NextResponse.json({ error: "Please fill all required fields for this section." }, { status: 400 });
  }

  const updated = payload.id
    ? upsertPatientSectionItem(patientId, section, payload as never)
    : section === "careMedications"
      ? addCareMedicationRecord(patientId, payload as Omit<CareMedicationRecord, "id">)
      : createPatientSectionItem(patientId, section, payload as never);

  if (!updated) {
    return NextResponse.json({ error: "Patient update failed" }, { status: 400 });
  }

  pushAudit({
    role: "patient",
    actorId: patientId,
    message: `Patient updated ${section} records.`,
    status: "success",
  });

  return NextResponse.json({ patient: updated });
}