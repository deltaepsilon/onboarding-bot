import { App, LogLevel } from "@slack/bolt";
import { FirestoreInstallationStore } from "./installation-store";
import { slackConfig } from "./config";
import { loadContextAndRespond } from "@/ai/flows/context-tool";

const installationStore = new FirestoreInstallationStore();

const app = new App({
  signingSecret: slackConfig.signingSecret,
  clientId: slackConfig.clientId,
  clientSecret: slackConfig.clientSecret,
  stateSecret: slackConfig.stateSecret,
  scopes: slackConfig.scopes?.split(','),
  installationStore: installationStore,
  logLevel: process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  processBeforeResponse: true, // Required for Next.js serverless functions
});

// A generic message listener that captures all messages.
// To avoid being spammy in channels, it will only respond to direct messages.
app.message(async ({ message, say, logger }) => {
    // Filter for actual text messages from users in direct messages
    if (message.subtype === undefined && 'text' in message && message.channel_type === 'im') {
        logger.info(`Received message from ${message.user}: "${message.text}"`);

        try {
            // Let the user know the bot is thinking by sending a threaded reply
            const thinkingMsg = await say({
                text: 'Thinking...',
                thread_ts: message.ts // Reply in a thread to keep it clean
            });

            // Call the Genkit flow with the user's message
            const response = await loadContextAndRespond(message.text);

            // Send the AI's response back to the user in the same thread
            await say({
                text: response,
                thread_ts: message.ts
            });

            // Optional: You could delete the "Thinking..." message, but leaving it shows the bot's process.

        } catch (error) {
            logger.error("Error calling Genkit flow:", error);
            await say({
                text: "I'm sorry, I encountered an error while trying to respond.",
                thread_ts: message.ts
            });
        }
    }
});

export default app;
