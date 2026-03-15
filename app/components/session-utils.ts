"use client";

export type ClientSession = {
  id: string;
  name: string;
  role: "patient" | "doctor";
  needsProfileSetup?: boolean;
};

export const getSession = (): ClientSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem("omnicure_session");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ClientSession;
  } catch {
    return null;
  }
};
