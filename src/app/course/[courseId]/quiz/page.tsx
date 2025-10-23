'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getCourse, updateProgressAfterQuiz } from '@/lib/storage';
import { Course, QuizMode } from '@/lib/types';
import { getAllMCQs } from '@/lib/course-parser';
import QuizDisplay from '@/components/QuizDisplay';

/**
 * A page that serves as a centralized menu for launching a comprehensive quiz for an entire course.
 * It allows the user to select a quiz mode before starting.
 * @returns {JSX.Element} The comprehensive quiz menu page component.
 */
export default function ComprehensiveQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [quizState, setQuizState] = useState<{score: number, answers: (string|null)[]}>({score: 0, answers: []});

  useEffect(() => {
    setIsClient(true);
    if (!courseId) return;

    async function loadCourse() {
      const loadedCourse = await getCourse(courseId);
      if (!loadedCourse) {
        router.push('/');
        return;
      }
      setCourse(loadedCourse);
    }
    loadCourse();
  }, [courseId, router]);

  const handleStateChange = useCallback((score: number, answers: (string | null)[]) => {
    setQuizState({ score, answers: answers.map(a => a) });
  }, []);
  
  /**
   * Callback executed when the comprehensive quiz is completed.
   * Displays the final score and results.
   * @param {number} score - The final number of correct answers.
   * @param {(string | null)[]} answers - The user's answers for all questions.
   * @param {number} timeSpent - The total time spent in seconds.
   */
  const handleQuizComplete = (score: number, answers: (string | null)[], timeSpent: number) => {
    if (!course) return;

    const totalQuestions = getAllMCQs(course).length;
    const answeredCount = answers.filter(a => a !== null).length;
    const correctCount = score;
    const incorrectCount = answeredCount - correctCount;

    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const resultMessage = percentage === 100 ? 'Perfect! 🎉' :
                         percentage >= 80 ? 'Great job! 🌟' :
                         percentage >= 60 ? 'Good work! 👍' : 'Keep practicing! 📚';
    
    alert(`${resultMessage}\n\nScore: ${score}/${totalQuestions} (${percentage}%)\nCorrect: ${correctCount}\nIncorrect: ${incorrectCount}\n\nReturning to course dashboard.`);
    
    // Comprehensive quiz progress is not saved, so we just go back.
    router.push(`/course/${courseId}`);
  };

  /**
   * Handles user exiting the quiz prematurely.
   * Shows a summary of correct/incorrect answers before navigating away.
   */
  const handleExit = () => {
    if (isClient && confirm('Are you sure you want to exit?')) {
        const { score, answers } = quizState;
        const totalQuestions = course ? getAllMCQs(course).length : 0;
        const answeredCount = answers.filter(a => a !== null).length;
        const incorrectCount = answeredCount - score;
        alert(`Exiting Quiz.\n\nCorrect: ${score}\nIncorrect: ${incorrectCount}\nAttempted: ${answeredCount}/${totalQuestions}`);
        router.push(`/course/${courseId}`);
    }
  };
  
  if (!isClient || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-xl">Loading Comprehensive Quiz...</p>
        </div>
      </div>
    );
  }

  const allMCQsTopic = {
    topicId: 'all',
    topicTitle: 'Comprehensive Quiz',
    topicDescription: `A mix of all questions from "${course.courseTitle}"`,
    mcqs: getAllMCQs(course),
  };

  if (showModeSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-2 text-center">{allMCQsTopic.topicTitle}</h1>
          <p className="text-gray-600 text-center mb-8">{allMCQsTopic.topicDescription}</p>
          
          <div className="space-y-4 mb-8">
            <QuizModeCard
              title="Study Mode"
              description="Review all questions with answers and explanations"
              icon="📖"
              onSelect={() => { setMode('study'); setShowModeSelector(false); }}
            />
            <QuizModeCard
              title="Practice Mode"
              description="Test your knowledge with instant feedback after each question"
              icon="💪"
              onSelect={() => { setMode('practice'); setShowModeSelector(false); }}
            />
            <QuizModeCard
              title="Exam Mode"
              description="Simulate a real test with results at the end"
              icon="📝"
              onSelect={() => { setMode('exam'); setShowModeSelector(false); }}
            />
          </div>
          
          <div className="text-center text-sm text-gray-500">
            {allMCQsTopic.mcqs.length} questions • Points available: {allMCQsTopic.mcqs.reduce((sum, q) => sum + (q.points || 5), 0)}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <QuizDisplay
        topic={allMCQsTopic}
        mode={mode}
        unitId="all-units"
        courseId={courseId}
        onComplete={handleQuizComplete}
        onExit={handleExit}
        onStateChange={handleStateChange}
      />
    </div>
  );
}

/**
 * A card component for selecting a quiz mode.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the mode.
 * @param {string} props.description - The description of the mode.
 * @param {string} props.icon - The emoji icon for the mode.
 * @param {() => void} props.onSelect - The function to call when the card is selected.
 * @returns {JSX.Element} The quiz mode card component.
 */
function QuizModeCard({ title, description, icon, onSelect }: {
  title: string;
  description: string;
  icon: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </button>
  );
}
