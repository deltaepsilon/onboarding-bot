import { z } from 'zod';

// This schema represents the document stored in Firestore for each Slack installation.
// The 'installation' field holds the object that Slack's Bolt framework expects.
export const SlackInstallationStoreSchema = z.object({
  id: z.string().describe("The team or enterprise ID."),
  installation: z.any().describe("The installation object from @slack/bolt."),
});
export type SlackInstallationStoreData = z.infer<typeof SlackInstallationStoreSchema>;
