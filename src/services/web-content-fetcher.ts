'use server';
/**
 * @fileOverview A service for fetching content from web pages.
 *
 * - fetchContent - A function that fetches text content from a given URL.
 */

export async function fetchContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching content from ${url}:`, error);
    return `Error: Could not retrieve content from ${url}.`;
  }
}
