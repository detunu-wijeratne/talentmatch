
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is missing");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

const root = process.cwd();

const monthNames =
  "January|February|March|April|May|June|July|August|September|October|November|December|" +
  "Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec";

const datePart = `(?:(${monthNames})\\s+)?(\\d{4})`;
const datePattern = new RegExp(
  `${datePart}\\s*[-–—]\\s*(?:${datePart}|(Present|Current|Now))`,
  "gi"
);

const headings = new Set([
  "EDUCATION", "CERTIFICATIONS", "PROFESSIONAL CERTIFICATIONS",
  "LANGUAGES", "OTHER INFORMATION", "PROJECTS",
  "ACHIEVEMENTS", "AWARDS", "REFERENCES",
  "PROFESSIONAL EXPERIENCE", "WORK EXPERIENCE",
  "EMPLOYMENT HISTORY", "EXPERIENCE",
  "PROFESSIONAL SUMMARY", "SUMMARY",
]);

function getEmail(text: string): string | null {
  return text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
  )?.[0] ?? null;
}

function getPhone(text: string): string | null {
  const header = text.split(/\r?\n/).slice(0, 8).join(" ");
  const match = header.match(
    /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?){2,5}\d{3,4}/
  );

  return match?.[0]?.trim() ?? null;
}

function getWorkSection(text: string): string {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line =>
    /^(PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY|EXPERIENCE)$/i
      .test(line.trim())
  );

  if (start < 0) return "";

  const end = lines.findIndex(
    (line, index) =>
      index > start && headings.has(line.trim().toUpperCase()) &&
      !/^(PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY|EXPERIENCE)$/i
        .test(line.trim())
  );

  return lines.slice(start + 1, end < 0 ? undefined : end).join("\n");
}

function getCurrentRole(workSection: string) {
  const lines = workSection.split(/\r?\n/)
    .map(line => line.trim());

  // Find the first work-history date range.
  const firstDateIndex = lines.findIndex(line => {
    datePattern.lastIndex = 0;
    return datePattern.test(line);
  });

  if (firstDateIndex < 0) {
    return { designation: null, company: null };
  }

  const preceding = lines
    .slice(0, firstDateIndex)
    .filter(line => line && line !== "---" &&
      !/^[-*•]/.test(line));

  return {
    designation: preceding[0] ?? null,
    company: preceding[1] ?? null,
  };
}

function getSkills(text: string): string[] {
  const lines = text.split(/\r?\n/);

  const start = lines.findIndex(line =>
    /^(TECHNICAL SKILLS|PROFESSIONAL SKILLS|CORE SKILLS|SKILLS)$/i
      .test(line.trim())
  );

  if (start < 0) return [];

  const skills: string[] = [];

  for (const line of lines.slice(start + 1)) {
    const value = line.trim();

    if (!value || value === "---") continue;
    if (headings.has(value.toUpperCase())) break;

    // Stop at another uppercase section heading.
    if (
      /^[A-Z][A-Z\s/&-]{3,}$/.test(value) &&
      !value.includes("|")
    ) break;

    const cleaned = value.replace(/^[-*•]\s*/, "");
    const colon = cleaned.indexOf(":");

    const content = colon >= 0
      ? cleaned.slice(colon + 1)
      : cleaned;

    for (const skill of content.split(/\s*[|;,]\s*/)) {
      const trimmed = skill.trim();
      if (trimmed) skills.push(trimmed);
    }
  }

  return [...new Set(skills)];
}

const monthMap: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function toMonth(month: string | undefined, year: string) {
  return Number(year) * 12 +
    (month ? monthMap[month.slice(0, 3).toLowerCase()] : 0);
}

function calculateExperience(workSection: string): number | null {
  const months = new Set<number>();
  const today = new Date();
  const currentMonth =
    today.getFullYear() * 12 + today.getMonth();

  datePattern.lastIndex = 0;

  for (const match of workSection.matchAll(datePattern)) {
    const start = toMonth(match[1], match[2]);
    const end = match[5]
      ? currentMonth
      : toMonth(match[3], match[4]);

    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    if (end < start || end > currentMonth) continue;

    // Count overlapping employment months only once.
    for (let month = start; month <= end; month++) {
      months.add(month);
    }
  }

  if (months.size === 0) return null;

  return Math.round((months.size / 12) * 10) / 10;
}

async function main() {
  const ids: string[] = JSON.parse(
    await fs.readFile(
      path.join(root, "results", "selected-candidates.json"),
      "utf8"
    )
  );

  console.log(`Importing ${ids.length} selected CVs...\n`);

  for (const id of ids) {
    const rawCV = await fs.readFile(
      path.join(root, "data", "corpus", id),
      "utf8"
    );

    const name = rawCV.split(/\r?\n/)
      .find(line => line.trim())?.trim() ?? null;

    const workSection = getWorkSection(rawCV);
    const role = getCurrentRole(workSection);
    const skills = getSkills(rawCV);
    const experience = calculateExperience(workSection);

    const data = {
      name,
      email: getEmail(rawCV),
      phone: getPhone(rawCV),
      designation: role.designation,
      company: role.company,
      experience,
      skills,
      rawCV,
    };

    await prisma.candidate.upsert({
      where: { id },
      update: data,
      create: { id, ...data },
    });

    console.log(
      `${id} | ${name} | ${role.designation ?? "Unknown role"} | ` +
      `${experience ?? "Unknown"} years | ${skills.length} skills`
    );
  }

  console.log(
    `\nTotal candidates in database: ${await prisma.candidate.count()}`
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
