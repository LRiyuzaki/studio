
import type { Question, Unit } from './types';

/**
 * Groups an array of questions into units based on their study_unit property.
 *
 * @param questions - An array of Question objects to be grouped.
 * @returns An array of Unit objects, sorted by unit number.
 * @throws An error if the input is not a valid array of questions.
 */
export function groupQuestionsIntoUnits(questions: Question[]): Unit[] {
  if (!Array.isArray(questions)) {
    throw new Error("Invalid data format: 'questions' is not an array.");
  }

  const unitsMap = new Map<number, { unitName: string; questions: Question[] }>();

  questions.forEach(question => {
    if (!question.study_unit || typeof question.study_unit.number !== 'number') {
      console.warn('Skipping question with invalid study unit:', question.question_id);
      return;
    }
    const { number, name } = question.study_unit;

    if (!unitsMap.has(number)) {
      unitsMap.set(number, { unitName: name.replace(/ covers the information for this\nquestion/g, '').trim(), questions: [] });
    }
    unitsMap.get(number)!.questions.push(question);
  });

  const sortedUnits = Array.from(unitsMap.entries()).sort(([a], [b]) => a - b);

  return sortedUnits.map(([unitNumber, data]) => ({
    unitNumber,
    unitName: data.unitName,
    questions: data.questions,
    totalQuestions: data.questions.length,
  }));
}
