
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

function Score({
  value,
}: {
  value: number | null | undefined;
}) {
  if (value == null) {
    return <span className="text-slate-400">Not evaluated</span>;
  }

  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 60
        ? "bg-amber-500"
        : "bg-slate-400";

  return (
    <div className="flex min-w-[110px] items-center gap-3">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${color}`}
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
          }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-800">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}

export default async function JobsPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const sort = params.sort === "score" ? "score" : "title";

  const [jobs, totalJobs, totalCandidates, totalMatches] =
    await Promise.all([
      prisma.job.findMany({
        where: query
          ? {
              OR: [
                {
                  title: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                { id: { contains: query } },
              ],
            }
          : undefined,
        include: {
          _count: { select: { matches: true } },
          matches: {
            take: 1,
            orderBy: [
              { totalScore: "desc" },
              { candidateId: "asc" },
            ],
            include: {
              candidate: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { title: "asc" },
      }),
      prisma.job.count(),
      prisma.candidate.count(),
      prisma.match.count(),
    ]);

  const sortedJobs = [...jobs].sort((a, b) => {
    if (sort === "score") {
      const difference =
        (b.matches[0]?.totalScore ?? -1) -
        (a.matches[0]?.totalScore ?? -1);

      if (difference !== 0) return difference;
    }
    return a.title.localeCompare(b.title);
  });

  const evaluatedJobs = await prisma.job.count({
    where: { matches: { some: {} } },
  });

  return (
    <div className="space-y-9">
      {/* PAGE HEADING */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-slate-700">
              Opportunities
            </span>
          </div>

          <h1 className="mt-4 text-[32px] font-semibold tracking-[-0.045em] text-[#17243d] sm:text-[40px]">
            Job intelligence
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            A clearer view of every role and its strongest
            matching talent.
          </p>
        </div>

        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 rounded-xl bg-[#17243d] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#293a58]"
        >
          Explore talent
          <span aria-hidden="true">↗</span>
        </Link>
      </div>

      {/* METRICS */}
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Open positions",
            value: totalJobs,
            info: "Roles in the workspace",
          },
          {
            label: "Talent pool",
            value: totalCandidates,
            info: "Imported candidate profiles",
          },
          {
            label: "AI evaluations",
            value: totalMatches,
            info: "Saved matching decisions",
          },
          {
            label: "Roles evaluated",
            value: `${evaluatedJobs}/${totalJobs}`,
            info: "With candidate rankings",
          },
        ].map((metric, index) => (
          <div
            key={metric.label}
            className={`p-6 ${
              index !== 0
                ? "border-t border-slate-100 sm:border-t-0 sm:border-l"
                : ""
            }`}
          >
            <p className="text-xs font-medium text-slate-500">
              {metric.label}
            </p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {metric.value}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {metric.info}
            </p>
          </div>
        ))}
      </div>

      {/* SCORING EXPLANATION */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#f0f3f9] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17243d] text-white">
            <span className="text-lg">✳</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Explainable AI matching
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Scores combine three evaluation dimensions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["Skills", "50%"],
            ["Experience", "30%"],
            ["Role relevance", "20%"],
          ].map(([label, weight]) => (
            <span
              key={label}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
            >
              <strong className="mr-1 text-slate-900">
                {weight}
              </strong>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* DIRECTORY */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              All opportunities
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {sortedJobs.length} of {totalJobs} positions
            </p>
          </div>

          <form
            method="get"
            className="flex w-full flex-wrap gap-2 sm:w-auto"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 sm:min-w-[210px]">
              <svg
                width="17"
                height="17"
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
                name="q"
                defaultValue={query}
                type="search"
                aria-label="Search positions"
                placeholder="Search positions..."
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
              />
            </div>

            <select
              name="sort"
              defaultValue={sort}
              aria-label="Sort positions"
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none"
            >
              <option value="title">Job title</option>
              <option value="score">Top match</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-[#17243d] px-4 py-3 text-sm font-medium text-white hover:bg-[#293a58]"
            >
              Apply
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-[#f8fafc]">
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-[0.09em] text-slate-400">
                  <th className="px-6 py-4">Position</th>
                  <th className="px-4 py-4">Requirements</th>
                  <th className="px-4 py-4">Evaluated</th>
                  <th className="px-4 py-4">Leading candidate</th>
                  <th className="px-4 py-4">Top fit</th>
                  <th className="px-6 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedJobs.map((job) => {
                  const topMatch = job.matches[0];
                  const topCandidate = topMatch?.candidate;

                  return (
                    <tr
                      key={job.id}
                      className="transition hover:bg-indigo-50/40"
                    >
                      <td className="px-6 py-5">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="group block"
                        >
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                            {job.title}
                          </p>
                          <p className="mt-1.5 text-xs text-slate-400">
                            ID {job.id}
                          </p>
                        </Link>
                      </td>

                      <td className="px-4 py-5">
                        <p className="text-sm text-slate-700">
                          {job.requiredSkills.length} skills
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {job.expectedYears === null
                            ? "Experience unspecified"
                            : `${job.expectedYears} years expected`}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {job._count.matches} profiles
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        {topCandidate ? (
                          <Link
                            href={`/candidates/${topCandidate.id}`}
                            className="text-sm font-medium text-slate-700 hover:text-indigo-600"
                          >
                            {topCandidate.name ??
                              `Candidate ${topCandidate.id}`}
                          </Link>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Not evaluated
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-5">
                        <Score value={topMatch?.totalScore} />
                      </td>

                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Inspect
                          <span aria-hidden="true">↗</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}

                {sortedJobs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center"
                    >
                      <p className="font-medium text-slate-800">
                        No positions found
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Try a different title or job ID.
                      </p>
                      <Link
                        href="/jobs"
                        className="mt-3 inline-block text-sm font-semibold text-indigo-600"
                      >
                        Clear search
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-6 py-4">
            <p className="text-xs text-slate-400">
              Based on saved candidate-job evaluations
            </p>
            <p className="text-xs font-medium text-slate-500">
              50 skills · 30 experience · 20 designation
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
