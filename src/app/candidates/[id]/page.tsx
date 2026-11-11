
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CandidateProfilePage({
  params,
}: Props) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      matches: {
        include: { job: true },
        orderBy: [
          { totalScore: "desc" },
          { jobId: "asc" },
        ],
      },
    },
  });

  if (!candidate) notFound();

  const initials = (candidate.name ?? "Candidate")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-7">
      <Link
        href="/candidates"
        className="inline-block text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Back to candidates
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-600">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Candidate Profile · {candidate.id}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {candidate.name ?? "Unnamed Candidate"}
            </h1>
            <p className="mt-2 text-slate-600">
              {candidate.designation ?? "Designation unavailable"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {candidate.company ?? "Company unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Total Experience",
              value: candidate.experience === null
                ? "Not available"
                : `${candidate.experience} years`,
            },
            {
              label: "Skills",
              value: String(candidate.skills.length),
            },
            {
              label: "AI Evaluations",
              value: String(candidate.matches.length),
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl bg-slate-50 p-5"
            >
              <p className="text-xs text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-xl font-semibold">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">Email</p>
            <p className="mt-2 break-all text-sm text-slate-600">
              {candidate.email ?? "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Phone</p>
            <p className="mt-2 text-sm text-slate-600">
              {candidate.phone ?? "Not provided"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-xl font-semibold">
          Candidate Skills
        </h2>

        <div className="mt-5 flex flex-wrap gap-2">
          {candidate.skills.length > 0 ? (
            candidate.skills.map((skill, index) => (
              <span
                key={`${skill}-${index}`}
                className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700"
              >
                {skill}
              </span>
            ))
          ) : (
            <p className="text-sm text-slate-500">
              No skills extracted from this CV.
            </p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">
          Best-Matching Jobs
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ranked opportunities based on saved AI evaluations.
        </p>
      </div>

      {candidate.matches.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          This candidate has not been evaluated against any jobs yet.
        </div>
      ) : (
        <div className="space-y-4">
          {candidate.matches.map((match, index) => (
            <Link
              key={match.id}
              href={`/jobs/${match.jobId}`}
              className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">
                    JOB MATCH #{index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {match.job.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Job ID: {match.jobId}
                  </p>
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

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["Skills", match.skillsScore, 50],
                  ["Experience", match.experienceScore, 30],
                  ["Designation", match.designationScore, 20],
                ].map(([label, score, max]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl bg-slate-50 p-3 sm:p-4"
                  >
                    <p className="text-xs text-slate-500">
                      {label}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {Number(score).toFixed(1)}/{max}
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${
                            Math.min(
                              100,
                              (Number(score) / Number(max)) * 100
                            )
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {match.reason ?? "Explanation not available"}
              </p>

              <p className="mt-4 text-sm font-semibold text-indigo-600">
                View job details →
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div>
          <h2 className="text-xl font-semibold">
            Original CV
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Full text of the imported candidate CV.
          </p>
        </div>

        <details className="mt-5 rounded-xl border border-slate-200">
          <summary className="cursor-pointer p-4 text-sm font-semibold">
            View Full CV
          </summary>

          <pre className="max-h-[650px] overflow-auto whitespace-pre-wrap break-words border-t border-slate-200 bg-slate-50 p-5 font-mono text-xs leading-6 text-slate-700">
            {candidate.rawCV}
          </pre>
        </details>
      </div>
    </div>
  );
}
