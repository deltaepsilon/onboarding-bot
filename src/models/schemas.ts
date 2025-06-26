import { z } from 'zod';
import { FieldValue } from 'firebase/firestore';

export const UserSchema = z.object({
  slackUserId: z.string(),
  employmentType: z.string().nullable(),
});
export type UserData = z.infer<typeof UserSchema>;

export const OnboardingItemSchema = z.object({
  userId: z.string(),
  description: z.string(),
  status: z.enum(['in-progress', 'completed', 'skipped']),
});
export type OnboardingItemData = z.infer<typeof OnboardingItemSchema>;
export type OnboardingItem = OnboardingItemData & { id: string };

export const FeedbackSchema = z.object({
  userId: z.string(),
  onboardingItemId: z.string().nullable(),
  text: z.string(),
  timestamp: z.custom<FieldValue>(),
});
export type FeedbackData = z.infer<typeof FeedbackSchema>;
