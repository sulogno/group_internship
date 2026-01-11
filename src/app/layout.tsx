import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Groupify Campus - Find your people. Build your team.",
  description:
    "The smart platform for college students to form internship training groups seamlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
