import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "金利君",
  description: "住宅ローン返済シミュレーター・家計診断アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
