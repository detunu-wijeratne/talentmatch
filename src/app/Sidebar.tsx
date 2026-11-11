
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/jobs", label: "Job Opportunities", icon: "jobs" },
  { href: "/candidates", label: "Talent Directory", icon: "users" },
] as const;

function NavIcon({ icon }: { icon: "jobs" | "users" }) {
  if (icon === "jobs") {
    return (
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M3 13a21 21 0 0 0 18 0" />
      </svg>
    );
  }

  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative z-10 w-full shrink-0 bg-[#101a32] text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-[264px]">
      <div className="flex h-full flex-col">
        <Link
          href="/jobs"
          className="flex items-center gap-3 px-6 py-6 lg:py-9"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20">
            <svg
              width="25"
              height="25"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m4 14 5-5 4 4 7-8" />
              <path d="M15 5h5v5" />
              <path d="M4 20h16" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">
              Talent<span className="text-indigo-400">Match</span>
            </p>
            <p className="text-[10px] font-medium uppercase tracking-[0.19em] text-slate-400">
              AI Recruitment Platform
            </p>
          </div>
        </Link>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-5 lg:mt-8 lg:flex-col lg:gap-2 lg:overflow-visible lg:pb-0">
          <p className="hidden px-4 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 lg:block">
            Workspace
          </p>

          {links.map((link) => {
            const active =
              pathname === link.href ||
              pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/20"
                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <NavIcon icon={link.icon} />
                <span>{link.label}</span>
                {active && (
                  <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-white lg:block" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden px-5 pb-7 lg:block">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                AI Matching Engine
              </span>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Intelligent candidate matching powered by Google Gemini.
            </p>
          </div>
          <p className="mt-5 px-2 text-xs text-slate-500">
            TalentMatch · Recruitment Intelligence
          </p>
        </div>
      </div>
    </aside>
  );
}
