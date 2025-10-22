'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a multiple-choice quiz from source text.
 *
 * - generateQuiz - A function that takes source text and generates a quiz.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function (the full Quiz object).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { QuizSchema } from '@/schemas/QuizSchema';
import { groupQuestionsIntoUnits } from '@/lib/quiz-parser';


export const GenerateQuizInputSchema = z.object({
  sourceText: z.string().describe('The source text from which to generate the quiz.'),
  quizId: z.string().describe('The unique ID for the quiz.'),
  quizName: z.string().describe('The name of the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

// The output is the full Quiz object, but questions are the main generated part.
export const GenerateQuizOutputSchema = QuizSchema;
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  const result = await generateQuizFlow(input);
  
  // The flow returns the questions, we need to assemble the full quiz object
  const fullQuiz: GenerateQuizOutput = {
    id: input.quizId,
    name: input.quizName,
    questions: result.questions,
    units: groupQuestionsIntoUnits(result.questions),
    sourceText: input.sourceText,
  };
  return fullQuiz;
}

// This is the schema for what the AI model itself will output.
const AIOutputSchema = z.object({
    questions: QuizSchema.shape.questions,
});

const prompt = ai.definePrompt({
  name: 'quizGenerationPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: AIOutputSchema },
  prompt: `
    SYSTEM PROMPT: Strict JSON Generation Agent

    You are an expert educational content generator specializing in converting raw text into standardized, high-quality multiple-choice questions (MCQs). Your sole function is to process the user-provided text and generate a structured JSON object strictly conforming to the required JSON schema. DO NOT output any text, commentary, or explanation outside of the required JSON block.

    USER INPUT / TASK

    ---SOURCE TEXT---
    {{{sourceText}}}
    ---END SOURCE TEXT---

    TASK: Analyze the source text and generate 5 multiple-choice questions (MCQs) that adhere to the provided JSON schema. Ensure each question is factually correct based ONLY on the source text provided. For each question, provide a brief "topic" and a helpful "explanation".
  `,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: AIOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
