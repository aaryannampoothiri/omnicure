import { NextResponse } from "next/server";
import { pushAudit } from "@/lib/omnicure/audit-store";
import { registerUser } from "@/lib/omnicure/clinical-store";

type RequestPayload = {
  role?: "patient" | "doctor";
  id?: string;
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = ((await request.json().catch(() => ({}))) ?? {}) as RequestPayload;

  if (
    !body.role ||
    !body.id?.trim() ||
    !body.name?.trim() ||
    !body.email?.trim() ||
    !body.password?.trim()
  ) {
    return NextResponse.json(
      { error: "Please fill all required fields." },
      { status: 400 },
    );
  }

  const outcome = registerUser({
    role: body.role,
    id: body.id,
    name: body.name,
    email: body.email,
    password: body.password,
  });

  if (outcome.error || !outcome.user) {
    return NextResponse.json({ error: outcome.error ?? "Registration failed" }, { status: 400 });
  }

  const auditMessage =
    outcome.user.role === "doctor"
      ? "Doctor account registered successfully."
      : "Patient account registered successfully.";

  pushAudit({
    role: outcome.user.role,
    actorId: outcome.user.id,
    message: auditMessage,
    status: "success",
  });

  return NextResponse.json({
    id: outcome.user.id,
    name: outcome.user.name,
    role: outcome.user.role,
    message: "Account created successfully",
  });
}
