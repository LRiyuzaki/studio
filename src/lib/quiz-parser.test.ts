
import { groupQuestionsIntoUnits } from './quiz-parser';
import type { Question } from './types';

describe('groupQuestionsIntoUnits', () => {
  it('should group questions into units correctly', () => {
    const questions: Question[] = [
      { question_id: 'q1', study_unit: { number: 1, name: 'Unit 1' }, question_text: '', options: [], correct_answer: '' },
      { question_id: 'q2', study_unit: { number: 2, name: 'Unit 2' }, question_text: '', options: [], correct_answer: '' },
      { question_id: 'q3', study_unit: { number: 1, name: 'Unit 1' }, question_text: '', options: [], correct_answer: '' },
    ];
    const units = groupQuestionsIntoUnits(questions);
    expect(units).toHaveLength(2);
    expect(units[0].unitNumber).toBe(1);
    expect(units[0].questions).toHaveLength(2);
    expect(units[1].unitNumber).toBe(2);
    expect(units[1].questions).toHaveLength(1);
  });

  it('should handle an empty array of questions', () => {
    const units = groupQuestionsIntoUnits([]);
    expect(units).toHaveLength(0);
  });

  it('should throw an error for invalid input', () => {
    // @ts-ignore
    expect(() => groupQuestionsIntoUnits('not an array')).toThrow("Invalid data format: 'questions' is not an array.");
  });

  it('should skip questions with invalid study unit', () => {
    const questions: any[] = [
      { question_id: 'q1', study_unit: { number: 1, name: 'Unit 1' } },
      { question_id: 'q2' },
      { question_id: 'q3', study_unit: { name: 'Unit 3' } },
    ];
    const units = groupQuestionsIntoUnits(questions);
    expect(units).toHaveLength(1);
    expect(units[0].questions).toHaveLength(1);
  });

  it('should sort units by unit number', () => {
    const questions: Question[] = [
      { question_id: 'q1', study_unit: { number: 2, name: 'Unit 2' }, question_text: '', options: [], correct_answer: '' },
      { question_id: 'q2', study_unit: { number: 1, name: 'Unit 1' }, question_text: '', options: [], correct_answer: '' },
    ];
    const units = groupQuestionsIntoUnits(questions);
    expect(units[0].unitNumber).toBe(1);
    expect(units[1].unitNumber).toBe(2);
  });

  it('should clean the unit name', () => {
    const questions: Question[] = [
      { question_id: 'q1', study_unit: { number: 1, name: 'Unit 1 covers the information for this\nquestion' }, question_text: '', options: [], correct_answer: '' },
    ];
    const units = groupQuestionsIntoUnits(questions);
    expect(units[0].unitName).toBe('Unit 1');
  });
});
