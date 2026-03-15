import { NextResponse } from "next/server";
import { serializeBigInt } from "@/app/api/omnicure/_shared";
import { getProtocolContext } from "@/lib/omnicure/store";

type RouteParams = {
  params: Promise<{
    protocolId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { protocolId } = await params;
  const context = getProtocolContext(protocolId);

  if (!context) {
    return NextResponse.json({ error: "Unknown protocolId" }, { status: 404 });
  }

  return NextResponse.json({
    protocolId,
    context: serializeBigInt(context),
  });
}
