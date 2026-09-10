import Landing from "@/components/lab/Landing";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Open Lab",
  description:
    "Open Lab by PL R&D. Explore real scientific artifacts, draft contributions, and make research more reproducible.",
  alternates: { canonical: "/lab/" },
};
export default function Page() {
  return <Landing />;
}
