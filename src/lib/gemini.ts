// lib/gemini.ts
import { geminiModel } from "./firebase";
import type { MCQ } from "./types";

const MCQ_PROMPT = `Generate {numQuestions} multiple-choice questions from this text.

FORMAT (strict JSON array, no extra text or markdown):
[
  {
    "question": "Question text here?",
    "options": ["A) Option", "B) Option", "C) Option", "D) Option"],
    "correct": "A"
  }
]

TEXT:
{content}`;

export async function generateMCQs(
  content: string, 
  numQuestions: number
): Promise<MCQ[]> {
  const prompt = MCQ_PROMPT
    .replace("{numQuestions}", String(numQuestions))
    .replace("{content}", content.slice(0, 30000)); // Token limit
  
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  
  // Parse JSON response
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in the AI response.");
    return JSON.parse(jsonMatch[0]);
  } catch(e) {
    console.error("Failed to parse JSON from AI response:", text);
    throw new Error("Failed to parse MCQs from the AI. The format was invalid.");
  }
}
