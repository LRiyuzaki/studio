'use client';
import { useState, useEffect } from 'react';
import { Topic, MCQ, QuizMode } from '@/lib/types';
import Timer from './Timer';

/**
 * @typedef QuizDisplayProps
 * @property {Topic} topic - The topic object containing the quiz questions.
 * @property {QuizMode} mode - The current quiz mode ('study', 'practice', 'exam').
 * @property {string} unitId - The ID of the unit this topic belongs to.
 * @property {string} courseId - The ID of the course.
 * @property {(score: number, answers: (string | null)[], timeSpent: number) => void} onComplete - Callback for when the quiz is finished.
 * @property {() => void} onExit - Callback for when the user exits the quiz.
 * @property {(score: number, answers: (string | null)[]) => void} [onStateChange] - Optional callback for state changes.
 */

/**
 * The core component for displaying and managing an active quiz session.
 * It handles question rendering, answer selection, feedback, and navigation based on the selected mode.
 * @param {QuizDisplayProps} props - The component props.
 * @returns {JSX.Element} The quiz display component.
 */
export default function QuizDisplay({ topic, mode, unitId, courseId, onComplete, onExit, onStateChange }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(topic.mcqs.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime] = useState(Date.now());
  const [timePerQuestion] = useState(30); // 30 seconds for exam mode questions

  const currentQuestion = topic.mcqs[currentIndex];
  const isLastQuestion = currentIndex === topic.mcqs.length - 1;

  useEffect(() => {
    if (onStateChange) {
      onStateChange(score, answers);
    }
  }, [score, answers, onStateChange]);
  
  /**
   * Handles the user selecting an answer for the current question.
   * Behavior changes based on the quiz mode.
   * @param {string} selected - The ID of the selected option (e.g., 'A', 'B').
   */
  const handleAnswer = (selected: string) => {
    // If an answer has already been locked in for this question, do nothing.
    // This applies to 'exam' mode after one answer, and 'practice'/'study' after revealing the correct answer.
    if (answers[currentIndex] !== null && (mode === 'exam' || showAnswer)) return;

    const newAnswers = [...answers];
    const wasAnswered = newAnswers[currentIndex] !== null;
    const wasCorrectBefore = wasAnswered && newAnswers[currentIndex] === currentQuestion.correct;

    newAnswers[currentIndex] = selected;
    setAnswers(newAnswers);

    const isCorrect = selected === currentQuestion.correct;
    
    // --- Mode-specific logic ---
    if (mode === 'practice') {
      if (isCorrect) {
        if (!wasCorrectBefore) setScore(prev => prev + 1);
        if (wasAnswered && !wasCorrectBefore) setIncorrectCount(prev => prev - 1);
        setShowExplanation(true);
        setShowAnswer(true); // Lock the answer and show explanation
      } else {
        if (!wasAnswered) setIncorrectCount(prev => prev + 1);
      }
    } else if (mode === 'study') {
      if (isCorrect && !wasAnswered) setScore(prev => prev + 1);
      setShowExplanation(true);
      setShowAnswer(true); // Lock answer and show explanation immediately
    } else { // exam mode
      if (isCorrect) setScore(prev => prev + 1);
      else if (selected !== '') setIncorrectCount(prev => prev + 1);
      moveToNextQuestion();
    }
  };

  /**
   * Handles revealing the answer in practice mode.
   */
  const handleShowAnswer = () => {
    setShowAnswer(true);
    setShowExplanation(true);
  };
  
  /**
   * Moves to the next question or finishes the quiz.
   */
  const moveToNextQuestion = () => {
    if (isLastQuestion) {
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      onComplete(score, answers, totalTime);
    } else {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
      setShowAnswer(false);
    }
  };

  /**
   * Callback for when the timer expires in 'exam' mode.
   */
  const handleTimeExpire = () => {
    if (mode === 'exam' && answers[currentIndex] === null) {
      handleAnswer(''); // Auto-skip on timeout
    }
  };

  /**
   * Determines the CSS classes for an option button based on the mode and state.
   * @param {string} letter - The letter of the option ('A', 'B', etc.).
   * @returns {string} A string of Tailwind CSS classes.
   */
  const getOptionStyle = (letter: string) => {
    const selectedAnswer = answers[currentIndex];
    const isCorrect = currentQuestion.correct === letter;
    const answerIsRevealed = showAnswer;

    // Default styles for an unselected, active option
    let baseStyle = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
    
    if (answerIsRevealed) {
        // --- Answer is revealed (Study mode, or after correct/show-answer in Practice) ---
        if (isCorrect) {
            return 'border-green-500 bg-green-50 text-green-800 scale-105'; // Highlight correct
        }
        if (selectedAnswer === letter && !isCorrect) {
            return 'border-red-500 bg-red-50 text-red-800'; // Show user's wrong choice
        }
        return 'border-gray-200 bg-gray-50 opacity-70'; // Fade out other non-selected options
    }

    // --- Answer is NOT yet revealed ---
    if (selectedAnswer === letter) {
      if (mode === 'practice' && !isCorrect) {
        return 'border-red-500 bg-red-50 text-red-800'; // In practice, show wrong immediately
      }
      if (mode === 'exam') {
        return 'border-blue-500 bg-blue-50 text-blue-800'; // In exam, just show selection
      }
    }
    
    // For exam mode, if an answer is selected, disable other options
    if (mode === 'exam' && selectedAnswer !== null) {
      if (selectedAnswer !== letter) {
        return 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed';
      }
    }

    return baseStyle;
  };


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8 p-4 bg-white rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">{topic.topicTitle}</h1>
          <p className="text-gray-600 capitalize">{mode} Mode</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">
            Question {currentIndex + 1} of {topic.mcqs.length}
          </div>
          <div className="flex items-center gap-4">
            {mode === 'practice' && (
              <div className="flex gap-4 text-lg font-bold">
                 <span className="text-green-600">Correct: {score}</span>
                 <span className="text-red-600">Wrong: {incorrectCount}</span>
              </div>
            )}
            {mode === 'exam' && (
              <Timer key={currentIndex} duration={timePerQuestion} onExpire={handleTimeExpire} mode="question" />
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / topic.mcqs.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-bold mb-6 leading-relaxed">{currentQuestion.question}</h2>
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option: any, index: number) => {
            const letter = String.fromCharCode(65 + index);
            const isDisabled = (mode === 'exam' && answers[currentIndex] !== null) || showAnswer;
            return (
              <button
                key={index}
                onClick={() => handleAnswer(letter)}
                disabled={isDisabled}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-300 ${getOptionStyle(letter)} ${isDisabled ? 'cursor-not-allowed' : ''}`}
              >
                <span className="font-bold mr-3">{letter}.</span>
                {option.replace(/^[A-D]\)\s*/, '')}
              </button>
            );
          })}
        </div>
        
        {showExplanation && currentQuestion.explanation && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
            <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
            <p className="text-blue-800">{currentQuestion.explanation}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center">
        <button onClick={onExit} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          Exit Quiz
        </button>
        
        <div className="flex items-center gap-4">
          {mode === 'practice' && !showAnswer && answers[currentIndex] !== null && answers[currentIndex] !== currentQuestion.correct && (
            <button
              onClick={handleShowAnswer}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Show Answer
            </button>
          )}

          {(mode === 'study' || showAnswer) && (
            <button
              onClick={moveToNextQuestion}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </button>
          )}
          
          {mode === 'exam' && (
            <button
              onClick={() => handleAnswer('')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              disabled={answers[currentIndex] !== null}
            >
              Skip Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
