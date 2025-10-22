
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../__tests__/test-utils';
import AddQuizDialog from './add-quiz-dialog';
import { mockQuizzes } from '../__tests__/mock-data';
import { useQuizStore } from '@/store/useQuizStore';

jest.mock('@/store/useQuizStore');

const mockUseQuizStore = useQuizStore as jest.Mock;

describe('AddQuizDialog', () => {
  const onQuizAdded = jest.fn();

  beforeEach(() => {
    mockUseQuizStore.mockReset();
    onQuizAdded.mockClear();
  });

  it('renders the dialog and allows adding a quiz', async () => {
    mockUseQuizStore.mockReturnValue({
        setQuizzes: onQuizAdded,
    });
    render(<AddQuizDialog onQuizAdded={onQuizAdded} />);

    // Open the dialog
    fireEvent.click(screen.getByText('Add New Quiz'));

    // Check if the dialog is open
    expect(screen.getByText('Add a New Quiz')).toBeInTheDocument();

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
      expect(onQuizAdded).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onQuizAdded if the quiz name is missing', async () => {
    mockUseQuizStore.mockReturnValue({
        setQuizzes: onQuizAdded,
    });
    render(<AddQuizDialog onQuizAdded={onQuizAdded} />);

    fireEvent.click(screen.getByText('Add New Quiz'));
    fireEvent.click(screen.getByText('Add Quiz'));

    await waitFor(() => {
        expect(onQuizAdded).not.toHaveBeenCalled();
    });
  });

  it('does not call onQuizAdded if the quiz file is missing', async () => {
    mockUseQuizStore.mockReturnValue({
        setQuizzes: onQuizAdded,
    });
    render(<AddQuizDialog onQuizAdded={onQuizAdded} />);

    fireEvent.click(screen.getByText('Add New Quiz'));
    fireEvent.change(screen.getByPlaceholderText('e.g. Biology 101'), { target: { value: 'New Mock Quiz' } });
    fireEvent.click(screen.getByText('Add Quiz'));

    await waitFor(() => {
        expect(onQuizAdded).not.toHaveBeenCalled();
    });
  });
});
