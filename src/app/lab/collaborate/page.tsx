import { DemoCommunityPanel } from "@/components/lab/demo";
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
  return <><div className="lab-wrap"><DemoCommunityPanel className="lab-community-supplement" context="agents" caseId="reproducibility" title="A small test for a researcher and a skeptical reviewer" showPeople /></div><CollaborateWorkbench evidenceWorkbench={<LabEvidenceWorkbench />} /></>;
}
