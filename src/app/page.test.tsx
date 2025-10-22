
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../__tests__/test-utils';
import Home from './page';
import { mockQuizzes } from '../__tests__/mock-data';
import { useQuizStore } from '@/store/useQuizStore';

jest.mock('@/store/useQuizStore');

const mockUseQuizStore = useQuizStore as jest.Mock;

describe('Home component', () => {
  beforeEach(() => {
    mockUseQuizStore.mockReset();
  });

  test('renders the dashboard view by default', () => {
    mockUseQuizStore.mockReturnValue({
        quizzes: [],
        progress: {},
        setQuizzes: jest.fn(),
        setProgress: jest.fn(),
    });
    render(<Home />);
    expect(screen.getByText('My Quizzes')).toBeInTheDocument();
  });

  test('adds a new quiz to the library', async () => {
    const setQuizzes = jest.fn();
    mockUseQuizStore.mockReturnValue({
        quizzes: [],
        progress: {},
        setQuizzes,
        setProgress: jest.fn(),
    });
    render(<Home />);
    fireEvent.click(screen.getByText('Add New Quiz'));

    // Fill in quiz name
    fireEvent.change(screen.getByPlaceholderText('e.g. Biology 101'), { target: { value: 'New Mock Quiz' } });

    // Mock file upload
    const file = new File([JSON.stringify({ questions: mockQuizzes[0].questions })], 'quiz.json', { type: 'application/json' });
    const fileInput = screen.getByTestId('file-uploader');

    // Mock FileReader
    const mockFileReader = {
      onload: null as ((e: any) => void) | null,
      readAsText: jest.fn().mockImplementation(function(this: any) {
        if (this.onload) {
          this.onload({ target: { result: JSON.stringify({ questions: mockQuizzes[0].questions }) } });
        }
      }),
    };
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

    fireEvent.change(fileInput, { target: { files: [file] } });

    // The button should be enabled after file is loaded and name is filled
    await waitFor(() => {
        expect(screen.getByText('Add Quiz')).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText('Add Quiz'));

    await waitFor(() => {
        expect(setQuizzes).toHaveBeenCalledTimes(1);
    });
  });

  test('selects a quiz and shows the dashboard', () => {
    mockUseQuizStore.mockReturnValue({
        quizzes: mockQuizzes,
        progress: {},
        setQuizzes: jest.fn(),
        setProgress: jest.fn(),
    });
    render(<Home />);
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('Practice All Units')).toBeInTheDocument();
  });

  test('starts a quiz and shows the quiz runner', async () => {
    mockUseQuizStore.mockReturnValue({
        quizzes: mockQuizzes,
        progress: {},
        setQuizzes: jest.fn(),
        setProgress: jest.fn(),
        initializeUnit: jest.fn(),
    });
    render(<Home />);
    fireEvent.click(screen.getByText('Open'));

    await screen.findByText('Practice All Units');

    fireEvent.click(screen.getByText('Practice All Units'));
    await waitFor(() => {
        expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    });
  });
});
