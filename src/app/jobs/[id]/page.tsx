
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MatchWorkspace, {
  type CandidateMatch,
} from "./MatchWorkspace";

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

  const requestedScore = Number(minScore ?? "0");
  const minimumScore = Number.isFinite(requestedScore)
    ? Math.max(0, Math.min(100, requestedScore))
    : 0;

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      matches: {
        where: {
          totalScore: { gte: minimumScore },
        },
        include: {
          candidate: true,
        },
        orderBy: [
          { totalScore: "desc" },
          { candidateId: "asc" },
        ],
      },
    },
  });

  if (!job) notFound();

  const matches: CandidateMatch[] = job.matches.map(
    (match) => ({
      id: match.id,
      candidateId: match.candidateId,
      name: match.candidate.name,
      designation: match.candidate.designation,
      company: match.candidate.company,
      experience: match.candidate.experience,
      totalScore: match.totalScore,
      skillsScore: match.skillsScore,
      experienceScore: match.experienceScore,
      designationScore: match.designationScore,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      reason: match.reason,
    })
  );

  const maxScore = matches[0]?.totalScore;

  return (
    <div className="space-y-7">
      {/* BREADCRUMBS */}
      <nav className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          href="/jobs"
          className="transition hover:text-indigo-600"
        >
          Opportunities
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">
          Job {job.id}
        </span>
      </nav>

      {/* JOB OVERVIEW */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
                  Job Intelligence
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  Evaluated
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-[#17243d] sm:text-3xl">
                {job.title}
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                Job ID: {job.id} ·{" "}
                {job.requiredSkills.length} required skills ·{" "}
                {job.expectedYears === null
                  ? "Experience unspecified"
                  : `${job.expectedYears} years expected`}
              </p>
            </div>

            <Link
              href="/jobs"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              ← All jobs
            </Link>
          </div>

          {/* REQUIRED SKILLS */}
          <div className="mt-7 border-t border-slate-100 pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Role requirements
              </h2>
              <span className="text-xs text-slate-400">
                {job.requiredSkills.length} skills
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-lg border border-slate-200 bg-[#f8fafc] px-3 py-1.5 text-xs text-slate-600"
                >
                  {skill}
                </span>
              ))}
            </div>

            <details className="group mt-6 rounded-xl border border-slate-200">
              <summary className="cursor-pointer px-4 py-3.5 text-sm font-medium text-slate-700">
                View complete job description
              </summary>
              <div className="border-t border-slate-100 px-4 py-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {job.description}
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* RANKING TITLE AND FILTER */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-indigo-600">
                AI Candidate Evaluation
              </span>
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Match intelligence
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {matches.length} candidate evaluations meet
              your filter
              {maxScore !== undefined &&
                ` · Top score ${maxScore.toFixed(1)}%`}
            </p>
          </div>

          <form
            method="get"
            className="flex items-end gap-2"
          >
            <div>
              <label
                htmlFor="minScore"
                className="mb-2 block text-xs font-medium text-slate-500"
              >
                Minimum match score
              </label>
              <select
                id="minScore"
                name="minScore"
                defaultValue={String(minimumScore)}
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none focus:border-indigo-500"
              >
                {[0, 30, 50, 60, 70, 80, 90, 100].map(
                  (score) => (
                    <option key={score} value={score}>
                      {score}+
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="submit"
              className="h-11 rounded-xl bg-[#17243d] px-5 text-sm font-semibold text-white transition hover:bg-[#293a58]"
            >
              Apply
            </button>
          </form>
        </div>

        <MatchWorkspace
          key={`${job.id}-${minimumScore}`}
          matches={matches}
        />
      </section>
    </div>
  );
}
