'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized study suggestions to students based on their quiz performance.
 *
 * - personalizedStudySuggestions - A function that takes a student's performance data and returns suggested study units.
 * - PersonalizedStudySuggestionsInput - The input type for the personalizedStudySuggestions function.
 * - PersonalizedStudySuggestionsOutput - The return type for the personalizedStudySuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedStudySuggestionsInputSchema = z.object({
  performanceData: z.array(
    z.object({
      studyUnit: z.object({
        number: z.number(),
        name: z.string(),
      }),
      questionsAttempted: z.number(),
      questionsCorrect: z.number(),
      accuracy: z.number(),
      averageResponseTime: z.number(),
    })
  ).describe('An array of performance data for each study unit.'),
});
export type PersonalizedStudySuggestionsInput = z.infer<typeof PersonalizedStudySuggestionsInputSchema>;

const PersonalizedStudySuggestionsOutputSchema = z.object({
  suggestedUnits: z.array(
    z.object({
      unitNumber: z.number(),
      unitName: z.string(),
      reason: z.string(),
    })
  ).describe('An array of study units suggested for further review, along with a reason for each suggestion.'),
});
export type PersonalizedStudySuggestionsOutput = z.infer<typeof PersonalizedStudySuggestionsOutputSchema>;

export async function personalizedStudySuggestions(input: PersonalizedStudySuggestionsInput): Promise<PersonalizedStudySuggestionsOutput> {
  return personalizedStudySuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedStudySuggestionsPrompt',
  input: {schema: PersonalizedStudySuggestionsInputSchema},
  output: {schema: PersonalizedStudySuggestionsOutputSchema},
  prompt: `You are an AI study assistant. Analyze the student's performance data and suggest specific study units they should focus on to improve their understanding and test scores.

Consider the following:
- Units with low accuracy.
- Units with high average response time, indicating difficulty.

Performance Data:
{{#each performanceData}}
- Unit Number: {{this.studyUnit.number}}
  Unit Name: {{this.studyUnit.name}}
  Questions Attempted: {{this.questionsAttempted}}
  Questions Correct: {{this.questionsCorrect}}
  Accuracy: {{this.accuracy}}%
  Average Response Time: {{this.averageResponseTime}} seconds
{{/each}}

Suggest a maximum of 3 study units. Provide a reason for each suggestion.

Output in the following JSON format:
{
  "suggestedUnits": [
    {
      "unitNumber": "<unit_number>",
      "unitName": "<unit_name>",
      "reason": "<reason_for_suggestion>"
    }
  ]
}`,
});

const personalizedStudySuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedStudySuggestionsFlow',
    inputSchema: PersonalizedStudySuggestionsInputSchema,
    outputSchema: PersonalizedStudySuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
