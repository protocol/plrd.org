import { DemoPeople } from "@/components/lab/demo";
import ProfileWorkbench from "@/components/lab/ProfileWorkbench";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "My bench",
  description:
    "Open Lab by PL R&D. Explore real scientific artifacts, draft contributions, and make research more reproducible.",
  alternates: { canonical: "/lab/profile/" },
};
export default function Page() {
  return <><ProfileWorkbench /><div className="lab-wrap"><DemoPeople className="lab-community-supplement" variant="cards" /></div></>;
}
