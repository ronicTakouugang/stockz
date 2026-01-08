import { inngestClient } from "@/lib/inngest/client"
import { PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompt";
import {sendWelcomeEmail} from "@/lib/nodemailer";

export const sendSignUpEmail = inngestClient.createFunction(
    { id: "sign-up-email" },
    { event: "app/user.created" },
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoal}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `
        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace("{{userProfile}}", userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash-lite' }),
            body: {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining Stockz';

            const {data : {email, name}} = event;
            return await sendWelcomeEmail({
                email, name, intro:introText
            })
        })

        return {
            success: true,
            message: "Welcome email sent successfully"
        }
    }
)

export const sendDailyNewSummary = inngestClient.createFunction(
    {id: "daily-news-summary"},
    [{event: "app/send.daily.news"}, {cron: "0 12 * * *"}],
    async ({step}) => {
        // Step #1 Get all users fir news delivery
        // Step #2 Fetch personalized news to each user
        // Step #3 Summarize news bia API for each user
        // Step #4 Send news summary to each user
    }
)