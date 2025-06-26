'use server';

import { App, LogLevel } from "@slack/bolt";
import { FirestoreInstallationStore } from "./installation-store";

const installationStore = new FirestoreInstallationStore();

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: process.env.NEXT_PUBLIC_SLACK_SCOPES?.split(','),
  installationStore: installationStore,
  logLevel: process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  processBeforeResponse: true, // Required for Next.js serverless functions
});

// Example: Listens for messages containing "hello" and responds
app.message('hello', async ({ message, say }) => {
  // Filter out message subtypes (e.g., channel join, message edit)
  if (message.subtype === undefined) {
    await say(`Hey there <@${message.user}>!`);
  }
});

// Example: Publish a view to the App Home tab when a user opens it
app.event('app_home_opened', async ({ event, client, logger }) => {
  try {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Welcome home, <@${event.user}>! :tada:`,
            },
          },
        ],
      },
    });
  } catch (error) {
    logger.error('Error publishing home tab:', error);
  }
});

export default app;
