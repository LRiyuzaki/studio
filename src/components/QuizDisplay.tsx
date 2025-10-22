'use client';
import { useState, useEffect } from 'react';
import { Topic, MCQ, QuizMode } from '@/lib/types';
import Timer from './Timer';

interface QuizDisplayProps {
  topic: Topic;
  mode: QuizMode;
  unitId: string;
  courseId: string;
  onComplete: (score: number, answers: (string | null)[], timeSpent: number) => void;
  onExit: () => void;
}

export default function QuizDisplay({ topic, mode, unitId, courseId, onComplete, onExit }: QuizDisplayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [startTime] = useState(Date.now());
  const [timePerQuestion] = useState(mode === 'timed' ? 30 : 0);
  
  const currentQuestion = topic.mcqs[currentIndex];
  const isStudyMode = mode === 'study';
  const isLastQuestion = currentIndex === topic.mcqs.length - 1;

  const handleAnswer = (selected: string) => {
    if (answers[currentIndex] !== undefined && mode === 'practice') return; // Already answered in practice mode

    let isCorrect = false;
    if (selected) {
      isCorrect = selected === currentQuestion.correct;
      if (isCorrect) setScore(score + 1);
    }
    
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selected;
    setAnswers(newAnswers);
    
    if (isStudyMode) {
      setShowExplanation(true);
    } else if (mode === 'practice') {
      setShowExplanation(true); // Also show explanation in practice mode after answering
    } else {
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
  
  const moveToNextQuestion = () => {
    setShowExplanation(false);
    if (isLastQuestion) {
      const totalTime = Math.floor((Date.now() - startTime) / 1000);
      onComplete(score, answers, totalTime);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  const handleTimeExpire = () => {
    if (mode === 'timed' && answers[currentIndex] === undefined) {
      handleAnswer(''); // Auto-skip on timeout
    }
  };
  
  const getOptionStyle = (optionIndex: number) => {
    const letter = String.fromCharCode(65 + optionIndex);
    const selectedAnswer = answers[currentIndex];
    
    // Only show correctness if an answer has been submitted for this question
    const answerSubmitted = selectedAnswer !== undefined;

    if (answerSubmitted && (showExplanation || mode === 'practice')) {
      const isCorrect = currentQuestion.correct === letter;
      const isSelected = selectedAnswer === letter;
      
      if (isCorrect) return 'border-green-500 bg-green-50 text-green-800';
      if (isSelected && !isCorrect) return 'border-red-500 bg-red-50 text-red-800';
      return 'border-gray-200 bg-gray-50 opacity-70';
    }
    
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
                disabled={showExplanation || (mode === 'practice' && answers[currentIndex] !== undefined)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${getOptionStyle(index)}`}
              >
                <span className="font-bold mr-3">{letter}.</span>
                {option.replace(/^[A-D]\)\s*/, '')}
              </button>
            );
          })}
        </div>
        
        {(showExplanation || (mode === 'practice' && answers[currentIndex] !== undefined)) && currentQuestion.explanation && (
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
            disabled={showExplanation || (mode === 'practice' && answers[currentIndex] !== undefined)}
          >
            Skip Question
          </button>
        )}
      </div>
    </div>
  );
}
