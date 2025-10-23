'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCourse, updateProgressAfterQuiz } from '@/lib/storage';
import { getTopicById, getUnitForTopic } from '@/lib/course-parser';
import { Topic, QuizMode, Course } from '@/lib/types';
import QuizDisplay from '@/components/QuizDisplay';

/**
 * The page for taking a quiz on a specific topic. It handles loading the topic
 * data and managing the quiz lifecycle (start, completion, exit).
 * @returns {JSX.Element} The quiz page component.
 */
export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [unitId, setUnitId] = useState<string>('');
  const [mode, setMode] = useState<QuizMode>('practice');
  const [isClient, setIsClient] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    if (!courseId || !topicId) return;

    async function loadQuizData() {
      const loadedCourse = await getCourse(courseId);
      if (!loadedCourse) {
        router.push('/');
        return;
      }
      setCourse(loadedCourse);
      
      let foundTopic: Topic | null;
      let foundUnitId: string | undefined;

      if (topicId === 'all') {
        // This case should be handled by /course/[courseId]/quiz/page.tsx
        // but as a fallback, redirect
        router.push(`/course/${courseId}/quiz`);
        return;
      } else {
        foundTopic = getTopicById(loadedCourse, topicId);
        foundUnitId = getUnitForTopic(loadedCourse, topicId)?.unitId;
        // For single topics, default to practice mode immediately
        setMode('practice');
        setShowModeSelector(false);
      }
      
      if (!foundTopic || !foundUnitId) {
        router.push(`/course/${courseId}`);
        return;
      }
      
      setTopic(foundTopic);
      setUnitId(foundUnitId);
    }

    loadQuizData();
  }, [courseId, topicId, router]);
  
  /**
   * Callback function executed when the quiz is completed.
   * It updates user progress and displays the results.
   * @param {number} score - The number of correct answers.
   * @param {string[]} answers - The user's answers.
   * @param {number} timeSpent - The total time spent on the quiz in seconds.
   */
  const handleQuizComplete = async (score: number, answers: (string | null)[], timeSpent: number) => {
    if (!topic || !isClient) return;
    
    // Don't save progress for "all" quiz for now to avoid complexity
    if (topicId !== 'all') {
      await updateProgressAfterQuiz(
        courseId,
        topicId,
        topic.topicTitle,
        unitId,
        score,
        topic.mcqs.length,
        answers as string[],
        mode,
        timeSpent
      );
    }
    
    // Redirect to course dashboard after quiz completion.
    // The summary is now handled inside QuizDisplay before this callback.
    router.push(`/course/${courseId}`);
  };
  
  /**
   * Callback function for when the user chooses to exit the quiz.
   * Prompts for confirmation before navigating away.
   */
  const handleExit = () => {
    if (isClient && confirm('Are you sure you want to exit? Your progress for this attempt will not be saved.')) {
      router.push(`/course/${courseId}`);
    }
  };
  
  if (!isClient || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-xl">Loading quiz...</p>
        </div>
      </div>
    );
  }

  // This logic is now only for comprehensive quiz, so it won't be hit here,
  // but kept for safety.
  if (showModeSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-2 text-center">{topic.topicTitle}</h1>
          <p className="text-gray-600 text-center mb-8">{topic.topicDescription}</p>
          
          <div className="space-y-4 mb-8">
            <QuizModeCard
              title="Practice Mode"
              description="Test your knowledge with instant feedback"
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
            {topic.mcqs.length} questions • Points available: {topic.mcqs.reduce((sum, q) => sum + (q.points || 5), 0)}
          </div>
        </div>
      </div>
    );
  }

  // Directly render the quiz display for single topics or after mode selection for comprehensive
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <QuizDisplay
        topic={topic}
        mode={mode}
        unitId={unitId}
        courseId={courseId}
        onComplete={handleQuizComplete}
        onExit={handleExit}
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
