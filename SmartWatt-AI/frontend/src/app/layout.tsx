import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartWatt AI - Full-Stack Smart Energy Monitoring & Prediction",
  description: "AI-Powered Virtual Smart Meter Simulation, Anomaly Detection & Random Forest Forecasting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
