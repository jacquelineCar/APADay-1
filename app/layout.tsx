import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "APA — Payroll membership, training and help desk",
  description:
    "Ask the APA help desk a payroll question, join or renew your membership, or enquire about training.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
