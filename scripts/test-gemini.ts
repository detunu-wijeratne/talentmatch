
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is missing");
}

const ai = new GoogleGenAI({ apiKey });

const MODEL = "gemini-3.5-flash-lite";

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Testing Gemini (attempt ${attempt}/3)...`);

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: "Say hello from TalentMatch in one sentence.",
      });

      console.log("\nSUCCESS!");
      console.log(response.text);
      return;

    } catch (error: unknown) {
      const status =
        typeof error === "object" && error !== null &&
        "status" in error
          ? (error as { status?: number }).status
          : undefined;

      console.error(`Attempt ${attempt} failed:`, status ?? error);

      if (status !== 503 || attempt === 3) {
        throw error;
      }

      const delay = 2000 * 2 ** (attempt - 1);
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await sleep(delay);
    }
  }
}

main().catch(error => {
  console.error("Gemini test failed:", error);
  process.exitCode = 1;
});
