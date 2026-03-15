import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OMNICURE | IoMT Security Framework",
  description:
    "A robust, high-performance security framework for secure real-time patient-doctor communication in IoMT.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} app-shell antialiased`}>
        {children}
      </body>
    </html>
  );
}
