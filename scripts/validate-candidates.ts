
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
  const candidates = await prisma.candidate.findMany({
    orderBy: { id: "asc" },
  });

  const jobs = await prisma.job.findMany();

  console.log("\n=== TALENTMATCH DATA VALIDATION ===");
  console.log(`Candidates: ${candidates.length}`);
  console.log(`Jobs: ${jobs.length}\n`);

  let issueCount = 0;

  for (const candidate of candidates) {
    const issues: string[] = [];

    if (!candidate.name?.trim()) {
      issues.push("Missing name");
    }

    if (!candidate.email?.trim()) {
      issues.push("Missing email");
    }

    if (!candidate.phone?.trim()) {
      issues.push("Missing phone - verify original CV");
    }

    if (!candidate.designation?.trim()) {
      issues.push("Missing current designation");
    }

    if (!candidate.company?.trim()) {
      issues.push("Missing current company");
    }

    if (candidate.experience === null) {
      issues.push("Experience could not be calculated");
    } else if (
      candidate.experience < 0 ||
      candidate.experience > 40
    ) {
      issues.push("Suspicious experience value");
    }

    if (candidate.skills.length === 0) {
      issues.push("No skills extracted");
    }

    if (!candidate.rawCV.trim()) {
      issues.push("Missing raw CV");
    }

    if (
      candidate.designation &&
      !candidate.rawCV.toLowerCase().includes(
        candidate.designation.toLowerCase()
      )
    ) {
      issues.push("Designation not found in original CV");
    }

    if (issues.length > 0) {
      issueCount += issues.length;

      console.log(`Candidate ${candidate.id}:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(`Candidates checked: ${candidates.length}`);
  console.log(`Jobs checked: ${jobs.length}`);
  console.log(`Potential issues: ${issueCount}`);

  if (candidates.length !== 40) {
    console.log("WARNING: Expected 40 candidates");
  }

  if (jobs.length !== 10) {
    console.log("WARNING: Expected 10 jobs");
  }

  console.log("\nValidation finished.");
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
