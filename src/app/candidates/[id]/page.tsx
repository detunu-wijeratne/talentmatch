
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function ScoreBar({
  label,
  score,
  max,
}: {
  label: string;
  score: number;
  max: number;
}) {
  const percentage = Math.min(
    100,
    Math.max(0, (score / max) * 100)
  );

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold tabular-nums text-slate-800">
          {score.toFixed(1)}
          <span className="font-normal text-slate-400">
            /{max}
          </span>
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default async function CandidateProfilePage({
  params,
}: Props) {
  const { id } = await params;

  const candidate = await prisma.candidate.findUnique({
    where: { id },
    include: {
      matches: {
        include: {
          job: {
            select: {
              id: true,
              title: true,
              requiredSkills: true,
              expectedYears: true,
            },
          },
        },
        orderBy: [
          { totalScore: "desc" },
          { jobId: "asc" },
        ],
      },
    },
  });

  if (!candidate) notFound();

  const bestMatch = candidate.matches[0];

  const initials = (candidate.name ?? "Candidate")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const experience =
    candidate.experience === null
      ? "Not available"
      : `${candidate.experience.toFixed(1)} years`;

  return (
    <div className="space-y-7">
      {/* BREADCRUMBS */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <Link
          href="/candidates"
          className="hover:text-indigo-600"
        >
          Talent directory
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">
          Candidate {candidate.id}
        </span>
      </nav>

      {/* PROFILE HERO */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-[#17243d] via-indigo-600 to-violet-400" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-semibold text-indigo-600">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
                  Talent Intelligence Profile
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                  ID {candidate.id}
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#17243d] sm:text-4xl">
                {candidate.name ?? "Unnamed Candidate"}
              </h1>

              <p className="mt-2 text-base text-slate-600">
                {candidate.designation ??
                  "Designation unavailable"}
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {candidate.company ?? "Company not provided"}
              </p>
            </div>

            <Link
              href="/candidates"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
            >
              ← Back to directory
            </Link>
          </div>

          {/* PROFILE METRICS */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: "Total experience",
                value: experience,
              },
              {
                label: "Extracted skills",
                value: String(candidate.skills.length),
              },
              {
                label: "AI evaluations",
                value: String(candidate.matches.length),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-100 bg-[#f8fafc] p-5"
              >
                <p className="text-xs text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-xl font-semibold tracking-tight text-slate-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TWO COLUMN WORKSPACE */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* MAIN CONTENT */}
        <div className="min-w-0 space-y-6">
          {/* SKILLS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Professional Capabilities
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                  Skills & expertise
                </h2>
              </div>

              <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                {candidate.skills.length} skills
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Skills extracted from the candidate&apos;s
              supplied CV.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {candidate.skills.length > 0 ? (
                candidate.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-lg border border-slate-200 bg-[#f8fafc] px-3 py-2 text-xs font-medium leading-5 text-slate-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  No skills were extracted from this CV.
                </p>
              )}
            </div>
          </section>

          {/* JOB ALIGNMENT */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  AI Evaluation History
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                  Job alignment
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Saved evaluations ordered by strongest fit.
                </p>
              </div>

              <span className="text-xs text-slate-400">
                {candidate.matches.length} evaluated roles
              </span>
            </div>

            {candidate.matches.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                No AI evaluations are available yet.
              </div>
            ) : (
              <div className="space-y-4">
                {candidate.matches.map((match, index) => {
                  const scoreColor =
                    match.totalScore >= 80
                      ? "text-emerald-700"
                      : match.totalScore >= 60
                        ? "text-amber-700"
                        : "text-slate-700";

                  return (
                    <article
                      key={match.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                              Match #{index + 1}
                              {" · "}
                              Job {match.jobId}
                            </p>

                            <h3 className="mt-2 text-lg font-semibold text-slate-900">
                              {match.job.title}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {match.job.requiredSkills.length} required skills
                              {" · "}
                              {match.job.expectedYears === null
                                ? "Experience unspecified"
                                : `${match.job.expectedYears} years expected`}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-2xl font-semibold tabular-nums ${scoreColor}`}
                            >
                              {match.totalScore.toFixed(1)}%
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              Overall alignment
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-5 sm:grid-cols-3">
                          <ScoreBar
                            label="Skills"
                            score={match.skillsScore}
                            max={50}
                          />
                          <ScoreBar
                            label="Experience"
                            score={match.experienceScore}
                            max={30}
                          />
                          <ScoreBar
                            label="Designation"
                            score={match.designationScore}
                            max={20}
                          />
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                          <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                            {match.matchedSkills.length} matched skills
                          </span>

                          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                            {match.missingSkills.length} missing skills
                          </span>
                        </div>

                        <details className="mt-5 rounded-xl border border-slate-200">
                          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-700">
                            View AI explanation and skill evidence
                          </summary>

                          <div className="space-y-5 border-t border-slate-100 p-4">
                            <p className="text-sm leading-7 text-slate-600">
                              {match.reason ??
                                "No AI explanation available."}
                            </p>

                            <div>
                              <h4 className="mb-2 text-xs font-semibold text-emerald-700">
                                Matched skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {match.matchedSkills.length ? (
                                  match.matchedSkills.map(
                                    (skill, skillIndex) => (
                                      <span
                                        key={`${skill}-${skillIndex}`}
                                        className="rounded-md bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )
                                ) : (
                                  <p className="text-xs text-slate-400">
                                    None identified
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="mb-2 text-xs font-semibold text-amber-700">
                                Missing skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {match.missingSkills.length ? (
                                  match.missingSkills.map(
                                    (skill, skillIndex) => (
                                      <span
                                        key={`${skill}-${skillIndex}`}
                                        className="rounded-md bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700"
                                      >
                                        {skill}
                                      </span>
                                    )
                                  )
                                ) : (
                                  <p className="text-xs text-slate-400">
                                    None identified
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </details>

                        <Link
                          href={`/jobs/${match.jobId}`}
                          className="mt-5 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Open job intelligence ↗
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* ORIGINAL CV */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 p-6 sm:p-7">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
                  Source Document
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                  Original CV
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Full text from the imported candidate record.
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                Text format
              </span>
            </div>

            <details className="group border-t border-slate-100">
              <summary className="cursor-pointer px-6 py-4 text-sm font-semibold text-indigo-600 hover:bg-slate-50 sm:px-7">
                View original CV content
              </summary>

              <div className="border-t border-slate-100 bg-[#f8fafc] p-5 sm:p-7">
                <pre className="max-h-[700px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-5 font-mono text-xs leading-6 text-slate-700">
                  {candidate.rawCV}
                </pre>
              </div>
            </details>
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="min-w-0 space-y-5 xl:sticky xl:top-24">
          {/* BEST MATCH */}
          <div className="rounded-2xl bg-[#17243d] p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-300">
              Strongest Saved Match
            </p>

            {bestMatch ? (
              <>
                <p className="mt-5 text-5xl font-semibold tracking-[-0.06em]">
                  {bestMatch.totalScore.toFixed(1)}
                  <span className="text-xl text-slate-400">%</span>
                </p>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, bestMatch.totalScore)
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-6 text-sm font-semibold">
                  {bestMatch.job.title}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Job ID {bestMatch.jobId}
                </p>

                <Link
                  href={`/jobs/${bestMatch.jobId}`}
                  className="mt-6 inline-flex rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#17243d] hover:bg-indigo-50"
                >
                  Inspect evaluation ↗
                </Link>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-300">
                No matching evaluations available.
              </p>
            )}
          </div>

          {/* CONTACT */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Contact information
            </h2>

            <div className="mt-5 space-y-5">
              <div>
                <p className="text-xs text-slate-400">
                  Email address
                </p>

                <p className="mt-1 break-all text-sm text-slate-700">
                  {candidate.email || "Not provided"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-400">
                  Phone number
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {candidate.phone || "Not provided"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs text-slate-400">
                  Current / most recent company
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {candidate.company || "Not available"}
                </p>
              </div>
            </div>
          </div>

          {/* METHODOLOGY */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              How matching works
            </h2>

            <p className="mt-3 text-xs leading-6 text-slate-500">
              Each saved evaluation uses three weighted
              factors to produce a score out of 100.
            </p>

            <div className="mt-5 space-y-3">
              {[
                ["Skills alignment", "50 points"],
                ["Experience", "30 points"],
                ["Designation relevance", "20 points"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="text-slate-500">
                    {label}
                  </span>

                  <span className="font-semibold text-slate-800">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">
              AI scores provide decision support, not
              confirmation of hiring suitability.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
