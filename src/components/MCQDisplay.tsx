// components/MCQDisplay.tsx
'use client';
import { useState } from 'react';
import type { MCQ } from '@/lib/types';
import Timer from './Timer';
import ResultExport from './ResultExport';

export default function MCQDisplay({ mcqs }: { mcqs: MCQ[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  
  const handleAnswer = (selected: string) => {
    // The prompt's AI format gives "A", "B" etc. for the 'correct' field.
    // The options are full strings like "A) Option". We check if the selected option starts with the correct letter.
    if (selected.startsWith(mcqs[currentIndex].correct)) {
      setScore(score + 1);
    }
    
    if (currentIndex === mcqs.length - 1) {
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  if (finished) {
    return <ResultExport mcqs={mcqs} score={score} />;
  }
  
  const current = mcqs[currentIndex];
  
  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <Timer key={currentIndex} duration={30} onExpire={() => handleAnswer('')} />
        
        <h2 className="text-sm font-semibold text-gray-600 mb-4">
          Question {currentIndex + 1} of {mcqs.length}
        </h2>
        
        <p className="text-xl font-medium text-gray-900 mb-8">{current.question}</p>
        
        <div className="space-y-3">
          {current.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
