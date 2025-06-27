'use server';
/**
 * @fileOverview An AI flow that uses web content and chat history as context to answer user queries.
 *
 * - loadContextAndRespond - A function that takes a user query, chat history, loads content from predefined URLs, and generates a response.
 * - LoadContextAndRespondInput - The input type for the loadContextAndRespond function.
 * - LoadContextAndRespondOutput - The return type for the loadContextAndRespond function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchContent } from '@/services/web-content-fetcher';
import { ChatMessageSchema } from '@/models/schemas';

const ONBOARDING_URLS = [
  'https://gitlab.com/jacobu.hona/june-2025-hackathon-slackbot/-/raw/main/Onboarding%20Macbook%20Quickstart%20Guide%2020d0af3751308095ae6aeb2ba11033ab.md?ref_type=heads',
  'https://gitlab.com/jacobu.hona/june-2025-hackathon-slackbot/-/raw/main/README.md?ref_type=heads',
];

const LoadContextAndRespondInputSchema = z.object({
  query: z.string().describe('The latest user query from Slack.'),
  history: z.array(ChatMessageSchema).describe('The recent chat history for context.'),
});
export type LoadContextAndRespondInput = z.infer<typeof LoadContextAndRespondInputSchema>;

const LoadContextAndRespondOutputSchema = z.string().describe('The AI-generated response.').nullable();
export type LoadContextAndRespondOutput = z.infer<typeof LoadContextAndRespondOutputSchema>;

const contextPrompt = ai.definePrompt({
  name: 'contextPrompt',
  input: {
    schema: z.object({
      query: z.string(),
      context: z.string(),
      history: z.array(ChatMessageSchema),
    }),
  },
  output: { schema: LoadContextAndRespondOutputSchema },
  prompt: `You are an onboarding assistant. Your goal is to answer questions based on the provided context and chat history.

    CHAT HISTORY:
    {{#each history}}
    {{this.role}}: {{{this.text}}}
    {{/each}}

    ONBOARDING CONTEXT:
    {{{context}}}

    USER QUERY:
    {{{query}}}

    Based on all the information above, please answer the user's query. 
    Prompt the user to take the next step in the onboarding process.
    Make sure to reformat all content into Slack's mrkdwn format. For example, for links use the \`<URL|Link Text>\` format.
    If the answer is not in the context, say that you don't have enough information to answer. Remember the user's progress from the chat history.
  `,
});

export const loadContextAndRespondFlow = ai.defineFlow(
  {
    name: 'loadContextAndRespondFlow',
    inputSchema: LoadContextAndRespondInputSchema,
    outputSchema: LoadContextAndRespondOutputSchema,
  },
  async (input) => {
    const contextPromises = ONBOARDING_URLS.map(fetchContent);
    const contexts = await Promise.all(contextPromises);
    const combinedContext = contexts.join('\n\n---\n\n');

    const { output } = await contextPrompt({
      query: input.query,
      history: input.history,
      context: combinedContext,
    });

    return output || "I'm sorry, I couldn't generate a response.";
  }
);

export async function loadContextAndRespond(input: LoadContextAndRespondInput): Promise<LoadContextAndRespondOutput> {
  return loadContextAndRespondFlow(input);
}
