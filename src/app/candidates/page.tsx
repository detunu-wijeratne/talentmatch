
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    evaluated?: string;
  }>;
};

function MatchScore({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="text-sm text-slate-400">
        Not evaluated
      </span>
    );
  }

  const barColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 60
        ? "bg-amber-500"
        : "bg-slate-400";

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{
            width: `${Math.max(0, Math.min(score, 100))}%`,
          }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {score.toFixed(1)}%
      </span>
    </div>
  );
}

export default async function CandidatesPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  // Support the old ?search= URL as well as the new ?q= URL.
  const query = (params.q ?? "").trim().slice(0, 100);
  const sort = ["name", "score", "experience"].includes(
    params.sort ?? ""
  )
    ? params.sort
    : "name";
  const onlyEvaluated = params.evaluated === "yes";

  const [allCandidates, totalCandidates, totalMatches] =
    await Promise.all([
      prisma.candidate.findMany({
        where: {
          ...(query
            ? {
                OR: [
                  {
                    id: { contains: query },
                  },
                  {
                    name: {
                      contains: query,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    designation: {
                      contains: query,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    company: {
                      contains: query,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              }
            : {}),
          ...(onlyEvaluated
            ? { matches: { some: {} } }
            : {}),
        },
        include: {
          matches: {
            orderBy: [
              { totalScore: "desc" },
              { jobId: "asc" },
            ],
            take: 1,
            include: {
              job: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          _count: {
            select: { matches: true },
          },
        },
      }),
      prisma.candidate.count(),
      prisma.match.count(),
    ]);

  const evaluatedCandidates = await prisma.candidate.count({
    where: { matches: { some: {} } },
  });

  const candidates = [...allCandidates].sort((a, b) => {
    if (sort === "score") {
      const difference =
        (b.matches[0]?.totalScore ?? -1) -
        (a.matches[0]?.totalScore ?? -1);

      if (difference !== 0) return difference;
    }

    if (sort === "experience") {
      const difference =
        (b.experience ?? -1) - (a.experience ?? -1);

      if (difference !== 0) return difference;
    }

    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="font-medium text-slate-700">
              Talent directory
            </span>
          </div>

          <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.045em] text-[#17243d] sm:text-[40px]">
            Talent directory
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Explore candidate experience, relevant skills,
            and AI-evaluated job opportunities.
          </p>
        </div>

        <Link
          href="/jobs"
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          View opportunities ↗
        </Link>
      </div>

      {/* METRICS */}
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-3">
        {[
          {
            label: "Talent profiles",
            value: totalCandidates,
            info: "Candidates imported",
          },
          {
            label: "Evaluated candidates",
            value: evaluatedCandidates,
            info: "With saved AI results",
          },
          {
            label: "AI evaluations",
            value: totalMatches,
            info: "Candidate-job comparisons",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="border-b border-slate-100 p-6 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
          >
            <p className="text-xs font-medium text-slate-500">
              {item.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {item.value}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {item.info}
            </p>
          </div>
        ))}
      </div>

      {/* DIRECTORY HEADER */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              All candidates
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Showing {candidates.length} of {totalCandidates} profiles
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Database connected
          </span>
        </div>

        {/* FILTERS */}
        <form
          method="get"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex min-w-[180px] flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-[#f8fafc] px-4">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              className="shrink-0 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search name, role, company or ID..."
              aria-label="Search candidates"
              className="w-full min-w-0 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <select
            name="sort"
            defaultValue={sort}
            aria-label="Sort candidates"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
          >
            <option value="name">Name A–Z</option>
            <option value="score">Highest match</option>
            <option value="experience">Most experience</option>
          </select>

          <select
            name="evaluated"
            defaultValue={onlyEvaluated ? "yes" : "all"}
            aria-label="Filter evaluations"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
          >
            <option value="all">All candidates</option>
            <option value="yes">Evaluated only</option>
          </select>

          <button
            type="submit"
            className="h-11 rounded-xl bg-[#17243d] px-5 text-sm font-semibold text-white transition hover:bg-[#293a58]"
          >
            Apply
          </button>

          <Link
            href="/candidates"
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm text-slate-500 hover:text-slate-800"
          >
            Reset
          </Link>
        </form>

        {/* CANDIDATE TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead className="border-b border-slate-200 bg-[#f8fafc]">
                <tr className="text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-4 py-4">Experience</th>
                  <th className="px-4 py-4">Skills</th>
                  <th className="px-4 py-4">Evaluations</th>
                  <th className="px-4 py-4">Best opportunity</th>
                  <th className="px-4 py-4">Top fit</th>
                  <th className="px-6 py-4 text-right">Profile</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {candidates.map((candidate) => {
                  const topMatch = candidate.matches[0];

                  const initials = (
                    candidate.name ?? "Candidate"
                  )
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={candidate.id}
                      className="transition hover:bg-[#f8faff]"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-600">
                            {initials}
                          </div>

                          <div className="min-w-[140px] max-w-[230px]">
                            <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                              {candidate.name ??
                                "Unnamed candidate"}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {candidate.designation ??
                                "Role unavailable"}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              ID {candidate.id}
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-sm font-medium text-slate-700">
                          {candidate.experience === null
                            ? "—"
                            : `${candidate.experience.toFixed(1)} yrs`}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                            {candidate.skills.length} skills
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {candidate._count.matches}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {topMatch ? (
                          <Link
                            href={`/jobs/${topMatch.jobId}`}
                            className="block max-w-[210px] truncate text-sm font-medium text-slate-600 hover:text-indigo-600"
                            title={topMatch.job.title}
                          >
                            {topMatch.job.title}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not evaluated
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <MatchScore
                          score={topMatch?.totalScore ?? null}
                        />
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/candidates/${candidate.id}`}
                          className="whitespace-nowrap text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Inspect ↗
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {candidates.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center"
                    >
                      <h3 className="text-base font-semibold text-slate-800">
                        No candidates found
                      </h3>
                      <p className="mt-2 text-sm text-slate-500">
                        Try a different search or filter.
                      </p>
                      <Link
                        href="/candidates"
                        className="mt-4 inline-block text-sm font-semibold text-indigo-600 hover:underline"
                      >
                        Clear filters
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
            <p className="text-xs text-slate-400">
              Showing {candidates.length} candidate records
            </p>
            <p className="text-xs text-slate-400">
              Scores represent each candidate&apos;s highest saved match
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
