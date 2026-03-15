import { createHash, randomBytes } from "node:crypto";

const FIELD_PRIME = BigInt("170141183460469231731687303715884105727");
const GROUP_ORDER = FIELD_PRIME - 1n;
const DEFAULT_TIMESTAMP_WINDOW_MS = 30_000;

export type TAState = {
  a: bigint;
  t: bigint;
  g1: bigint;
  g2: bigint;
  g3: bigint;
  x: bigint;
  fieldPrime: bigint;
  bilinearMap: "e: G1 x G2 -> Gt";
};

export type DoctorRegistrationInput = {
  d1: string;
  g3?: bigint;
};

export type DoctorRegistration = {
  d1: string;
  d1Scalar: bigint;
  g3: bigint;
  d1Key: bigint;
  d2: bigint;
  d3: bigint;
};

export type PatientRegistrationInput = {
  ui: string;
  g2?: bigint;
};

export type PatientRegistration = {
  ui: string;
  uiScalar: bigint;
  g2: bigint;
  b1: bigint;
  b2: bigint;
  u1Auth: bigint;
  u2: string;
  expectedG2: bigint;
};

export type HandshakeInput = {
  ui: string;
  u1Nonce: bigint;
  timestampMs: number;
  u2Star: string;
  b1: bigint;
  b2: bigint;
  g2: bigint;
  u1Auth: bigint;
  doctorD1Scalar: bigint;
  doctorD1Key: bigint;
  doctorD2: bigint;
};

export type HandshakeResult = {
  u2: string;
  expectedU2: string;
  isUserHashValid: boolean;
  isTimestampFresh: boolean;
  tu: string;
  td: string;
  bilinearVerified: boolean;
  skd: string;
  skta: string;
  sku: string;
  sessionKeyAgreed: boolean;
};

export type SessionKeyResult = {
  sessionKeyHex: string;
  expiresAtMs: number;
};

const mod = (value: bigint, p: bigint = FIELD_PRIME): bigint => {
  const result = value % p;
  return result >= 0n ? result : result + p;
};

const compatibleG2Cache = new WeakMap<TAState, bigint>();

const modPow = (base: bigint, exponent: bigint, p: bigint = FIELD_PRIME): bigint => {
  let result = 1n;
  let currentBase = mod(base, p);
  let currentExponent = exponent;

  while (currentExponent > 0n) {
    if ((currentExponent & 1n) === 1n) {
      result = mod(result * currentBase, p);
    }

    currentBase = mod(currentBase * currentBase, p);
    currentExponent >>= 1n;
  }

  return result;
};

const hashHex = (value: string): string => {
  return createHash("sha256").update(value).digest("hex");
};

const hashToGroupScalar = (value: string): bigint => {
  return mod(BigInt(`0x${hashHex(value)}`), GROUP_ORDER);
};

export const hashToBigInt = (value: string): bigint => {
  return mod(BigInt(`0x${hashHex(value)}`), FIELD_PRIME);
};

const randomScalar = (): bigint => {
  return mod(BigInt(`0x${randomBytes(32).toString("hex")}`), GROUP_ORDER - 1n) + 1n;
};

const keyFromXor = (left: bigint, middle: bigint, right: bigint): bigint => {
  return left ^ middle ^ right;
};

const toHex64 = (value: bigint): string => {
  return mod(value).toString(16).padStart(64, "0");
};

const u1Exponent = (ta: TAState): bigint => {
  return mod(ta.a + 2n * ta.t, GROUP_ORDER);
};

export const generateCompatibleG2 = (ta: TAState): bigint => {
  const cached = compatibleG2Cache.get(ta);
  if (cached !== undefined) {
    return cached;
  }

  const exp = u1Exponent(ta);
  const pairingExp = mod(exp * exp, GROUP_ORDER);
  const derived = modPow(ta.g1, pairingExp);
  compatibleG2Cache.set(ta, derived);
  return derived;
};

export const initializeTA = (): TAState => {
  const g1 = randomScalar();
  const a = randomScalar();
  const t = randomScalar();
  const g3 = randomScalar();
  const g2 = generateCompatibleG2({
    a,
    t,
    g1,
    g2: 1n,
    g3,
    x: 1n,
    fieldPrime: FIELD_PRIME,
    bilinearMap: "e: G1 x G2 -> Gt",
  });
  const x = modPow(g1, a);

  return {
    a,
    t,
    g1,
    g2,
    g3,
    x,
    fieldPrime: FIELD_PRIME,
    bilinearMap: "e: G1 x G2 -> Gt",
  };
};

