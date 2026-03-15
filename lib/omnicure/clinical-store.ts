import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type UserRole = "patient" | "doctor";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  linkedPatientIds?: string[];
};

export type RegisterInput = {
  role: UserRole;
  id: string;
  name: string;
  email: string;
  password: string;
};

export type DeviceRecord = {
  id: string;
  name: string;
  model: string;
  identifier: string;
  connectionType: "bluetooth";
  connected: boolean;
  lastSyncedAt: string | null;
};

export type AdviceRecord = {
  id: string;
  doctorName: string;
  note: string;
  createdAt: string;
};

export type PrescriptionRecord = {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
};

export type MedicationLog = {
  id: string;
  medicine: string;
  dueAt: string;
  taken: boolean;
  takenAt: string | null;
};

export type CareMedicationRecord = {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  status: "ongoing" | "previous";
  prescribedBy: string;
  startedAt: string;
  endedAt: string | null;
  notes: string;
};

export type MedicalHistoryRecord = {
  id: string;
  title: string;
  category: "condition" | "surgery" | "allergy" | "visit";
  recordedOn: string;
  details: string;
};

export type LabReportTest = {
  id: string;
  testName: string;
  result: string;
  note: string;
};

export type LabReportRecord = {
  id: string;
  name: string;
  collectedOn: string;
  tests: LabReportTest[];
};

export type DailyVitalRecord = {
  id: string;
  recordedAt: string;
  heartRateBpm: number;
  spo2: number;
  sugarMgDl: number;
  bloodPressure: string;
  temperatureC: number;
};

export type WeeklyVitalRecord = {
  id: string;
  weekLabel: string;
  averageHeartRateBpm: number;
  averageSpo2: number;
  averageSugarMgDl: number;
  averageSystolic: number;
  averageDiastolic: number;
  adherencePercent: number;
};

export type HealthSnapshot = {
  bloodPressure: string;
  sugarMgDl: number;
  heartRateBpm: number;
  spo2: number;
  activityScore: number;
};

export type PatientRecord = {
  id: string;
  name: string;
  age: number;
  heightCm: number;
  weightKg: number;
  condition: string;
  nextMedicationDue: string;
  health: HealthSnapshot;
  devices: DeviceRecord[];
  advice: AdviceRecord[];
  prescriptions: PrescriptionRecord[];
  medications: MedicationLog[];
  careMedications: CareMedicationRecord[];
  medicalHistory: MedicalHistoryRecord[];
  labReports: LabReportRecord[];
  dailyVitals: DailyVitalRecord[];
  weeklyVitals: WeeklyVitalRecord[];
};

export type PatientRecordSection =
  | "dailyVitals"
  | "weeklyVitals"
  | "careMedications"
  | "advice"
  | "medicalHistory"
  | "labReports";

type PatientRecordSectionMap = {
  dailyVitals: DailyVitalRecord;
  weeklyVitals: WeeklyVitalRecord;
  careMedications: CareMedicationRecord;
  advice: AdviceRecord;
  medicalHistory: MedicalHistoryRecord;
  labReports: LabReportRecord;
};

type StoreSnapshot = {
  users: UserRecord[];
  patients: PatientRecord[];
};

const STORE_FILE_PATH = path.join(process.cwd(), "data", "omnicure-store.json");

const users: UserRecord[] = [];

const createEmptyPatientRecord = (id: string, name: string): PatientRecord => ({
  id,
  name,
  age: 0,
  heightCm: 0,
  weightKg: 0,
  condition: "",
  nextMedicationDue: "",
  health: {
    bloodPressure: "",
    sugarMgDl: 0,
    heartRateBpm: 0,
    spo2: 0,
    activityScore: 0,
  },
  devices: [],
  advice: [],
  prescriptions: [],
  medications: [],
  careMedications: [],
  medicalHistory: [],
  labReports: [],
  dailyVitals: [],
  weeklyVitals: [],
});

