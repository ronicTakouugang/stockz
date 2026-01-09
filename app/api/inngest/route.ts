import {serve} from "inngest/next";
import {inngestClient} from "@/lib/inngest/client";
import {sendDailyNewsSummary, sendSignUpEmail} from "@/lib/inngest/function";

export const { GET, POST, PUT } = serve({
    client: inngestClient,
    functions: [sendSignUpEmail, sendDailyNewsSummary],
})