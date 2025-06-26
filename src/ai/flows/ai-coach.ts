'use server';

/**
 * @fileOverview AI coach to guide the user through each onboarding step, providing relevant tips and remembering past suggestions to avoid repetition.
 *
 * - aiCoach - A function that handles the coaching process.
 * - AiCoachInput - The input type for the aiCoach function.
 * - AiCoachOutput - The return type for the aiCoach function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCoachInputSchema = z.object({
  onboardingItem: z.string().describe('The current onboarding to-do item.'),
  previousSuggestions: z.array(z.string()).describe('The list of previous suggestions made by the AI coach.'),
  context: z.string().describe('Contextual information to drive the onboarding. This may include company-specific documentation.'),
});
export type AiCoachInput = z.infer<typeof AiCoachInputSchema>;

const AiCoachOutputSchema = z.object({
  suggestion: z.string().describe('The suggestion provided by the AI coach for the current onboarding item.'),
});
export type AiCoachOutput = z.infer<typeof AiCoachOutputSchema>;

export async function aiCoach(input: AiCoachInput): Promise<AiCoachOutput> {
  return aiCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCoachPrompt',
  input: {schema: AiCoachInputSchema},
  output: {schema: AiCoachOutputSchema},
  prompt: `You are an AI coach guiding a new employee through their onboarding process.

  Your goal is to provide relevant and helpful tips for the current onboarding item, while avoiding repetition of previous suggestions.

  Here's the current onboarding item:
  {{onboardingItem}}

  Here's a list of suggestions you've already made:
  {{#if previousSuggestions}}
    {{#each previousSuggestions}}
      - {{{this}}}
    {{/each}}
  {{else}}
    No previous suggestions.
  {{/if}}

  Here's some contextual information that might be helpful:
  {{context}}

  Based on this information, what is a new, helpful, and relevant suggestion you can provide to the employee?
  Make sure to only suggest actions related to the onboarding item and the context provided.
  Suggestion: `,
});

const aiCoachFlow = ai.defineFlow(
  {
    name: 'aiCoachFlow',
    inputSchema: AiCoachInputSchema,
    outputSchema: AiCoachOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
