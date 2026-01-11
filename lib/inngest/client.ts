import "server-only";
import { Inngest } from "inngest";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not set. Inngest AI functions will not work.");
}

export const inngestClient = new Inngest({
  id: "stockz",
});