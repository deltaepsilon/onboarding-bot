/**
 * Represents a Slack user.
 */
export interface SlackUser {
  /**
   * The user's Slack ID.
   */
  id: string;
  /**
   * The user's display name.
   */
  displayName: string;
}

/**
 * Sends a direct message to a Slack user.
 *
 * @param user The Slack user to send the message to.
 * @param message The message to send.
 * @returns A promise that resolves when the message is sent successfully.
 */
export async function sendSlackMessage(user: SlackUser, message: string): Promise<void> {
  // TODO: Implement this by calling the Slack API.
  console.log(`Sending message to ${user.displayName}: ${message}`);
}

/**
 * Retrieves a Slack user by their ID.
 *
 * @param userId The ID of the Slack user to retrieve.
 * @returns A promise that resolves to a SlackUser object, or null if the user is not found.
 */
export async function getSlackUser(userId: string): Promise<SlackUser | null> {
  // TODO: Implement this by calling the Slack API.
  return {
    id: userId,
    displayName: 'Test User',
  };
}
