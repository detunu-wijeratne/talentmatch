
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      matches: {
        orderBy: { totalScore: "desc" },
        take: 1,
        select: { totalScore: true },
      },
      _count: {
        select: { matches: true },
      },
    },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-indigo-600">
          JOB MANAGEMENT
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Open Positions
        </h1>
        <p className="mt-2 text-slate-500">
          Explore job requirements and AI-ranked candidates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Jobs", value: jobs.length },
          {
            label: "Jobs With Matches",
            value: jobs.filter(job => job._count.matches > 0).length,
          },
          {
            label: "Saved AI Matches",
            value: jobs.reduce(
              (sum, job) => sum + job._count.matches,
              0
            ),
          },
        ].map(item => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {jobs.map(job => {
          const highestScore = job.matches[0]?.totalScore;

          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-600">
                  {job.title.charAt(0)}
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  ID: {job.id}
                </span>
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-indigo-600">
                {job.title}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {job.requiredSkills.length} required skills
                {" · "}
                {job.expectedYears ?? "—"} expected years
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {job.requiredSkills.slice(0, 3).map(skill => (
                  <span
                    key={skill}
                    className="max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                <div>
                  <p className="text-xs text-slate-500">
                    Candidates evaluated
                  </p>
                  <p className="mt-1 font-semibold">
                    {job._count.matches}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">
                    Highest match
                  </p>
                  <p className="mt-1 text-lg font-bold text-indigo-600">
                    {highestScore === undefined
                      ? "Not matched"
                      : `${highestScore.toFixed(1)}%`}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
