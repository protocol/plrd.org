import { LabAuthProvider } from "@/lib/lab-auth";
import LabShell from "@/components/lab/LabShell";
import "./lab.css";
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <LabAuthProvider><LabShell>{children}</LabShell></LabAuthProvider>;
}
