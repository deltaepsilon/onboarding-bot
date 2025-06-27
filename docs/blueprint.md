# **App Name**: OnboardBot

## Core Features:

- Initial Onboarding Ping: Pings new Slack hires to initiate onboarding.
- Employment Type Identification: Asks user about their employment type to see if they qualify for onboarding.
- Context Tool: Loads and uses content from the specified web pages as context to drive the user's onboarding.
  - https://gitlab.com/jacobu.hona/june-2025-hackathon-slackbot/-/raw/main/Onboarding%20Macbook%20Quickstart%20Guide%2020d0af3751308095ae6aeb2ba11033ab.md?ref_type=heads.
  - https://gitlab.com/jacobu.hona/june-2025-hackathon-slackbot/-/raw/main/README.md?ref_type=heads
- Onboarding Item Tracking: Tracks each to-do item to see if they're completed, skipped or in-progress. Saves the state to Firestore and only prompts for in-progress items.
- AI Coach Tool: Coaches the employee through the process until completion. This bot is meant to coach the user through each onboarding to-do item, and will provide relevant tips as needed. It'll remember the last suggestion made using internal memory to prevent giving the same tips over and over. New, relevant information should always take priority when it becomes available. tool
- Feedback Storage: Saves user feedback and onboarding progress in Firestore.

## Style Guidelines:

- Primary color: Navy blue (#3B5998), conveying professionalism and reliability, drawing from the Slack brand but in a more corporate direction.
- Background color: Very light gray (#F0F2F5), providing a neutral backdrop for focused interaction.
- Accent color: Sky blue (#55ACEE), offering a touch of vibrancy for highlights and important actions, creating good contrast and visibility.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look, is used in both headlines and body text to provide a clean, easily legible interface that focuses on function.
- Simple, clear icons to represent onboarding steps and status (e.g., checkmark for completed, clock for in-progress, 'X' for skipped).
- Clean, linear layout with a conversational flow, mimicking a natural dialogue between the bot and the user.
- Subtle animations (e.g., a progress bar filling, a checkmark appearing) to provide visual feedback without being distracting.
