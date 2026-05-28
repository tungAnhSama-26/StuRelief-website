import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

import { SessionTimeout } from "@/components/SessionTimeout";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "StuRelief - Campus Exchange",
  description: "Nền tảng trao đổi đồ dùng học tập của sinh viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`h-full antialiased ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SessionTimeout />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
