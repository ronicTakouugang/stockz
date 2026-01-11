import { serve } from "inngest/next";
import { inngestClient } from "@/lib/inngest/client";
import * as inngestFunctions from "@/lib/inngest/function";

const functions = Object.values(inngestFunctions);

export const { GET, POST, PUT } = serve({
  client: inngestClient,
  functions,
});
