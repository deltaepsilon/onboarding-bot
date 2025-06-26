import { App, LogLevel } from "@slack/bolt";
import { FirestoreInstallationStore } from "./installation-store";
import { slackConfig } from "./config";

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
    // Bolt's `message` event is a bit broad. We want to filter for actual text messages from users.
    // 'subtype' is a good indicator of a special message type (e.g., channel_join)
    // We also check that 'text' exists on the message object.
    if (message.subtype === undefined && 'text' in message) {
        logger.info(`Received message from ${message.user}: "${message.text}"`);

        // Respond only to direct messages to the bot
        if (message.channel_type === 'im') {
            await say(`I heard you say: "${message.text}"`);
        }
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
