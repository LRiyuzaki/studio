'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCourse, updateProgressAfterQuiz } from '@/lib/storage';
import { getTopicById, getUnitForTopic } from '@/lib/course-parser';
import { Topic, QuizMode, Course } from '@/lib/types';
import QuizDisplay from '@/components/QuizDisplay';

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [unitId, setUnitId] = useState<string>('');
  const [mode, setMode] = useState<QuizMode>('practice');
  const [showModeSelector, setShowModeSelector] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
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
      
      const foundTopic = getTopicById(loadedCourse, topicId);
      if (!foundTopic) {
        router.push(`/course/${courseId}`);
        return;
      }
      
      const foundUnit = getUnitForTopic(loadedCourse, topicId);
      if (!foundUnit) {
        router.push(`/course/${courseId}`);
        return;
      }
      
      setTopic(foundTopic);
      setUnitId(foundUnit.unitId);
    }

    loadQuizData();
  }, [courseId, topicId, router]);
  
  const handleQuizComplete = async (score: number, answers: string[], timeSpent: number) => {
    if (!topic || !isClient) return;
    
    await updateProgressAfterQuiz(
      courseId,
      topicId,
      topic.topicTitle,
      unitId,
      score,
      topic.mcqs.length,
      answers,
      mode,
      timeSpent
    );
    
    const percentage = topic.mcqs.length > 0 ? Math.round((score / topic.mcqs.length) * 100) : 0;
    const resultMessage = percentage === 100 ? 'Perfect! 🎉' :
                         percentage >= 80 ? 'Great job! 🌟' :
                         percentage >= 60 ? 'Good work! 👍' : 'Keep practicing! 📚';
    
    alert(`${resultMessage}\n\nScore: ${score}/${topic.mcqs.length} (${percentage}%)\n\nReturning to course dashboard.`);
    router.push(`/course/${courseId}`);
  };
  
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
  
  if (showModeSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-2 text-center">{topic.topicTitle}</h1>
          <p className="text-gray-600 text-center mb-8">{topic.topicDescription}</p>
          
          <div className="space-y-4 mb-8">
            <QuizModeCard
              title="Study Mode"
              description="Learn with explanations and no time pressure"
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
              title="Timed Mode"
              description="30 seconds per question. Challenge yourself!"
              icon="⏱️"
              onSelect={() => { setMode('timed'); setShowModeSelector(false); }}
            />
            <QuizModeCard
              title="Test Mode"
              description="Simulate exam conditions. Results at the end."
              icon="📝"
              onSelect={() => { setMode('test'); setShowModeSelector(false); }}
            />
          </div>
          
          <div className="text-center text-sm text-gray-500">
            {topic.mcqs.length} questions • Points available: {topic.mcqs.reduce((sum, q) => sum + (q.points || 5), 0)}
          </div>
        </div>
      </div>
    );
  }
  
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
