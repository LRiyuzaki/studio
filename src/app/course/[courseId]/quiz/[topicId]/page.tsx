'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getCourse, updateProgressAfterQuiz } from '@/lib/storage';
import { getTopicById, getUnitForTopic, getAllMCQs } from '@/lib/course-parser';
import { Topic, QuizMode, Course, MCQ } from '@/lib/types';
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
      
      let foundTopic: Topic | null;
      let foundUnitId: string | undefined;

      if (topicId === 'all') {
        const allMcqs = getAllMCQs(loadedCourse);
        foundTopic = {
          topicId: 'all',
          topicTitle: 'Comprehensive Quiz',
          topicDescription: `All questions from "${loadedCourse.courseTitle}"`,
          mcqs: allMcqs,
        };
        foundUnitId = 'all-units';
      } else {
        foundTopic = getTopicById(loadedCourse, topicId);
        foundUnitId = getUnitForTopic(loadedCourse, topicId)?.unitId;
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
  
  const handleQuizComplete = async (score: number, answers: string[], timeSpent: number) => {
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
        answers,
        mode,
        timeSpent
      );
    }
    
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

  // Directly render the quiz display
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
