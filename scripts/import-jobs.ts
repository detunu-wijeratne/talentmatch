
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing from .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const jobsFolder = path.join(process.cwd(), "data", "queries");

function extractTitle(text: string, id: string): string {
  // Job 46795 has no separate title line.
  if (id === "46795") {
    const match = text.match(
      /We are seeking a (.+?) to join our team/i
    );
    return match?.[1]?.trim() ??
      "Paralegal, Privacy and Information Management";
  }

  return text.split(/\r?\n/).find(line => line.trim())?.trim() ?? "";
}

function extractSkills(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const headerIndex = lines.findIndex(line =>
    /^(about\s+)?required\s+skills\s*:?\s*$/i.test(line.trim())
  );

  if (headerIndex === -1) return [];

  const skills: string[] = [];

  for (const line of lines.slice(headerIndex + 1)) {
    const trimmed = line.trim();

    // Some jobs have an introductory sentence before the list.
    if (!trimmed && skills.length === 0) continue;

    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);

    if (bullet) {
      skills.push(bullet[1].trim());
    } else if (skills.length > 0) {
      break;
    }
  }

  return [...new Set(skills)];
}

async function main() {
  const files = (await fs.readdir(jobsFolder)).sort();

  console.log(`Found ${files.length} job files`);

  for (const id of files) {
    const fullPath = path.join(jobsFolder, id);
    const description = await fs.readFile(fullPath, "utf8");

    const title = extractTitle(description, id);
    const requiredSkills = extractSkills(description);

    if (!title || requiredSkills.length === 0) {
      throw new Error(`Could not extract job details for ${id}`);
    }

    await prisma.job.upsert({
      where: { id },
      update: {
        title,
        description,
        requiredSkills,
      },
      create: {
        id,
        title,
        description,
        requiredSkills,
      },
    });

    console.log(
      `Imported ${id}: ${title} (${requiredSkills.length} skills)`
    );
  }

  console.log(
    `Import complete. Total jobs: ${await prisma.job.count()}`
  );
}

main()
  .catch(error => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
