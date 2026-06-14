import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mayan Oracle",
  description: "A 70-card Mayan oracle deck — browse, seek guidance, and receive readings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
