"use client";

export type PatientOverview = {
  id: string;
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  condition: string;
  nextMedicationDue: string;
  health: {
    bloodPressure: string;
    sugarMgDl: number;
    heartRateBpm: number;
    spo2: number;
    activityScore: number;
  };
  devices: Array<{
    id: string;
    name: string;
    model: string;
    identifier: string;
    connectionType: "bluetooth";
    connected: boolean;
    lastSyncedAt: string | null;
  }>;
  advice: Array<{
    id: string;
    doctorName: string;
    note: string;
    createdAt: string;
  }>;
  prescriptions: Array<{
    id: string;
    medicine: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string;
  }>;
  medications: Array<{
    id: string;
    medicine: string;
    dueAt: string;
    taken: boolean;
    takenAt: string | null;
  }>;
  careMedications: Array<{
    id: string;
    medicine: string;
    dosage: string;
    frequency: string;
    status: "ongoing" | "previous";
    prescribedBy: string;
    startedAt: string;
    endedAt: string | null;
    notes: string;
  }>;
  medicalHistory: Array<{
    id: string;
    title: string;
    category: "condition" | "surgery" | "allergy" | "visit";
    recordedOn: string;
    details: string;
  }>;
  labReports: Array<{
    id: string;
    name: string;
    collectedOn: string;
    tests: Array<{
      id: string;
      testName: string;
      result: string;
      note: string;
    }>;
  }>;
  dailyVitals: Array<{
    id: string;
    recordedAt: string;
    heartRateBpm: number;
    spo2: number;
    sugarMgDl: number;
    bloodPressure: string;
    temperatureC: number;
  }>;
  weeklyVitals: Array<{
    id: string;
    weekLabel: string;
    averageHeartRateBpm: number;
    averageSpo2: number;
    averageSugarMgDl: number;
    averageSystolic: number;
    averageDiastolic: number;
    adherencePercent: number;
  }>;
};

export const fetchPatientOverview = async (patientId: string): Promise<PatientOverview> => {
  const response = await fetch(`/api/patient/${patientId}/overview`);
  const data = (await response.json()) as { patient?: PatientOverview; error?: string };

  if (!response.ok || !data.patient) {
    throw new Error(data.error ?? "Unable to load patient data");
  }

  return data.patient;
};
