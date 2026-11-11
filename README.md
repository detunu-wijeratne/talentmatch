
# TalentMatch — AI-Powered Candidate Matching Platform

TalentMatch is a full-stack recruitment application that uses AI to evaluate and rank candidates against job descriptions.

The system processes candidate CVs, extracts structured profile information, analyzes job requirements, and generates explainable matching scores.

## Tech Stack

- Frontend: Next.js 16, React, TypeScript, Tailwind CSS
- Backend: Next.js App Router and Node.js
- Database: PostgreSQL (Neon)
- ORM: Prisma 7
- AI: Google Gemini via @google/genai
- Deployment: Vercel (deployment pending)

## Features

### Job Management
- Browse all 10 imported job descriptions.
- View job requirements and required skills.
- View ranked candidates for each job.
- Filter matching results using a minimum score.
- Review matching explanations and score breakdowns.

### Candidate Management
- Browse 40 imported candidate profiles.
- Search candidates by name, designation, company, or ID.
- View candidate skills, experience, and employment details.
- View original CV text in the local application.
- View each candidate's evaluated job matches.

### AI Matching
- Evaluate candidate skills against job requirements.
- Recognize relevant transferable and semantically equivalent skills.
- Compare total employment experience with expected experience.
- Assess the relevance of the candidate's designation.
- Generate explanations and matched/missing skill lists.
- Store evaluation results in PostgreSQL.
- Export the top 10 candidates per job as CSV.

## Dataset

The provided dataset contains:

- 472 candidate CVs in the corpus directory.
- 10 job descriptions in the queries directory.

Following the assignment's permitted subset approach, 40 candidate CVs were selected and imported into the database.

The selection process used a preliminary relevance shortlist based on job titles and skill-related terms. Candidates were selected across different job categories to provide relevant and contrasting examples.

The selected candidate IDs are listed in `results/selected-candidates.json` in the local working environment. The final list of all 40 IDs should be copied into this README before submission if that private file is excluded from Git.

Source CVs and job-description files are not included in the public repository.

## Matching Methodology

Each job-candidate pair receives a score from 0 to 100.

| Component | Maximum Score |
|-----------|---------------|
| Skills Match | 50 |
| Experience Match | 30 |
| Designation Relevance | 20 |
| Total | 100 |

### 1. Skills Score (50 Points)

The system compares the job's required skills with skills supported by the candidate CV.

Gemini identifies semantically related skills and returns matched and missing skill lists.

The skills component uses the proportion of matched required skills:

Skills Score = (Matched Required Skills / Total Required Skills) × 50

### 2. Experience Score (30 Points)

The system extracts the candidate's total employment experience and compares it against the expected experience level inferred from the job description.

Overlapping employment periods are intended to be counted only once.

The current calculation uses total employment experience, rather than exclusively domain-specific experience.

### 3. Designation Relevance (20 Points)

Gemini assesses how closely the candidate's most recent designation relates to the job title and responsibilities.

### Final Score

Total Score = Skills Score + Experience Score + Designation Score

The evaluation also stores:
- Matched skills
- Missing skills
- Component scores
- Overall score
- Natural-language explanation

## Matching Limitations

A high match score does not guarantee that the candidate meets every specialized job requirement.

For example, an English teacher may demonstrate many transferable teaching skills without having documented IELTS preparation experience.

The system records IELTS-specific skills as missing when the CV does not support them.

The current experience component can also give substantial credit for employment experience outside the target profession.

Matching results should therefore be interpreted as decision-support recommendations, not definitive hiring decisions.

## Data Models

### Job
Stores job ID, title, full description, required skills, and expected years of experience.

### Candidate
Stores candidate ID, name, email, phone, designation, company, experience, extracted skills, and original CV text.

### Match
Stores the job-candidate relationship, three component scores, total score, matched skills, missing skills, and explanation.

## Local Setup

### Prerequisites

- Node.js and npm
- PostgreSQL database (Neon recommended)
- Google Gemini API key

### Installation

Clone the repository and install dependencies:

```bash
git clone <YOUR_REPOSITORY_URL>
cd talentmatch
npm install
```

Create a `.env` file using `.env.example` and provide the required credentials.

Generate the Prisma client:

```bash
npx prisma generate --config prisma7.config.ts
```

Apply existing database migrations:

```bash
npx prisma migrate deploy --config prisma7.config.ts
```

Start the application:

```bash
npm run dev
```

Open http://localhost:3000.

## Data Import and Matching Scripts

The following scripts operate on the provided dataset and require the source files to be available locally.

Import job descriptions:

```bash
npx tsx scripts/import-jobs.ts
```

Select candidate CVs:

```bash
npx tsx scripts/select-candidates.ts
```

Import selected candidate profiles:

```bash
npx tsx scripts/import-candidates.ts
```

Run AI matching:

```bash
npx tsx scripts/run-matching.ts
```

Evaluate a specific job with a limited number of candidates:

```bash
npx tsx scripts/run-matching.ts --job=44719 --limit=10
```

Previously saved matches are skipped by the current matching workflow.

Audit saved matching results:

```bash
npx tsx scripts/audit-matches.ts
```

Export the top 10 candidates per job:

```bash
npx tsx scripts/export-top10.ts
```

## CSV Submission

The final ranking file is:

`results/top10.csv`

It contains 100 data rows: 10 ranked candidates for each of the 10 jobs.

Columns:

- job_id
- rank
- candidate_id
- total_score
- skills_score
- experience_score
- designation_score
- reason

Rankings are ordered by descending total score, with candidate ID used to break ties.

## Routes

| Route | Description |
|-------|-------------|
| `/jobs` | Job dashboard |
| `/jobs/[id]` | Job details and candidate rankings |
| `/candidates` | Candidate directory and search |
| `/candidates/[id]` | Candidate profile and saved matches |

## Privacy and Security

The source dataset and environment credentials are excluded from Git.

Candidate contact information and original CVs are intended for authorized evaluation use only.

The current interface does not implement authentication. Public deployment must restrict personal data access or use anonymized demonstration data.

## Project Status

- Database and data import: Complete
- AI matching and score storage: Complete
- Jobs and Candidates interfaces: Complete
- CSV export: Complete
- Matching audit: Completed; flagged results require interpretation
- Deployment: Pending

## Notes

The application provides AI-assisted candidate ranking, not an automated hiring decision.

AI outputs may contain errors and should be checked against the original CVs.
