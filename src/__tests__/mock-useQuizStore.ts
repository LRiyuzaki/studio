
import { jest } from '@jest/globals';

const mockUseQuizStore = {
  quizzes: [],
  setQuizzes: jest.fn(),
  progress: {},
  setProgress: jest.fn(),
  answers: {},
  setAnswer: jest.fn(),
  initializeUnit: jest.fn(),
};

export const useQuizStore = jest.fn(() => mockUseQuizStore);
