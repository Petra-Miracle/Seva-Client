import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const heading = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const body = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "SevaAI", template: "%s · SevaAI" },
  description: "Customer service AI multi-mitra untuk ISP lokal.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme="light" className={`light ${heading.variable} ${body.variable}`}>
      <body className="min-h-dvh font-body text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
