"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSession } from "@/app/components/session-utils";

type RoleGateProps = {
  role: "patient" | "doctor";
  children: React.ReactNode;
};

export default function RoleGate({ role, children }: RoleGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const session = getSession();

    if (!session || session.role !== role) {
      const next = encodeURIComponent(pathname || `/${role}`);
      router.replace(`/login?next=${next}`);
      return;
    }

    if (
      role === "patient"
      && session.needsProfileSetup
      && pathname !== "/patient/profile"
    ) {
      router.replace("/patient/profile?setup=1");
      return;
    }

    setAllowed(true);
  }, [role, pathname, router]);

  if (!allowed) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-foreground/70">Validating session...</p>
      </main>
    );
  }

  return <>{children}</>;
}
