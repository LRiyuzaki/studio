
import type { Quiz, Question, UserAnswer, AllProgress } from '@/lib/types';

export const mockQuizzes: Quiz[] = [
  {
    id: '1',
    name: 'Mock Quiz 1',
    questions: [
      {
        question_id: '1-1',
        question_text: 'What is the capital of France?',
        options: ['Paris', 'London', 'Berlin', 'Madrid'],
        correct_answer: 'Paris',
        study_unit: { number: 1, name: 'Geography' },
      },
    ],
    units: [
      {
        unitNumber: 1,
        unitName: 'Geography',
        questions: [
          {
            question_id: '1-1',
            question_text: 'What is the capital of France?',
            options: ['Paris', 'London', 'Berlin', 'Madrid'],
            correct_answer: 'Paris',
            study_unit: { number: 1, name: 'Geography' },
          },
        ],
        totalQuestions: 1,
      },
    ],
  },
];

export const mockAllProgress: AllProgress = {
  '1': {
    '1': {
      answers: [
        {
          questionId: '1-1',
          isCorrect: true,
          responseTime: 1000,
          userAnswer: 'Paris',
        },
      ],
      completion: 100,
      accuracy: 100,
    },
  },
};
