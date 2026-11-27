import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const heading = Space_Grotesk({ subsets: ["latin"], variable: "--font-heading" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = { title: "SevaAI", description: "Customer service AI" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${heading.variable} ${body.variable}`}>
      <body className="bg-canvas text-text-primary font-body antialiased">{children}</body>
    </html>
  );
}
