import { App, LogLevel } from "@slack/bolt";
import { FirestoreInstallationStore } from "./installation-store";
import { slackConfig } from "./config";
import { loadContextAndRespond } from "@/ai/flows/context-tool";
import { initializeFirebaseServer } from "../firebase-server";
import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import type { ChatMessage } from "@/models/schemas";

const installationStore = new FirestoreInstallationStore();
const { firestore } = initializeFirebaseServer();

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

        const conversationId = message.channel;
        const messagesRef = collection(firestore, 'slackConversations', conversationId, 'messages');

        try {
            // Let the user know the bot is thinking by sending a threaded reply
            const thinkingMsg = await say({
                text: 'Thinking...',
                thread_ts: message.ts // Reply in a thread to keep it clean
            });

            // Log user message to Firestore
            await addDoc(messagesRef, {
                role: 'user',
                text: message.text,
                timestamp: serverTimestamp()
            });

            // Fetch recent chat history
            const historyQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(10));
            const historySnapshot = await getDocs(historyQuery);
            // reverse() to get chronological order (oldest first)
            const history = historySnapshot.docs.map(doc => doc.data() as ChatMessage).reverse();

            // Call the Genkit flow with the user's message and history
            const response = await loadContextAndRespond({
                query: message.text,
                history: history
            });

            // Log bot response to Firestore
            await addDoc(messagesRef, {
                role: 'model',
                text: response,
                timestamp: serverTimestamp()
            });

            // Send the AI's response back to the user in the same thread
            await say({
                text: response,
                thread_ts: message.ts
            });

        } catch (error) {
            logger.error("Error calling Genkit flow or logging to Firestore:", error);
            await say({
                text: "I'm sorry, I encountered an error while trying to respond.",
                thread_ts: message.ts
            });
        }
    }
});

export default app;
