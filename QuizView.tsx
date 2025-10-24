
import React, { useState, useEffect } from 'react';
import type { QuizState } from '../types';

interface QuizViewProps {
  quiz: QuizState;
  onRecordAnswer: (questionIndex: number, userAnswer: string, isCorrect: boolean) => void;
  onCompleteQuiz: () => void;
  onExitQuiz: () => void;
  onUpdateCurrentIndex: (index: number) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ quiz, onRecordAnswer, onCompleteQuiz, onExitQuiz, onUpdateCurrentIndex }) => {
  const { questions, currentIndex, answers, topicTitle, mode, correctCount, wrongCount } = quiz;
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = Math.round((currentIndex / totalQuestions) * 100);

  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [isChoiceLocked, setIsChoiceLocked] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  useEffect(() => {
    // Reset state for the new question
    setUserChoice(null);
    setIsChoiceLocked(false);
    setIsAnswerRevealed(false);

    // If returning to a question that was already answered in this session, show its state
    const previouslySavedAnswer = answers[currentIndex];
    if (previouslySavedAnswer) {
      setUserChoice(previouslySavedAnswer);
      setIsChoiceLocked(true);
      // If the saved answer was wrong, assume the user wants to see the revealed answer
      if (previouslySavedAnswer !== currentQuestion.correct) {
        setIsAnswerRevealed(true);
      }
    }
  }, [currentIndex, answers, currentQuestion.correct]);

  const handleSelectOption = (option: string) => {
    if (isChoiceLocked) return;

    const userSelection = option.substring(0, 1);
    setUserChoice(userSelection);
    setIsChoiceLocked(true);

    const isCorrect = userSelection === currentQuestion.correct;
    onRecordAnswer(currentIndex, userSelection, isCorrect);
  };

  const handleShowAnswer = () => {
    setIsAnswerRevealed(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      onUpdateCurrentIndex(currentIndex + 1);
    } else {
      onCompleteQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      onUpdateCurrentIndex(currentIndex - 1);
    }
  };
  
  const isCorrectChoice = userChoice === currentQuestion.correct;

  const renderActionButtons = () => {
    const isLastQuestion = currentIndex === totalQuestions - 1;

    if (mode === 'all') { // Exam Mode
      return (
        <button onClick={handleNextQuestion} className="btn-next-question">
          {isLastQuestion ? 'Finish Exam' : 'Next Question'}
        </button>
      );
    }
    
    // Practice Mode
    if (!isChoiceLocked) {
        return null; // No button until an answer is selected
    }
    
    if (isCorrectChoice) {
        return <button onClick={handleNextQuestion} className="btn-next-question">{isLastQuestion ? 'Finish Practice' : 'Next Question'}</button>
    }
    
    // Incorrect choice
    if (!isAnswerRevealed) {
        return <button onClick={handleShowAnswer} className="btn-show-answer">Show Answer</button>
    } else {
        return <button onClick={handleNextQuestion} className="btn-next-question">{isLastQuestion ? 'Finish Practice' : 'Next Question'}</button>
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
        {/* Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold">{topicTitle}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{mode === 'all' ? 'Exam Mode' : 'Practice Mode'}</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-sm text-slate-500 dark:text-slate-400">Question {currentIndex + 1} of {totalQuestions}</p>
              <div className="score-container mt-1">
                <span className="score-correct">Correct: <strong>{correctCount}</strong></span>
                <span className="score-wrong">Wrong: <strong>{wrongCount}</strong></span>
              </div>
            </div>
          </div>
          <div className="progress-section mt-4">
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-label mt-1">{progress}% Complete</span>
          </div>
        </div>

        {/* Question Card */}
        <div role="group" aria-labelledby="quiz-question-heading" className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-200 dark:border-slate-700 mt-6 flex-grow">
          <h2 id="quiz-question-heading" className="text-lg sm:text-xl font-semibold mb-6">{currentQuestion.question}</h2>
          <div role="radiogroup" aria-labelledby="quiz-question-heading" className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const optionId = option.substring(0, 1);
              const isCorrectAnswer = optionId === currentQuestion.correct;
              const isThisOptionSelected = userChoice === optionId;
              
              let optionClass = '';
              let icon = null;

              if (isChoiceLocked) {
                if(isCorrectChoice && isThisOptionSelected) {
                  optionClass = 'correct';
                  icon = <div className="feedback-icon correct-icon">✓</div>;
                } else if (!isCorrectChoice && isThisOptionSelected) {
                  optionClass = 'incorrect';
                  icon = <div className="feedback-icon incorrect-icon">✕</div>;
                } else if (!isCorrectChoice && isAnswerRevealed && isCorrectAnswer) {
                   optionClass = 'correct';
                   icon = <div className="feedback-icon correct-icon">✓</div>;
                } else {
                  optionClass = 'disabled';
                }
              }
              
              return (
                <button
                  key={index}
                  role="radio"
                  aria-checked={isThisOptionSelected}
                  onClick={() => handleSelectOption(option)}
                  disabled={isChoiceLocked}
                  className={`answer-option ${optionClass}`}
                >
                  <span className="font-bold mr-4">{optionId}.</span>
                  <span className="flex-1 pr-8">{option.substring(3)}</span>
                  {icon}
                </button>
              );
            })}
          </div>
        </div>
        
        {((isChoiceLocked && isCorrectChoice) || isAnswerRevealed) && (
          <div className="explanation-box mt-6">
            <h4 className="explanation-title">Explanation:</h4>
            <p className="explanation-text">{currentQuestion.explanation}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-6 flex justify-between items-center">
          <button onClick={onExitQuiz} className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 transition">
            Exit Quiz
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentIndex === 0}
              className="previous-btn"
            >
              &lt; Previous
            </button>
            {renderActionButtons()}
          </div>
        </footer>
      </div>
      <style>{`
        .score-container { display: flex; gap: 16px; font-size: 16px; font-weight: 600; }
        .score-correct { color: #10b981; }
        .score-correct strong { font-size: 18px; }
        .score-wrong { color: #ef4444; }
        .score-wrong strong { font-size: 18px; }
        .progress-label { display: block; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; }
        .progress-bar-container { width: 100%; height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); border-radius: 999px; transition: width 0.5s ease; }
        
        .answer-option { 
            position: relative; display: flex; align-items: center; width: 100%; text-align: left;
            border: 2px solid #e5e7eb; background: white; padding: 16px; border-radius: 12px;
            cursor: pointer; transition: all 0.2s ease-in-out; 
        }
        .dark .answer-option { background: #334155; border-color: #475569; }
        .answer-option:hover:not(:disabled) { border-color: #9ca3af; background: #f9fafb; transform: translateX(4px); }
        .dark .answer-option:hover:not(:disabled) { border-color: #64748b; background: #475569; }
        
        .answer-option.correct { border: 2px solid #10b981; background: #f0fdf4; }
        .dark .answer-option.correct { background: #052e16; border-color: #22c55e; }
        
        .answer-option.incorrect { border: 2px solid #ef4444; background: #fef2f2; }
        .dark .answer-option.incorrect { background: #450a0a; border-color: #f87171; }
        
        .answer-option.disabled { cursor: not-allowed; opacity: 0.8; }
        .dark .answer-option.disabled:not(.correct):not(.incorrect) { opacity: 0.5; }

        .feedback-icon {
          position: absolute; right: 16px; top: 50%; transform: translateY(-50%);
          width: 28px; height: 28px; color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; font-weight: bold;
        }
        .correct-icon { background: #10b981; }
        .incorrect-icon { background: #ef4444; }

        .explanation-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; }
        .dark .explanation-box { background: #1e3a8a; border-color: #60a5fa; }
        .explanation-title { color: #1e40af; font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .dark .explanation-title { color: #93c5fd; }
        .explanation-text { color: #1e3a8a; line-height: 1.6; font-size: 14px; }
        .dark .explanation-text { color: #dbeafe; }

        .btn-show-answer { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(251, 191, 36, 0.3); transition: all 0.2s ease; }
        .btn-show-answer:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(251, 191, 36, 0.4); }
        .btn-next-question { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 16px; cursor: pointer; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3); transition: all 0.2s ease; }
        .btn-next-question:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(59, 130, 246, 0.4); }

        .previous-btn { border: 2px solid #9ca3af; background: white; color: #4b5563; padding: 12px 24px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.2s ease; }
        .dark .previous-btn { background: #374151; color: #d1d5db; border-color: #4b5563; }
        .previous-btn:hover:not(:disabled) { background: #f3f4f6; transform: translateX(-2px); }
        .dark .previous-btn:hover:not(:disabled) { background: #4b5563; }
        .previous-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </div>
  );
};

export default QuizView;
