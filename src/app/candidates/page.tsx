
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ search?: string }>;
};

export default async function CandidatesPage({
  searchParams,
}: Props) {
  const { search } = await searchParams;
  const query = (search ?? "").trim().slice(0, 100);

  const candidates = await prisma.candidate.findMany({
    where: query
      ? {
          OR: [
            { id: { contains: query } },
            { name: { contains: query, mode: "insensitive" } },
            { designation: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      matches: {
        orderBy: { totalScore: "desc" },
        take: 1,
        include: {
          job: {
            select: { id: true, title: true },
          },
        },
      },
      _count: {
        select: { matches: true },
      },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });

  const totalCandidates = await prisma.candidate.count();

  const matchingCandidates = await prisma.candidate.count({
    where: { matches: { some: {} } },
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-indigo-600">
          TALENT DATABASE
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Candidates
        </h1>
        <p className="mt-2 text-slate-500">
          Explore candidate profiles and discover their best
          AI-matched opportunities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Candidates", value: totalCandidates },
          { label: "Candidates With Matches", value: matchingCandidates },
          { label: "Search Results", value: candidates.length },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
          </div>
        ))}
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          type="search"
          name="search"
          defaultValue={query}
          placeholder="Search by name, role, company or ID..."
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Search
        </button>
        <Link
          href="/candidates"
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Clear
        </Link>
      </form>

      {candidates.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold">
            No candidates found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Try a different name, designation, company or ID.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {candidates.map((candidate) => {
            const bestMatch = candidate.matches[0];

            const initials = (candidate.name ?? "Candidate")
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((word) => word[0])
              .join("")
              .toUpperCase();

            return (
              <Link
                key={candidate.id}
                href={`/candidates/${candidate.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-600">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-lg font-semibold group-hover:text-indigo-600">
                      {candidate.name ?? "Unnamed Candidate"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {candidate.designation ?? "Designation unavailable"}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-400">
                      ID: {candidate.id}
                    </p>
                  </div>

                  {bestMatch && (
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-bold text-indigo-600">
                        {bestMatch.totalScore.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-500">
                        Best match
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Experience
                    </p>
                    <p className="mt-1 font-semibold">
                      {candidate.experience === null
                        ? "Not available"
                        : `${candidate.experience} years`}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      AI Evaluations
                    </p>
                    <p className="mt-1 font-semibold">
                      {candidate._count.matches}
                    </p>
                  </div>
                </div>

                <p className="mt-4 truncate text-sm text-slate-500">
                  {candidate.company ?? "Company not available"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {candidate.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="max-w-full truncate rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 3 && (
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs text-indigo-600">
                      +{candidate.skills.length - 3} more
                    </span>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  {bestMatch ? (
                    <p className="text-sm text-slate-600">
                      Best job:{" "}
                      <span className="font-semibold text-indigo-600">
                        {bestMatch.job.title}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">
                      Not yet evaluated by AI
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
