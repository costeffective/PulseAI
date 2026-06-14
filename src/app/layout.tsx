import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { bricolage, instrumentSerif, plusJakarta } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Pulse",
    template: "%s · Pulse",
  },
  description:
    "AI-powered feedback triage and tracking for small teams.",
  icons: {
    icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  openGraph: {
    title: "Pulse",
    description:
      "AI-powered feedback triage and tracking for small teams.",
    images: [{ url: "/brand/logo.svg", width: 168, height: 40, alt: "Pulse" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${instrumentSerif.variable} ${bricolage.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
