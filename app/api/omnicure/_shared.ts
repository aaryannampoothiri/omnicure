import { NextResponse } from "next/server";
import { getProtocolContext } from "@/lib/omnicure/store";

export const serializeBigInt = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInt(item));
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeBigInt(nested)]),
    );
  }

  return value;
};

export const getContextOrResponse = (protocolId: string) => {
  const context = getProtocolContext(protocolId);

  if (!context) {
    return {
      response: NextResponse.json(
        { error: "Unknown protocolId. Initialize TA first." },
        { status: 404 },
      ),
    };
  }

  return { context };
};
