import { z } from 'zod';

// This schema represents the document stored in Firestore for each Slack installation.
// The 'installation' field holds the object that Slack's Bolt framework expects.
export const SlackInstallationStoreSchema = z.object({
  id: z.string().describe("The team or enterprise ID."),
  installation: z.any().describe("The installation object from @slack/bolt."),
});
export type SlackInstallationStoreData = z.infer<typeof SlackInstallationStoreSchema>;


// This schema represents a single message in a conversation, stored in Firestore.
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
  // We don't include timestamp in the Zod schema for Genkit,
  // as it's a server-generated value and not part of the core prompt logic.
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
