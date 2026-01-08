import { Inngest } from "inngest";

export const inngestClient = new Inngest({
  id: "stockz",
  ai: { gemini : { apiKey: process.env.GEMINI_API_KEY!}}
});