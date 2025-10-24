
import React from 'react';
import type { QuizResults } from '../types';

interface ResultsViewProps {
  results: QuizResults;
  onRetryQuiz: () => void;
  onBackToCourse: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ results, onRetryQuiz, onBackToCourse }) => {
  const scoreColorClass = results.percentage === 100 ? 'text-green-500' : results.percentage >= 70 ? 'text-blue-500' : results.percentage >= 50 ? 'text-yellow-500' : 'text-red-500';
  const performanceMessage = results.percentage === 100 ? '🏆 Perfect Score! Incredible!' : results.percentage >= 70 ? '🌟 Great Job!' : results.percentage >= 50 ? '👍 Good Effort!' : '📚 Keep Practicing!';

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      <header className="text-center py-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">Quiz Complete! 🎉</h1>
      </header>
      
      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-200 dark:border-slate-700 text-center">
        <div className={`text-6xl sm:text-7xl font-bold ${scoreColorClass}`}>{results.percentage}%</div>
        <p className="mt-2 text-lg text-slate-600 dark:text-slate-300">You scored {results.correctAnswers} out of {results.totalQuestions}</p>
        <p className="mt-4 text-xl font-semibold text-slate-800 dark:text-slate-100">{performanceMessage}</p>
        <div className="mt-6 inline-block bg-yellow-400 text-yellow-900 font-bold py-2 px-6 rounded-full shadow-md">
            +{results.xpEarned} XP Earned
        </div>
      </section>

      <section className="my-8 flex justify-center items-center space-x-4">
        <button onClick={onBackToCourse} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition">Back to Course</button>
        <button onClick={onRetryQuiz} className="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold py-3 px-6 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition">🔄 Retry Quiz</button>
      </section>

      <section className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 sm:p-8 border border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Question Review</h3>
        <div className="space-y-6">
          {results.review.map((item, index) => (
            <div key={index} className={`p-4 rounded-lg border ${item.isCorrect ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'}`}>
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{index + 1}. {item.question}</p>
              <div className="text-sm space-y-2">
                <div className={`p-2 rounded ${item.isCorrect ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                  <strong>Your Answer:</strong> <span className={!item.isCorrect ? 'line-through' : ''}>{item.userAnswer || 'Not answered'}</span>
                </div>
                {!item.isCorrect && (
                  <div className="p-2 rounded bg-green-100 dark:bg-green-900/40">
                    <strong>Correct Answer:</strong> {item.correctAnswer}
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 italic">{item.explanation}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ResultsView;
