import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionCard from './question-card';

const mockQuestion = {
  id: '1',
  question_text: 'What is the capital of France?',
  topic: 'Geography',
  options: [
    { id: 'a', text: 'London' },
    { id: 'b', text: 'Paris' },
    { id: 'c', text: 'Berlin' },
    { id: 'd', text: 'Madrid' },
  ],
  correct_answer: 'b',
  explanation: 'Paris is the capital of France.',
};

describe('QuestionCard', () => {
  it('renders the question and options', () => {
    const onAnswer = jest.fn();
    render(<QuestionCard question={mockQuestion} onAnswer={onAnswer} />);

    expect(screen.getByText('What is the capital of France?')).toBeInTheDocument();
    expect(screen.getByText('a.')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('b.')).toBeInTheDocument();
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('c.')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.getByText('d.')).toBeInTheDocument();
    expect(screen.getByText('Madrid')).toBeInTheDocument();
  });

  it('allows the user to select an answer', () => {
    const onAnswer = jest.fn();
    render(<QuestionCard question={mockQuestion} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText('Paris'));
    const submitButton = screen.getByText('Submit');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls the onAnswer callback when the user submits an answer', () => {
    const onAnswer = jest.fn();
    render(<QuestionCard question={mockQuestion} onAnswer={onAnswer} />);

    fireEvent.click(screen.getByText('Paris'));
    fireEvent.click(screen.getByText('Submit'));
    expect(onAnswer).toHaveBeenCalledWith('b');
  });

  it('shows the correct feedback when the user answers correctly', () => {
    const onAnswer = jest.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        userAnswer={{ selectedOptionId: 'b', isCorrect: true }}
      />
    );

    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('shows the incorrect feedback when the user answers incorrectly', () => {
    const onAnswer = jest.fn();
    render(
      <QuestionCard
        question={mockQuestion}
        onAnswer={onAnswer}
        userAnswer={{ selectedOptionId: 'a', isCorrect: false }}
      />
    );

    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    expect(screen.getByText(/The correct answer was/)).toBeInTheDocument();
    expect(screen.getByText(/b: Paris/)).toBeInTheDocument();
  });
});
