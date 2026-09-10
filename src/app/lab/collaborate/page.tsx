import CollaborateWorkbench from "@/components/lab/CollaborateWorkbench";
import LabEvidenceWorkbench from "@/components/lab/LabEvidenceWorkbench";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Collaborate",
  description:
    "Open Lab by PL R&D. Explore real scientific artifacts, draft contributions, and make research more reproducible.",
  alternates: { canonical: "/lab/collaborate/" },
};
export default function Page() {
  return <CollaborateWorkbench evidenceWorkbench={<LabEvidenceWorkbench />} />;
}
