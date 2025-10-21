'use server';

import { personalizedStudySuggestions, PersonalizedStudySuggestionsInput, PersonalizedStudySuggestionsOutput } from '@/ai/flows/personalized-study-suggestions';

export async function getStudySuggestions(input: PersonalizedStudySuggestionsInput): Promise<PersonalizedStudySuggestionsOutput> {
  try {
    const suggestions = await personalizedStudySuggestions(input);
    return suggestions;
  } catch (error) {
    console.error('Error getting study suggestions:', error);
    // In a real app, you'd want more robust error handling and logging
    throw new Error('Failed to generate AI suggestions.');
  }
}
