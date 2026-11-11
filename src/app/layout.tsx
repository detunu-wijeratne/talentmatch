
import type { Metadata } from "next";
import Link from "next/link";
import Sidebar from "./Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentMatch | AI Recruitment Platform",
  description:
    "AI-powered recruitment intelligence and candidate matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f6f8fc] text-slate-900 antialiased">
        <Sidebar />

        <div className="min-h-screen lg:ml-[264px]">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
            <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">
                  Recruitment Workspace
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                  Talent Intelligence Dashboard
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  AI Powered
                </span>

                <Link
                  href="/candidates"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600 transition hover:bg-indigo-100"
                  aria-label="Open talent directory"
                >
                  TM
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
