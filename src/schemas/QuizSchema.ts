import { z } from 'zod';

const OptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  is_correct: z.boolean(),
});

const StudyUnitInfoSchema = z.object({
  number: z.number(),
  name: z.string(),
});

const QuestionSchema = z.object({
  question_id: z.string(),
  topic: z.string(),
  question_text: z.string(),
  options: z.array(OptionSchema),
  correct_answer: z.string(),
  study_unit: StudyUnitInfoSchema,
  explanation: z.string(),
});

export const QuizSchema = z.object({
  id: z.string(),
  name: z.string(),
  questions: z.array(QuestionSchema),
});
