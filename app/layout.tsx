import type { Metadata } from "next";
import "./globals.css";
import "./compact.css";
import "./planner-fix.css";
import "./tracker-inspired.css";
import "./planner-upgrades.css";
import "./usability-fixes.css";
import "./labeling-vibrance.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Umamusume Parent Planner",
  description:
    "A current Global Umamusume parent-farming planner with affinity calculations, veteran records, race routes, and next-run suggestions.",
  icons: {
    icon: `${basePath}/favicon.svg`,
    shortcut: `${basePath}/favicon.svg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
