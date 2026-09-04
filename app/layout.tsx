import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SCC Archive",
  description: "Soft Coding Club의 인터랙티브 프로젝트 아카이브.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
