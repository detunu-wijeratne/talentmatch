
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function extractPhone(text: string): string | null {
  const header = text.split(/\r?\n/).slice(0, 12).join("\n");

  // Find international phone numbers starting with +.
  const matches = header.match(/\+\d[\d ()-]{7,25}/g) ?? [];

  for (const value of matches) {
    const phone = value.trim();
    const digits = phone.replace(/\D/g, "");

    if (digits.length >= 8 && digits.length <= 15) {
      return phone;
    }
  }

  return null;
}

async function main() {
  const candidates = await prisma.candidate.findMany({
    where: {
      OR: [
        { phone: null },
        { phone: "" },
      ],
    },
  });

  console.log(`Found ${candidates.length} missing phone numbers`);

  let fixed = 0;

  for (const candidate of candidates) {
    const filePath = path.join(
      process.cwd(),
      "data",
      "corpus",
      candidate.id
    );

    const cv = await fs.readFile(filePath, "utf8");
    const phone = extractPhone(cv);

    if (!phone) {
      console.log(`${candidate.id}: Phone not found`);
      continue;
    }

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: { phone },
    });

    console.log(`${candidate.id}: Phone updated`);
    fixed++;
  }

  console.log(`\nFixed ${fixed} phone numbers`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
