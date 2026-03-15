import { NextResponse } from "next/server";
import { serializeBigInt } from "@/app/api/omnicure/_shared";
import { initializeTA } from "@/lib/omnicure/protocol";
import { createProtocolContext, listProtocolContexts } from "@/lib/omnicure/store";

export async function POST() {
  const ta = initializeTA();
  const context = createProtocolContext(ta);

  return NextResponse.json({
    status: "initialized",
    protocolId: context.protocolId,
    ta: serializeBigInt(context.ta),
  });
}

export async function GET() {
  return NextResponse.json({
    protocols: serializeBigInt(listProtocolContexts()),
  });
}
