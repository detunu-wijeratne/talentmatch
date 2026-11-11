
"use client";

import Link from "next/link";
import { useState } from "react";

export type CandidateMatch = {
  id: string;
  candidateId: string;
  name: string | null;
  designation: string | null;
  company: string | null;
  experience: number | null;
  totalScore: number;
  skillsScore: number;
  experienceScore: number;
  designationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string | null;
};

function ScoreBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = Math.max(
    0,
    Math.min(100, (value / max) * 100)
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">
          {label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-slate-900">
          {value.toFixed(1)}
          <span className="font-normal text-slate-400">
            /{max}
          </span>
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MatchLabel({ score }: { score: number }) {
  const label =
    score >= 80
      ? "Strong alignment"
      : score >= 60
        ? "Moderate alignment"
        : "Limited alignment";

  const style =
    score >= 80
      ? "bg-emerald-50 text-emerald-700"
      : score >= 60
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

export default function MatchWorkspace({
  matches,
}: {
  matches: CandidateMatch[];
}) {
  const [selectedId, setSelectedId] = useState(
    matches[0]?.id ?? ""
  );

  const selected =
    matches.find((match) => match.id === selectedId) ??
    matches[0];

  if (!selected) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-slate-900">
          No candidates match this filter
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Lower the minimum score to see more evaluations.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
      {/* LEFT: CANDIDATE LEADERBOARD */}
      <div className="min-w-0 self-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">
              Candidate leaderboard
            </h3>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {matches.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Select a candidate to inspect their evaluation
          </p>
        </div>

        <div className="max-h-[780px] overflow-y-auto p-2">
          {matches.map((match, index) => {
            const active = selected.id === match.id;

            return (
              <button
                key={match.id}
                type="button"
                onClick={() => setSelectedId(match.id)}
                aria-pressed={active}
                className={`mb-1 w-full rounded-xl border p-3.5 text-left transition ${
                  active
                    ? "border-indigo-200 bg-indigo-50/80"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      active
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${
                        active
                          ? "text-indigo-700"
                          : "text-slate-800"
                      }`}
                    >
                      {match.name ??
                        `Candidate ${match.candidateId}`}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {match.designation ?? "Role unavailable"}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                    {match.totalScore.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-3 ml-12 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      match.totalScore >= 80
                        ? "bg-emerald-500"
                        : match.totalScore >= 60
                          ? "bg-amber-500"
                          : "bg-slate-400"
                    }`}
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, match.totalScore)
                      )}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: SELECTED EVALUATION */}
      <div className="min-w-0 space-y-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
                  Candidate Intelligence Report
                </p>

                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
                  {selected.name ??
                    `Candidate ${selected.candidateId}`}
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  {selected.designation ??
                    "Designation unavailable"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  ID: {selected.candidateId}
                  {selected.company
                    ? ` · ${selected.company}`
                    : ""}
                </p>
              </div>

              <Link
                href={`/candidates/${selected.candidateId}`}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                View profile ↗
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-[-0.06em] text-slate-900">
                    {selected.totalScore.toFixed(1)}
                  </span>
                  <span className="text-xl font-medium text-slate-400">
                    /100
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Overall match score
                </p>
              </div>

              <MatchLabel score={selected.totalScore} />
            </div>
          </div>

          {/* SCORE BREAKDOWN */}
          <div className="p-6 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">
                Match composition
              </h4>
              <span className="text-xs text-slate-400">
                Weighted evaluation
              </span>
            </div>

            <div className="space-y-6">
              <ScoreBar
                label="Skills alignment"
                value={selected.skillsScore}
                max={50}
              />
              <ScoreBar
                label="Experience"
                value={selected.experienceScore}
                max={30}
              />
              <ScoreBar
                label="Designation relevance"
                value={selected.designationScore}
                max={20}
              />
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f9fc] p-4">
              <div>
                <p className="text-xs text-slate-500">
                  Matched skills
                </p>
                <p className="mt-1 text-xl font-semibold text-emerald-700">
                  {selected.matchedSkills.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  Missing skills
                </p>
                <p className="mt-1 text-xl font-semibold text-amber-700">
                  {selected.missingSkills.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SKILL ALIGNMENT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">
              Skills evidence
            </h3>
            <span className="text-xs text-slate-400">
              Based on saved AI analysis
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-semibold text-emerald-700">
                Matched · {selected.matchedSkills.length}
              </p>

              <div className="flex flex-wrap gap-2">
                {selected.matchedSkills.length ? (
                  selected.matchedSkills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs leading-5 text-emerald-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">
                    No matched skills identified.
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold text-amber-700">
                Missing · {selected.missingSkills.length}
              </p>

              <div className="flex flex-wrap gap-2">
                {selected.missingSkills.length ? (
                  selected.missingSkills.map((skill, index) => (
                    <span
                      key={`${skill}-${index}`}
                      className="rounded-lg border border-amber-100 bg-amber-50 px-2.5 py-1.5 text-xs leading-5 text-amber-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">
                    No missing skills identified.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI EXPLANATION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              ✳
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                AI evaluation summary
              </h3>
              <p className="text-xs text-slate-400">
                Why this candidate received their score
              </p>
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-600">
            {selected.reason ??
              "No explanation was saved for this evaluation."}
          </p>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="text-xs leading-5 text-slate-400">
              AI-generated evaluation. Review original CV
              evidence before making hiring decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
