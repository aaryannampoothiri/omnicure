import { randomUUID } from "node:crypto";
import type {
  DoctorRegistration,
  HandshakeResult,
  PatientRegistration,
  SessionKeyResult,
  TAState,
} from "@/lib/omnicure/protocol";

export type ProtocolContext = {
  protocolId: string;
  createdAtMs: number;
  ta: TAState;
  doctor?: DoctorRegistration;
  patient?: PatientRegistration;
  authentication?: HandshakeResult & {
    latencyMs: number;
    timestampMs: number;
    u1: bigint;
  };
  session?: SessionKeyResult;
};

const protocolStore = new Map<string, ProtocolContext>();

export const createProtocolContext = (ta: TAState): ProtocolContext => {
  const context: ProtocolContext = {
    protocolId: randomUUID(),
    createdAtMs: Date.now(),
    ta,
  };

  protocolStore.set(context.protocolId, context);
  return context;
};

export const getProtocolContext = (protocolId: string): ProtocolContext | undefined => {
  return protocolStore.get(protocolId);
};

export const updateProtocolContext = (
  protocolId: string,
  updater: (context: ProtocolContext) => ProtocolContext,
): ProtocolContext | undefined => {
  const existing = protocolStore.get(protocolId);

  if (!existing) {
    return undefined;
  }

  const updated = updater(existing);
  protocolStore.set(protocolId, updated);
  return updated;
};

export const listProtocolContexts = (): ProtocolContext[] => {
  return [...protocolStore.values()].sort((left, right) => right.createdAtMs - left.createdAtMs);
};
