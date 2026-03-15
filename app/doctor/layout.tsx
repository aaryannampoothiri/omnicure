import PortalShell from "@/app/components/portal-shell";
import RoleGate from "@/app/components/role-gate";

const doctorNav = [
  { label: "Home", href: "/doctor" },
  { label: "Patients", href: "/doctor/patients" },
  { label: "Logs", href: "/doctor/logs" },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate role="doctor">
      <PortalShell role="doctor" heading="Doctor Command Portal" navItems={doctorNav}>
        {children}
      </PortalShell>
    </RoleGate>
  );
}
