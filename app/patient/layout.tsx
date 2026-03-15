import PortalShell from "@/app/components/portal-shell";
import RoleGate from "@/app/components/role-gate";

const patientNav = [
  { label: "Overview", href: "/patient" },
  { label: "Profile", href: "/patient/profile" },
  { label: "Vitals", href: "/patient/vitals" },
  { label: "Medications", href: "/patient/medications" },
  { label: "Medical History", href: "/patient/history" },
  { label: "Lab Reports", href: "/patient/lab-reports" },
  { label: "Doctor Advice", href: "/patient/comments" },
  { label: "Devices", href: "/patient/devices" },
  { label: "Logs", href: "/patient/logs" },
];

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGate role="patient">
      <PortalShell role="patient" heading="Patient Care Portal" navItems={patientNav}>
        {children}
      </PortalShell>
    </RoleGate>
  );
}
