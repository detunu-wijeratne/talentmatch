
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ minScore?: string }>;
};

export default async function JobDetailsPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { minScore } = await searchParams;

  const parsed = Number(minScore ?? 0);
  const minimum = Number.isFinite(parsed)
    ? Math.max(0, Math.min(100, parsed))
    : 0;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      matches: {
        where: { totalScore: { gte: minimum } },
        include: { candidate: true },
        orderBy: [
          { totalScore: "desc" },
          { candidateId: "asc" },
        ],
      },
    },
  });

  if (!job) notFound();

  return (
    <div className="space-y-7">
      <Link
        href="/jobs"
        className="inline-block text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Back to jobs
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Job ID: {job.id}
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          {job.title}
        </h1>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg bg-indigo-50 px-3 py-2 text-indigo-700">
            {job.requiredSkills.length} required skills
          </span>
          <span className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
            Expected experience: {job.expectedYears ?? "Not inferred"} years
          </span>
        </div>

        <h2 className="mt-8 text-lg font-semibold">
          Required Skills
        </h2>

        <div className="mt-3 flex flex-wrap gap-2">
          {job.requiredSkills.map(skill => (
            <span
              key={skill}
              className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700"
            >
              {skill}
            </span>
          ))}
        </div>

        <details className="mt-8 rounded-xl border border-slate-200 p-4">
          <summary className="cursor-pointer font-medium">
            View full job description
          </summary>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {job.description}
          </p>
        </details>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">AI-Ranked Candidates</h2>
          <p className="mt-1 text-sm text-slate-500">
            {job.matches.length} saved results meet the filter
          </p>
        </div>

        <form method="get" className="flex items-end gap-2">
          <label className="text-sm font-medium text-slate-600">
            Minimum score
            <select
              name="minScore"
              defaultValue={String(minimum)}
              className="mt-2 block rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm"
            >
              {[0, 30, 50, 70, 80, 90].map(score => (
                <option key={score} value={score}>
                  {score}+
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Apply
          </button>
        </form>
      </div>

      {job.matches.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          No saved matching results meet this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {job.matches.map((match, index) => (
            <div
              key={match.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-700">
                    #{index + 1}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      {match.candidate.name ?? `Candidate ${match.candidateId}`}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {match.candidate.designation ?? "Designation unavailable"}
                      {" · "}
                      {match.candidate.experience ?? "Unknown"} years
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Candidate ID: {match.candidateId}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">
                    {match.totalScore.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-500">
                    Overall match
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Skills", match.skillsScore, 50],
                  ["Experience", match.experienceScore, 30],
                  ["Designation", match.designationScore, 20],
                ].map(([label, score, maximum]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="mt-1 font-semibold">
                      {Number(score).toFixed(1)}/{maximum}
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${Math.min(
                            100,
                            (Number(score) / Number(maximum)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Matched Skills ({match.matchedSkills.length})
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {match.matchedSkills.join(", ") || "None identified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-amber-700">
                    Missing Skills ({match.missingSkills.length})
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {match.missingSkills.join(", ") || "None identified"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-indigo-50/60 p-4">
                <p className="text-xs font-semibold text-indigo-700">
                  AI MATCH EXPLANATION
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {match.reason ?? "Explanation not available"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
