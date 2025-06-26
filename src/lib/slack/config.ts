
// Centralized configuration for Slack integration.
// It reads environment variables and provides them to the application.

export const slackConfig = {
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: process.env.SLACK_STATE_SECRET,
    scopes: process.env.NEXT_PUBLIC_SLACK_SCOPES,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
};

// A mapping from the keys in slackConfig to the actual environment variable names.
// Useful for creating user-friendly error messages.
const ENV_VAR_NAMES: { [K in keyof typeof slackConfig]: string } = {
    signingSecret: 'SLACK_SIGNING_SECRET',
    clientId: 'SLACK_CLIENT_ID',
    clientSecret: 'SLACK_CLIENT_SECRET',
    stateSecret: 'SLACK_STATE_SECRET',
    scopes: 'NEXT_PUBLIC_SLACK_SCOPES',
    appUrl: 'NEXT_PUBLIC_APP_URL',
};


/**
 * Checks for missing required environment variables for the Slack integration.
 * @param requiredKeys - An array of keys from slackConfig that are required.
 * @returns An array of the actual environment variable names that are missing.
 */
export function getMissingEnvVariableNames(requiredKeys: (keyof typeof slackConfig)[]) {
    const missingVarNames: string[] = [];
    for (const key of requiredKeys) {
        if (!slackConfig[key]) {
            missingVarNames.push(ENV_VAR_NAMES[key]);
        }
    }
    return missingVarNames;
}
