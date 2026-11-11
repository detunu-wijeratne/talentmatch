
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentMatch | AI Recruitment",
  description: "AI-powered candidate matching and recruitment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#f6f8fc] text-slate-900 antialiased">
        <div className="min-h-screen md:flex">
          <aside className="bg-[#101828] text-white md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0">
            <div className="border-b border-white/10 px-6 py-6">
              <Link href="/jobs" className="text-xl font-bold tracking-tight">
                Talent<span className="text-indigo-400">Match</span>
              </Link>
              <p className="mt-1 text-xs text-slate-400">
                AI Recruitment Platform
              </p>
            </div>

            <nav className="flex gap-2 p-4 md:flex-col">
              <Link
                href="/jobs"
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Jobs
              </Link>

              <Link
                href="/candidates"
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Candidates
              </Link>
            </nav>

            <div className="hidden px-6 pt-6 text-xs text-slate-500 md:block">
              Powered by Gemini AI
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="border-b border-slate-200 bg-white px-5 py-5 md:px-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                    Recruitment Intelligence
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Discover the right talent, faster.
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  AI Matching
                </span>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-5 py-8 md:px-10">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