export const registerDoctor = (
  ta: TAState,
  input: DoctorRegistrationInput,
): DoctorRegistration => {
  const d1Scalar = hashToGroupScalar(input.d1);
  const d1KeyExponent = mod(ta.a + d1Scalar, GROUP_ORDER);
  const d2Exponent = mod(ta.a - d1Scalar + ta.t, GROUP_ORDER);
  const d3Exponent = mod(2n * ta.a + ta.t, GROUP_ORDER);

  return {
    d1: input.d1,
    d1Scalar,
    g3: input.g3 ?? ta.g3,
    d1Key: modPow(ta.g1, d1KeyExponent),
    d2: modPow(ta.g1, d2Exponent),
    d3: modPow(ta.g1, d3Exponent),
  };
};

export const registerPatient = (
  ta: TAState,
  input: PatientRegistrationInput,
): PatientRegistration => {
  const uiScalar = hashToGroupScalar(input.ui);
  const b1Exponent = mod(ta.t + uiScalar, GROUP_ORDER);
  const b2Exponent = mod(ta.a + ta.t - uiScalar, GROUP_ORDER);
  const u1AuthExponent = u1Exponent(ta);

  const b1 = modPow(ta.g1, b1Exponent);
  const b2 = modPow(ta.g1, b2Exponent);
  const u1Auth = modPow(ta.g1, u1AuthExponent);
  const u2 = hashHex(`${u1Auth.toString(16)}||${input.ui}`);

  const expectedG2 = generateCompatibleG2(ta);
  const g2 = input.g2 ?? expectedG2;

  return {
    ui: input.ui,
    uiScalar,
    g2,
    b1,
    b2,
    u1Auth,
    u2,
    expectedG2,
  };
};

export const deriveU1ForPairing = (ta: TAState): bigint => {
  return modPow(ta.g1, u1Exponent(ta));
};

export const performMutualAuthentication = (
  ta: TAState,
  input: HandshakeInput,
  freshnessWindowMs: number = DEFAULT_TIMESTAMP_WINDOW_MS,
): HandshakeResult => {
  const expectedU2 = hashHex(`${input.u1Auth.toString(16)}||${input.ui}`);
  const isUserHashValid = expectedU2 === input.u2Star;

  const now = Date.now();
  const isTimestampFresh = Math.abs(now - input.timestampMs) <= freshnessWindowMs;

  const tu = hashHex(
    `${input.b1.toString(16)}|${input.b2.toString(16)}|${input.u1Nonce.toString(16)}|${input.timestampMs}`,
  );
  const td = hashHex(
    `${input.doctorD1Key.toString(16)}|${input.doctorD2.toString(16)}|${input.doctorD1Key.toString(16)}|${input.timestampMs}`,
  );

  const expectedG2 = generateCompatibleG2(ta);
  const bilinearVerified = expectedG2 === input.g2;

  const t1 = BigInt(input.timestampMs);
  const skd = keyFromXor(input.u1Nonce, t1, input.doctorD1Scalar);
  const skta = keyFromXor(input.doctorD1Scalar, t1, input.u1Nonce);
  const sku = keyFromXor(t1, input.u1Nonce, input.doctorD1Scalar);
  const sessionKeyAgreed = skd === skta && skta === sku;

  return {
    u2: input.u2Star,
    expectedU2,
    isUserHashValid,
    isTimestampFresh,
    tu,
    td,
    bilinearVerified,
    skd: toHex64(skd),
    skta: toHex64(skta),
    sku: toHex64(sku),
    sessionKeyAgreed,
  };
};

export const generateDynamicSessionKey = (
  t1: bigint,
  u1: bigint,
  d1: string,
  ttlMs: number = 120_000,
): SessionKeyResult => {
  const d1Scalar = hashToGroupScalar(d1);
  const key = keyFromXor(t1, u1, d1Scalar);

  return {
    sessionKeyHex: toHex64(key),
    expiresAtMs: Date.now() + ttlMs,
  };
};
