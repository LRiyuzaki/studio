
import React from 'react';
import { render, screen, fireEvent, within } from '../__tests__/test-utils';
import Dashboard from './dashboard';
import { mockQuizzes, mockAllProgress } from '../__tests__/mock-data';
import { useQuizStore } from '@/store/useQuizStore';

jest.mock('@/store/useQuizStore');

const mockUseQuizStore = useQuizStore as jest.Mock;

describe('Dashboard', () => {
  const onStartQuiz = jest.fn();
  const onBack = jest.fn();
  const onTimerToggle = jest.fn();
  const onResetProgress = jest.fn();

  beforeEach(() => {
    mockUseQuizStore.mockReset();
  });

  it('renders the dashboard with quiz information', () => {
    mockUseQuizStore.mockReturnValue({
        progress: {},
    });
    render(
      <Dashboard
        quiz={mockQuizzes[0]}
        onStartQuiz={onStartQuiz}
        onBack={onBack}
        timerEnabled={false}
        onTimerToggle={onTimerToggle}
        onResetProgress={onResetProgress}
      />
    );

    expect(screen.getByText('Mock Quiz 1')).toBeInTheDocument();
    expect(screen.getByText('Practice All Units')).toBeInTheDocument();
  });

  it('calls onStartQuiz with "all" when the "Practice All Units" button is clicked', () => {
    mockUseQuizStore.mockReturnValue({
        progress: {},
    });
    render(
      <Dashboard
        quiz={mockQuizzes[0]}
        onStartQuiz={onStartQuiz}
        onBack={onBack}
        timerEnabled={false}
        onTimerToggle={onTimerToggle}
        onResetProgress={onResetProgress}
      />
    );

    fireEvent.click(screen.getByText('Practice All Units'));
    expect(onStartQuiz).toHaveBeenCalledWith('all', false);
  });

  it('calls onStartQuiz with the unit number when a unit card is clicked', () => {
    mockUseQuizStore.mockReturnValue({
        progress: {},
    });
    render(
      <Dashboard
        quiz={mockQuizzes[0]}
        onStartQuiz={onStartQuiz}
        onBack={onBack}
        timerEnabled={false}
        onTimerToggle={onTimerToggle}
        onResetProgress={onResetProgress}
      />
    );

    const unitCard = screen.getByTestId('unit-card-1');
    const startButton = within(unitCard).getByText('Practice');
    fireEvent.click(startButton);
    expect(onStartQuiz).toHaveBeenCalledWith(1, false);
  });

  it('calls onTimerToggle when the timer switch is clicked', () => {
    mockUseQuizStore.mockReturnValue({
        progress: {},
    });
    render(
      <Dashboard
        quiz={mockQuizzes[0]}
        onStartQuiz={onStartQuiz}
        onBack={onBack}
        timerEnabled={false}
        onTimerToggle={onTimerToggle}
        onResetProgress={onResetProgress}
      />
    );

    fireEvent.click(screen.getByLabelText('Enable Timer'));
    expect(onTimerToggle).toHaveBeenCalledWith(true);
  });

  it('calls onResetProgress when the reset button is clicked', () => {
    mockUseQuizStore.mockReturnValue({
        progress: mockAllProgress,
    });
    render(
      <Dashboard
        quiz={mockQuizzes[0]}
        onStartQuiz={onStartQuiz}
        onBack={onBack}
        timerEnabled={false}
        onTimerToggle={onTimerToggle}
        onResetProgress={onResetProgress}
      />
    );

    const fullQuizSessionCard = screen.getByText('Full Quiz Session').closest('div[class*="rounded-lg border"]');
    if (fullQuizSessionCard) {
      const resetButton = within(fullQuizSessionCard).getByRole('button', { name: /reset and practice again/i });
      fireEvent.click(resetButton);
    }
    expect(onResetProgress).toHaveBeenCalledWith(mockQuizzes[0].id, 'all');
  });

  it('displays "Continue Practice" when progress exists', () => {
    mockUseQuizStore.mockReturnValue({
        progress: mockAllProgress,
    });
    render(
      <Dashboard
        quiz={mockQuizzes[0]}
        onStartQuiz={onStartQuiz}
        onBack={onBack}
        timerEnabled={false}
        onTimerToggle={onTimerToggle}
        onResetProgress={onResetProgress}
      />
    );

    expect(screen.getByText('Continue Practice')).toBeInTheDocument();
  });
});
