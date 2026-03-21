import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RCQI - Root-Centric Qur'an Interpreter",
  description:
    "A world-class Qur'an research platform with AI-powered root analysis, word-level interaction, and comprehensive linguistic insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