const patients = new Map<string, PatientRecord>();

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

const getNextUntakenDue = (medications: MedicationLog[]): string => {
  return medications
    .filter((medication) => !medication.taken)
    .sort((left, right) => new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime())[0]?.dueAt ?? "";
};

const saveStoreSnapshot = () => {
  const payload: StoreSnapshot = {
    users,
    patients: Array.from(patients.values()),
  };

  mkdirSync(path.dirname(STORE_FILE_PATH), { recursive: true });
  writeFileSync(STORE_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
};

const isDemoUser = (user: UserRecord) => user.email.endsWith("@omnicure.demo");

const loadStoreSnapshot = () => {
  if (!existsSync(STORE_FILE_PATH)) {
    return;
  }

  try {
    const raw = readFileSync(STORE_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;

    if (!Array.isArray(parsed.users) || !Array.isArray(parsed.patients)) {
      return;
    }

    const cleanedUsers = parsed.users
      .filter((user): user is UserRecord => Boolean(user && typeof user.id === "string" && typeof user.email === "string"))
      .filter((user) => !isDemoUser(user))
      .map((user) => ({
        ...user,
        linkedPatientIds: user.linkedPatientIds?.filter((linkedId) =>
          parsed.patients?.some((patient) => patient?.id === linkedId),
        ),
      }));

    users.splice(0, users.length, ...cleanedUsers);

    const validUserIds = new Set(cleanedUsers.filter((user) => user.role === "patient").map((user) => user.id));
    patients.clear();
    for (const patient of parsed.patients) {
      if (patient && typeof patient.id === "string") {
        if (validUserIds.has(patient.id)) {
          patients.set(patient.id, patient as PatientRecord);
        }
      }
    }

    saveStoreSnapshot();
  } catch {
    // fall back to seeded in-memory data
  }
};

loadStoreSnapshot();

export const authenticateUser = (
  id: string,
  password: string,
  role?: UserRole,
): UserRecord | undefined => {
  const normalizedIdentifier = id.trim().toLowerCase();
  const normalizedPassword = password.trim();

  const matches = users.filter((user) => {
    const idMatches = user.id.toLowerCase() === normalizedIdentifier;
    const emailMatches = user.email.toLowerCase() === normalizedIdentifier;
    const nameMatches = user.name.trim().toLowerCase() === normalizedIdentifier;
    return (idMatches || emailMatches || nameMatches) && user.password.trim() === normalizedPassword;
  });

  if (matches.length === 0) {
    return undefined;
  }

  if (!role) {
    return matches[0];
  }

  return matches.find((user) => user.role === role);
};

export const getUserById = (id: string): UserRecord | undefined => {
  const normalizedId = id.trim().toLowerCase();
  return users.find((user) => user.id.toLowerCase() === normalizedId);
};

export const getPatientById = (patientId: string): PatientRecord | undefined => {
  return patients.get(patientId);
};

export const getAllDoctorPatients = (doctorId: string): PatientRecord[] => {
  const doctor = users.find((user) => user.id === doctorId && user.role === "doctor");
  const linkedIds = doctor?.linkedPatientIds ?? [];
  return linkedIds
    .map((patientId) => patients.get(patientId))
    .filter((patient): patient is PatientRecord => Boolean(patient));
};

export const linkDoctorToPatient = (
  doctorId: string,
  patientId: string,
): { patient?: PatientRecord; error?: string } => {
  const doctorIndex = users.findIndex((user) => user.id === doctorId && user.role === "doctor");
  if (doctorIndex === -1) {
    return { error: "Doctor account not found" };
  }

  const patient = patients.get(patientId);
  if (!patient) {
    return { error: "Patient ID not found" };
  }

  const currentDoctor = users[doctorIndex]!;
  const linkedIds = currentDoctor.linkedPatientIds ?? [];

  if (linkedIds.includes(patientId)) {
    return { patient, error: "Patient is already enrolled in your list" };
  }

  users[doctorIndex] = {
    ...currentDoctor,
    linkedPatientIds: [...linkedIds, patientId],
  };

  saveStoreSnapshot();
  return { patient };
};

export const logMedicationTaken = (
  patientId: string,
  medicationId: string,
): PatientRecord | undefined => {
  const record = patients.get(patientId);

  if (!record) {
    return undefined;
  }

  const updatedMeds = record.medications.map((medication) => {
    if (medication.id !== medicationId) {
      return medication;
    }

    return {
      ...medication,
      taken: true,
      takenAt: new Date().toISOString(),
    };
  });

  const nextDue = getNextUntakenDue(updatedMeds);

  const updated: PatientRecord = {
    ...record,
    medications: updatedMeds,
    nextMedicationDue: nextDue,
  };

  patients.set(patientId, updated);
  saveStoreSnapshot();
  return updated;
};

export const addMedicationLog = (
  patientId: string,
  entry: Omit<MedicationLog, "id" | "taken" | "takenAt">,
): PatientRecord | undefined => {
  const record = patients.get(patientId);
  if (!record) return undefined;

  const newMed: MedicationLog = {
    id: makeId("med"),
    taken: false,
    takenAt: null,
    ...entry,
  };

  const updatedMeds = [newMed, ...record.medications];
  const updated: PatientRecord = {
    ...record,
    medications: updatedMeds,
    nextMedicationDue: getNextUntakenDue(updatedMeds),
  };

  patients.set(patientId, updated);
  saveStoreSnapshot();
  return updated;
};

export const removeMedicationLog = (
  patientId: string,
  medicationId: string,
): PatientRecord | undefined => {
  const record = patients.get(patientId);
  if (!record) return undefined;

  const updatedMeds = record.medications.filter((m) => m.id !== medicationId);
  const updated: PatientRecord = {
    ...record,
    medications: updatedMeds,
    nextMedicationDue: getNextUntakenDue(updatedMeds),
  };

  patients.set(patientId, updated);
  saveStoreSnapshot();
  return updated;
};

export const pairDevice = (
  patientId: string,
  deviceName: string,
  model: string,
  identifier: string,
): PatientRecord | undefined => {
  const record = patients.get(patientId);

  if (!record) {
    return undefined;
  }

  const now = new Date().toISOString();
  const updated: PatientRecord = {
    ...record,
    devices: [
      ...record.devices,
      {
        id: makeId("dev"),
        name: deviceName,
        model,
        identifier,
        connectionType: "bluetooth",
        connected: true,
        lastSyncedAt: now,
      },
    ],
  };

  patients.set(patientId, updated);
  saveStoreSnapshot();
  return updated;
};

export const upsertPatientSectionItem = <TSection extends PatientRecordSection>(
  patientId: string,
  section: TSection,
  item: PatientRecordSectionMap[TSection],
): PatientRecord | undefined => {
  const record = patients.get(patientId);

  if (!record) {
    return undefined;
  }

  const existingItems = record[section] as PatientRecordSectionMap[TSection][];
  const hasExisting = existingItems.some((entry) => entry.id === item.id);
  const nextItems = hasExisting
    ? existingItems.map((entry) => (entry.id === item.id ? item : entry))
    : [item, ...existingItems];

  const updated: PatientRecord = {
    ...record,
    [section]: nextItems,
  } as PatientRecord;

  patients.set(patientId, updated);
  saveStoreSnapshot();
  return updated;
};

export const createPatientSectionItem = <TSection extends PatientRecordSection>(
  patientId: string,
  section: TSection,
  item: Omit<PatientRecordSectionMap[TSection], "id">,
): PatientRecord | undefined => {
  return upsertPatientSectionItem(patientId, section, {
    id: makeId(section),
    ...item,
  } as PatientRecordSectionMap[TSection]);
};

export const addCareMedicationRecord = (
  patientId: string,
  payload: Omit<CareMedicationRecord, "id">,
): PatientRecord | undefined => {
  const record = patients.get(patientId);
  if (!record) return undefined;

  const careMed: CareMedicationRecord = { id: makeId("care-med"), ...payload };

  // Generate today's scheduled doses from frequency pattern like "1 - 0 - 1 - 0"
  // Slot order: morning 07:30, afternoon 13:00, evening 17:00, night 20:30
  const freqParts = careMed.frequency.split("-").map((part) => Number.parseInt(part.trim(), 10) || 0);
  const slotTimes = ["07:30", "13:00", "17:00", "20:30"];
  const today = new Date().toISOString().slice(0, 10);
  const newMeds: MedicationLog[] = freqParts
    .map((part, index) =>
      part > 0 && slotTimes[index]
        ? ({
            id: makeId("med"),
            medicine: careMed.medicine,
            dueAt: `${today}T${slotTimes[index]}:00.000Z`,
            taken: false,
            takenAt: null,
          } as MedicationLog)
        : null,
    )
    .filter((m): m is MedicationLog => m !== null);

  const updated: PatientRecord = {
    ...record,
    careMedications: [careMed, ...record.careMedications],
    medications: [...newMeds, ...record.medications],
    nextMedicationDue: getNextUntakenDue([...newMeds, ...record.medications]),
  };

  patients.set(patientId, updated);
  saveStoreSnapshot();
  return updated;
};

export const updatePatientProfile = (
  patientId: string,
  updates: { name: string; age: number; heightCm: number; weightKg: number; password?: string },
): { patient?: PatientRecord; error?: string } => {
  const record = patients.get(patientId);
  if (!record) return { error: "Patient not found" };

  if (!updates.name.trim() || updates.age < 1 || updates.heightCm < 1 || updates.weightKg < 1) {
    return { error: "Please provide valid name, age, height, and weight." };
  }

  const updated: PatientRecord = {
    ...record,
    name: updates.name.trim(),
    age: updates.age,
    heightCm: updates.heightCm,
    weightKg: updates.weightKg,
  };

  if (updates.password) {
    const userIndex = users.findIndex((u) => u.id === patientId);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex]!, password: updates.password.trim() };
    }
  }

  patients.set(patientId, updated);
  saveStoreSnapshot();
  return { patient: updated };
};

