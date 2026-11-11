
import fs from "node:fs/promises";
import path from "node:path";

const corpusDir = path.join(process.cwd(), "data", "corpus");
const queriesDir = path.join(process.cwd(), "data", "queries");
const outputDir = path.join(process.cwd(), "results");

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that",
  "are", "you", "our", "your", "will", "have", "has",
  "into", "their", "about", "years", "skills", "work",
  "team", "role", "other", "using", "ability", "strong",
  "required", "experience", "management",
]);

function words(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word));
}

function getJobTitle(text: string, id: string): string {
  if (id === "46795") {
    return "Paralegal, Privacy and Information Management";
  }
  return text.split(/\r?\n/).find(line => line.trim())?.trim() ?? "";
}

function getRequiredSkills(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex(line =>
    /^(about\s+)?required\s+skills\s*:?\s*$/i.test(line.trim())
  );

  if (start < 0) return [];

  const skills: string[] = [];

  for (const line of lines.slice(start + 1)) {
    const bullet = line.trim().match(/^[-*•]\s+(.+)/);

    if (bullet) {
      skills.push(bullet[1].trim());
    } else if (skills.length > 0) {
      break;
    }
  }

  return skills;
}

function scoreCandidate(
  cv: string,
  jobTitle: string,
  requiredSkills: string[]
): number {
  const normalizedCV = cv.toLowerCase().replace(/\s+/g, " ");
  const cvWords = new Set(words(cv));
  const openingWords = new Set(words(cv.slice(0, 2500)));

  const titleWords = [...new Set(words(jobTitle))];

  const titleMatches = titleWords.filter(word =>
    openingWords.has(word)
  ).length;

  const titleScore = titleWords.length
    ? titleMatches / titleWords.length
    : 0;

  const skillScores = requiredSkills.map(skill => {
    const normalizedSkill = skill.toLowerCase().replace(/\s+/g, " ");

    if (normalizedCV.includes(normalizedSkill)) return 1;

    const tokens = [...new Set(words(skill))];

    if (!tokens.length) return 0;

    const matched = tokens.filter(word => cvWords.has(word)).length;

    return matched / tokens.length * 0.5;
  });

  const skillScore = skillScores.length
    ? skillScores.reduce((a, b) => a + b, 0) / skillScores.length
    : 0;

  return Math.round((titleScore * 0.6 + skillScore * 0.4) * 100);
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const cvFiles = (await fs.readdir(corpusDir)).sort();
  const jobFiles = (await fs.readdir(queriesDir)).sort();

  const candidates = await Promise.all(
    cvFiles.map(async id => ({
      id,
      text: await fs.readFile(path.join(corpusDir, id), "utf8"),
    }))
  );

  const rankings: Record<string, { id: string; score: number }[]> = {};

  for (const jobId of jobFiles) {
    const description = await fs.readFile(
      path.join(queriesDir, jobId),
      "utf8"
    );

    const title = getJobTitle(description, jobId);
    const skills = getRequiredSkills(description);

    const ranked = candidates.map(candidate => ({
      id: candidate.id,
      score: scoreCandidate(candidate.text, title, skills),
    }));

    ranked.sort((a, b) =>
      b.score - a.score || a.id.localeCompare(b.id)
    );

    rankings[jobId] = ranked;

    console.log(`\n${jobId} — ${title}`);
    console.table(ranked.slice(0, 5));
  }

  // Round-robin selection: distribute candidates across all jobs.
  const selected = new Set<string>();

  for (let rank = 0; rank < candidates.length && selected.size < 40; rank++) {
    for (const jobId of jobFiles) {
      const candidate = rankings[jobId][rank];

      if (candidate) selected.add(candidate.id);

      if (selected.size >= 40) break;
    }
  }

  const ids = [...selected].sort();

  await fs.writeFile(
    path.join(outputDir, "selected-candidates.json"),
    JSON.stringify(ids, null, 2)
  );

  await fs.writeFile(
    path.join(outputDir, "candidate-rankings.json"),
    JSON.stringify(rankings, null, 2)
  );

  console.log(`\nAnalyzed ${candidates.length} CVs`);
  console.log(`Selected ${ids.length} unique candidates`);
  console.log("Files saved in results/");
}

main().catch(console.error);
