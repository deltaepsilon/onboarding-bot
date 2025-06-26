'use server';

/**
 * @fileOverview Determines if a new Slack hire is eligible for standard onboarding based on their employment type.
 *
 * - identifyEmploymentType - A function that initiates the employment type identification process.
 * - IdentifyEmploymentTypeInput - The input type, which is currently undefined but can be extended.
 * - IdentifyEmploymentTypeOutput - The output type, indicating whether the user qualifies for standard onboarding.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyEmploymentTypeInputSchema = z.object({
  userResponse: z
    .string()
    .describe('The user response to the employment type question.'),
});
export type IdentifyEmploymentTypeInput = z.infer<typeof IdentifyEmploymentTypeInputSchema>;

const IdentifyEmploymentTypeOutputSchema = z.object({
  eligibleForOnboarding: z
    .boolean()
    .describe(
      'Whether the user is eligible for the standard onboarding process based on their employment type.'
    ),
});
export type IdentifyEmploymentTypeOutput = z.infer<typeof IdentifyEmploymentTypeOutputSchema>;

export async function identifyEmploymentType(input: IdentifyEmploymentTypeInput): Promise<IdentifyEmploymentTypeOutput> {
  return identifyEmploymentTypeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyEmploymentTypePrompt',
  input: {schema: IdentifyEmploymentTypeInputSchema},
  output: {schema: IdentifyEmploymentTypeOutputSchema},
  prompt: `Determine if the user is eligible for standard onboarding based on their employment type.

User Response: {{{userResponse}}}

Consider these employment types eligible for standard onboarding: Full-time, Part-time, Contractor.
If the user indicates they are one of these employment types, set eligibleForOnboarding to true. Otherwise, set it to false.
`,
});

const identifyEmploymentTypeFlow = ai.defineFlow(
  {
    name: 'identifyEmploymentTypeFlow',
    inputSchema: IdentifyEmploymentTypeInputSchema,
    outputSchema: IdentifyEmploymentTypeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
