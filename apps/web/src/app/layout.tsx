import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecallOS — Your Personal Knowledge OS",
  description: "Capture, learn, and never forget technical concepts with AI-powered spaced repetition.",
  icons: {
    icon: "/logo-creme.png",
    shortcut: "/logo-creme.png",
    apple: "/logo-creme.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