export const registerUser = (input: RegisterInput): { user?: UserRecord; error?: string } => {
  const normalizedId = input.id.trim();
  const normalizedName = input.name.trim();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPassword = input.password.trim();

  if (!normalizedId || !normalizedName || !normalizedEmail || !normalizedPassword) {
    return { error: "Please fill all required fields." };
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  if (!emailIsValid) {
    return { error: "Please enter a valid email address." };
  }

  if (users.some((user) => user.id === normalizedId)) {
    return { error: "Account already exists with this ID" };
  }

  if (users.some((user) => user.email === normalizedEmail)) {
    return { error: "Account already exists with this email" };
  }

  const user: UserRecord = {
    id: normalizedId,
    name: normalizedName,
    email: normalizedEmail,
    role: input.role,
    password: normalizedPassword,
    linkedPatientIds: input.role === "doctor" ? [] : undefined,
  };

  users.push(user);

  if (input.role === "patient") {
    const patientRecord: PatientRecord = {
      id: normalizedId,
      name: normalizedName,
      age: 0,
      heightCm: 0,
      weightKg: 0,
      condition: "",
      nextMedicationDue: "",
      health: {
        bloodPressure: "",
        sugarMgDl: 0,
        heartRateBpm: 0,
        spo2: 0,
        activityScore: 0,
      },
      devices: [],
      advice: [],
      prescriptions: [],
      medications: [],
      careMedications: [],
      medicalHistory: [],
      labReports: [],
      dailyVitals: [],
      weeklyVitals: [],
    };

    patients.set(normalizedId, patientRecord);
  }

  saveStoreSnapshot();

  return { user };
};