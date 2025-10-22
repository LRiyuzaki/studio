'use server';

import { personalizedStudySuggestions, PersonalizedStudySuggestionsInput, PersonalizedStudySuggestionsOutput } from '@/ai/flows/personalized-study-suggestions';
import { generateQuiz, GenerateQuizInput, GenerateQuizOutput } from '@/ai/flows/quiz-generation';

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

export async function generateNewQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  try {
    const quiz = await generateQuiz(input);
    return quiz;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw new Error('Failed to generate AI quiz.');
  }
}
