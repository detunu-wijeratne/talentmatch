
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const jobs = await prisma.job.findMany({
    include: {
      matches: {
        include: { candidate: true },
        orderBy: [
          { totalScore: "desc" },
          { candidateId: "asc" },
        ],
      },
    },
    orderBy: { id: "asc" },
  });

  console.log("\n=== TALENTMATCH MATCHING AUDIT ===\n");

  let total = 0;
  let perfect = 0;
  let reviewCount = 0;

  for (const job of jobs) {
    console.log(`\n${job.title} (${job.id})`);
    console.log("-".repeat(55));

    const top = job.matches.slice(0, 5);

    for (const match of top) {
      total++;

      const flags: string[] = [];
      const cv = match.candidate.rawCV.toLowerCase();

      if (match.totalScore === 100) {
        perfect++;
        flags.push("Perfect score: verify CV evidence");
      }

      if (
        match.experienceScore === 30 &&
        match.skillsScore === 0 &&
        match.designationScore === 0
      ) {
        flags.push("Full experience points despite unrelated role");
      }

      if (
        job.id === "35129" &&
        !cv.includes("ielts") &&
        match.totalScore >= 70
      ) {
        flags.push("High IELTS score without explicit IELTS evidence");
      }

      if (
        match.skillsScore < 0 ||
        match.skillsScore > 50 ||
        match.experienceScore < 0 ||
        match.experienceScore > 30 ||
        match.designationScore < 0 ||
        match.designationScore > 20
      ) {
        flags.push("Score outside permitted range");
      }

      const calculated =
        match.skillsScore +
        match.experienceScore +
        match.designationScore;

      if (Math.abs(calculated - match.totalScore) > 0.01) {
        flags.push("Total does not match factor scores");
      }

      if (
        match.matchedSkills.length +
        match.missingSkills.length !==
        job.requiredSkills.length
      ) {
        flags.push("Required-skill count mismatch");
      }

      console.log(
        `${match.candidateId.padEnd(7)} | ` +
        `${match.totalScore.toFixed(1).padStart(5)}/100 | ` +
        `${match.candidate.designation ?? "Unknown role"}`
      );

      console.log(
        `  Skills ${match.skillsScore.toFixed(1)}/50 | ` +
        `Experience ${match.experienceScore.toFixed(1)}/30 | ` +
        `Designation ${match.designationScore.toFixed(1)}/20`
      );

      console.log(
        `  Matched: ${match.matchedSkills.length}/` +
        `${job.requiredSkills.length}`
      );

      if (flags.length > 0) {
        reviewCount++;
        for (const flag of flags) {
          console.log(`  REVIEW: ${flag}`);
        }
      }
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Top-five matches inspected: ${total}`);
  console.log(`Perfect scores: ${perfect}`);
  console.log(`Records flagged for review: ${reviewCount}`);
  console.log("\nNo database records were changed.");
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
