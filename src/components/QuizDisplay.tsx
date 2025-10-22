'use client';
import { useState, useEffect } from 'react';
import { Topic, MCQ, QuizMode } from '@/lib/types';
import Timer from './Timer';

/**
 * @typedef QuizDisplayProps
 * @property {Topic} topic - The topic object containing the quiz questions.
 * @property {QuizMode} mode - The current quiz mode ('study', 'practice', 'test', 'timed').
 * @property {string} unitId - The ID of the unit this topic belongs to.
 * @property {string} courseId - The ID of the course.
 * @property {(score: number, answers: (string | null)[], timeSpent: number) => void} onComplete - Callback for when the quiz is finished.
 * @property {() => void} onExit - Callback for when the user exits the quiz.
 */

/**
 * The core component for displaying and managing an active quiz session.
 * It handles question rendering, answer selection, feedback, and navigation.
 * @param {QuizDisplayProps} props - The component props.
 * @returns {JSX.Element} The quiz display component.
 */
export default function QuizDisplay({ topic, mode, unitId, courseId, onComplete, onExit }: QuizDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(topic.mcqs.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [timePerQuestion] = useState(mode === 'timed' ? 30 : 0);
  
  const currentQuestion = topic.mcqs[currentIndex];
  const isStudyMode = mode === 'study';
  const isTestMode = mode === 'test';
  const isPracticeMode = mode === 'practice';
  const isLastQuestion = currentIndex === topic.mcqs.length - 1;

  /**
   * Handles the user selecting an answer for the current question.
   * @param {string} selected - The ID of the selected option (e.g., 'A', 'B').
   */
  const handleAnswer = (selected: string) => {
    // Prevent re-answering in practice mode
    if (isPracticeMode && answers[currentIndex] !== null) return;

    const isCorrect = selected === currentQuestion.correct;
    if (isCorrect) setScore(score + 1);
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selected;
    setAnswers(newAnswers);
    
    if (isStudyMode || isPracticeMode) {
      setShowExplanation(true);
    } else { // Test or Timed mode
      if (isLastQuestion) {
        const finalScore = score + (isCorrect ? 1 : 0);
        const finalAnswers = [...newAnswers];
        const totalTime = Math.floor((Date.now() - startTime) / 1000);
        onComplete(finalScore, finalAnswers, totalTime);
      } else {
        moveToNextQuestion();
      }
    }
  };
  
  /**
   * Moves to the next question in the quiz or finishes the quiz if it's the last question.
   */
  const moveToNextQuestion = () => {
    setShowExplanation(false);
    if (isLastQuestion) {
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      onComplete(score, answers, totalTime);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  /**
   * Callback for when the timer expires in 'timed' mode.
   * Automatically submits an empty answer.
   */
  const handleTimeExpire = () => {
    if (mode === 'timed' && answers[currentIndex] === null) {
      handleAnswer(''); // Auto-skip on timeout
    }
  };
  
  /**
   * Determines the appropriate CSS classes for a quiz option based on the current state.
   * @param {number} optionIndex - The index of the option.
   * @returns {string} A string of Tailwind CSS classes.
   */
  const getOptionStyle = (optionIndex: number) => {
    const letter = String.fromCharCode(65 + optionIndex);
    const selectedAnswer = answers[currentIndex];
    
    const answerSubmitted = selectedAnswer !== null;

    if (answerSubmitted && (showExplanation || isPracticeMode)) {
      const isCorrect = currentQuestion.correct === letter;
      const isSelected = selectedAnswer === letter;
      
      if (isCorrect) return 'border-green-500 bg-green-50 text-green-800';
      if (isSelected && !isCorrect) return 'border-red-500 bg-red-50 text-red-800';
      return 'border-gray-200 bg-gray-50 opacity-70';
    }
    
    // In test mode, don't show any feedback until the end.
    if(isTestMode) {
      return 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
    }

    // Default style for Practice/Study before an answer is given
    return 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <div className="flex justify-between items-center mb-8 p-4 bg-white rounded-xl shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">{topic.topicTitle}</h1>
          <p className="text-gray-600">{topic.topicDescription}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">
            Question {currentIndex + 1} of {topic.mcqs.length}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-lg font-bold">
              Score: <span className="text-blue-600">{score}</span>
            </div>
            {mode === 'timed' && (
              <Timer 
                key={currentIndex}
                duration={timePerQuestion} 
                onExpire={handleTimeExpire}
                mode="question"
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / topic.mcqs.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <h2 className="text-xl font-bold mb-6 leading-relaxed">
          {currentQuestion.question}
        </h2>
        
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            return (
              <button
                key={index}
                onClick={() => handleAnswer(letter)}
                disabled={showExplanation || (isPracticeMode && answers[currentIndex] !== null)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getOptionStyle(index)}`}
              >
                <span className="font-bold mr-3">{letter}.</span>
                {option.replace(/^[A-D]\)\s*/, '')}
              </button>
            );
          })}
        </div>
        
        {(showExplanation || (isPracticeMode && answers[currentIndex] !== null)) && currentQuestion.explanation && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
            <p className="text-blue-800">{currentQuestion.explanation}</p>
            <button
              onClick={moveToNextQuestion}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={onExit}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Exit Quiz
        </button>
        {!isStudyMode && (
          <button
            onClick={() => handleAnswer('')}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            disabled={showExplanation || (isPracticeMode && answers[currentIndex] !== null)}
          >
            Skip Question
          </button>
        )}
      </div>
    </div>
  );
}
