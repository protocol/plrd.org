import LabShell from "@/components/lab/LabShell";
import "./lab.css";
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <LabShell>{children}</LabShell>;
}
