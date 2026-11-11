
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const HEADERS = [
  "job_id",
  "rank",
  "candidate_id",
  "total_score",
  "skills_score",
  "experience_score",
  "designation_score",
  "reason",
];

function csvEscape(value: string | number | null): string {
  const text = String(value ?? "");

  // Protect against spreadsheet formula injection.
  const safe = /^[\s]*[=+\-@\t\r]/.test(text)
    ? "'" + text
    : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

function score(value: number): string {
  return value.toFixed(2);
}

async function main() {
  const jobs = await prisma.job.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      title: true,
      matches: {
        orderBy: [
          { totalScore: "desc" },
          { candidateId: "asc" },
        ],
        take: 10,
        select: {
          candidateId: true,
          totalScore: true,
          skillsScore: true,
          experienceScore: true,
          designationScore: true,
          reason: true,
        },
      },
    },
  });

  const rows: string[] = [HEADERS.join(",")];

  let totalMatches = 0;

  for (const job of jobs) {
    console.log(
      `${job.id} - ${job.title}: ${job.matches.length} matches`
    );

    if (job.matches.length < 10) {
      throw new Error(
        `Job ${job.id} has fewer than 10 saved matches. ` +
        "Complete matching before exporting."
      );
    }

    for (const [index, match] of job.matches.entries()) {
      const row = [
        job.id,
        index + 1,
        match.candidateId,
        score(match.totalScore),
        score(match.skillsScore),
        score(match.experienceScore),
        score(match.designationScore),
        match.reason ?? "",
      ];

      rows.push(row.map(csvEscape).join(","));
      totalMatches++;
    }
  }

  if (jobs.length !== 10 || totalMatches !== 100) {
    throw new Error(
      `Expected 10 jobs and 100 exported rows, ` +
      `got ${jobs.length} jobs and ${totalMatches} rows.`
    );
  }

  const outputDir = path.join(process.cwd(), "results");

  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "top10.csv");

  await fs.writeFile(
    outputPath,
    rows.join("\r\n") + "\r\n",
    "utf8"
  );

  console.log("\n=== EXPORT COMPLETE ===");
  console.log(`Jobs: ${jobs.length}`);
  console.log(`Candidate-job matches: ${totalMatches}`);
  console.log(`Saved to: ${outputPath}`);
}

main()
  .catch(error => {
    console.error("Export failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
