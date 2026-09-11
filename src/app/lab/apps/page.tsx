import AppsWorkbench from "@/components/lab/AppsWorkbench";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Science apps",
  description:
    "Open Lab by PL R&D. Explore real scientific artifacts, draft contributions, and make research more reproducible.",
  alternates: { canonical: "/lab/apps/" },
};
export default function Page() {
  return <AppsWorkbench />;
}
