import "./globals.css";

import type { Metadata } from "next";

import { RoleProvider } from "@/lib/roleContext";

export const metadata: Metadata = {
  title: "SkyFleet Logistics",
  description: "Real-time fleet management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">

        {/* =========================
            GLOBAL ROLE CONTEXT
        ========================= */}
        <RoleProvider>

          {/* APP CONTENT */}
          {children}

        </RoleProvider>

      </body>
    </html>
  );
}