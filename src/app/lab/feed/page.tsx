import FeedWorkbench from "@/components/lab/FeedWorkbench";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "The lab",
  description:
    "Open Lab by PL R&D. Explore real scientific artifacts, draft contributions, and make research more reproducible.",
  alternates: { canonical: "/lab/feed/" },
};
export default function Page() {
  return <FeedWorkbench />;
}
