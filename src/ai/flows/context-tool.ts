'use server';
/**
 * @fileOverview A Genkit flow that loads content from specified web pages and uses it as context for onboarding.
 *
 * - loadContextAndRespond - A function that loads web page content and responds to a user query.
 * - LoadContextAndRespondInput - The input type for the loadContextAndRespond function.
 * - LoadContextAndRespondOutput - The return type for the loadContextAndRespond function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchContent} from '@/services/web-content-fetcher';

const LoadContextAndRespondInputSchema = z.object({
  urls: z.array(z.string().url()).describe('An array of URLs to fetch content from.'),
  query: z.string().describe('The user query to answer using the fetched content as context.'),
});
export type LoadContextAndRespondInput = z.infer<typeof LoadContextAndRespondInputSchema>;

const LoadContextAndRespondOutputSchema = z.object({
  response: z.string().describe('The response to the user query, based on the fetched content.'),
});
export type LoadContextAndRespondOutput = z.infer<typeof LoadContextAndRespondOutputSchema>;

export async function loadContextAndRespond(input: LoadContextAndRespondInput): Promise<LoadContextAndRespondOutput> {
  return loadContextAndRespondFlow(input);
}

const PromptInputSchema = LoadContextAndRespondInputSchema.extend({
  content: z.array(
    z.object({
      url: z.string(),
      text: z.string(),
    })
  ),
});

const prompt = ai.definePrompt({
  name: 'loadContextAndRespondPrompt',
  input: {schema: PromptInputSchema},
  output: {schema: LoadContextAndRespondOutputSchema},
  prompt: `You are an onboarding assistant.  You will be provided with content from several web pages, and you will use this content to answer the user's query.

Content:
{{#each content}}
-- URL: {{this.url}} --
{{this.text}}
{{/each}}

Query: {{{query}}}`,
});

const loadContextAndRespondFlow = ai.defineFlow(
  {
    name: 'loadContextAndRespondFlow',
    inputSchema: LoadContextAndRespondInputSchema,
    outputSchema: LoadContextAndRespondOutputSchema,
  },
  async input => {
    const content = await Promise.all(
      input.urls.map(async url => ({
        url,
        text: await fetchContent(url),
      }))
    );

    const {output} = await prompt({...input, content});
    return output!;
  }
);
