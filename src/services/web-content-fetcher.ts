'use server';

/**
 * Fetches the text content from a given URL.
 * @param url The URL to fetch content from.
 * @returns A promise that resolves to the text content of the page.
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
    return `Error fetching content from ${url}.`;
  }
}
