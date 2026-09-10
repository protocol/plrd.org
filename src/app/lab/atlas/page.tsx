import AtlasWorkbench from "@/components/lab/AtlasWorkbench";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Atlas contributions",
  description:
    "Open Lab by PL R&D. Explore real scientific artifacts, draft contributions, and make research more reproducible.",
  alternates: { canonical: "/lab/atlas/" },
};
export default function Page() {
  return <AtlasWorkbench />;
}
