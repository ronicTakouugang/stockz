import {inngestClient} from "@/lib/inngest/client";
import {NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT} from "@/lib/inngest/prompt";
import {sendNewsSummaryEmail, sendWelcomeEmail} from "@/lib/nodemailer";
import {getAllUsersForNewsEmail} from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

export const sendSignUpEmail = inngestClient.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created'},
    async ({ event, step }) => {
        const userProfile = `
            - Country: ${event.data.country}
            - Investment goals: ${event.data.investmentGoals}
            - Risk tolerance: ${event.data.riskTolerance}
            - Preferred industry: ${event.data.preferredIndustry}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        }).catch(err => {
            console.error("Inngest AI inference failed:", err);
            return null;
        });

        await step.run('send-welcome-email', async () => {
            const part = response?.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining Stockz. You now have the tools to track markets and make smarter moves.'

            const { data: { email, name } } = event;

            try {
                return await sendWelcomeEmail({ email, name, intro: introText });
            } catch (error) {
                console.error("Failed to send welcome email via nodemailer:", error);
                throw error; // Re-throw to allow Inngest to retry
            }
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)

export const sendDailyNewsSummary = inngestClient.createFunction(
    { id: 'daily-news-summary' },
    [ { event: 'app/send.daily.news' }, { cron: '0 12 * * *' } ],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if(!users || users.length === 0) return { success: false, message: 'No users found for news email' };

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-2.5-flash' }),
                    body: {
                        contents: [{ role: 'user', parts: [{ text:prompt }]}]
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                userNewsSummaries.push({ user, newsContent });
            } catch (e) {
                console.error('Failed to summarize news for : ', user.email);
                userNewsSummaries.push({ user, newsContent: null });
            }
        }

        // Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
            const results = await Promise.allSettled(
                userNewsSummaries.map(async ({ user, newsContent}) => {
                    if(!newsContent) return false;

                    try {
                        await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent });
                        return true;
                    } catch (error) {
                        console.error(`Failed to send news email to ${user.email}:`, error);
                        return false;
                    }
                })
            )
            const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
            const failed = results.length - successful;
            console.log(`News delivery: ${successful} sent, ${failed} failed`);
        })

        return { success: true, message: 'Daily news summary emails sent successfully' }
    }
)