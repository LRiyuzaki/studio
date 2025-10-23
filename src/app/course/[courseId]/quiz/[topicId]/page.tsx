'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { updateProgressAfterQuiz } from '@/lib/storage';
import { getTopicById, getUnitForTopic } from '@/lib/course-parser';
import { Topic, QuizMode, Course } from '@/lib/types';
import QuizDisplay from '@/components/QuizDisplay';
import { useFirebase, useUser } from '@/firebase';
import PrivateRoute from '@/components/auth/private-route';
import { getCourse } from '@/lib/storage';

function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [unitId, setUnitId] = useState<string>('');
  const [mode, setMode] = useState<QuizMode>('practice');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!firestore || !user) return;
    
    async function loadData() {
      setIsLoading(true);
      const courseData = await getCourse(firestore, courseId);
      if (!courseData) {
        router.push('/');
        return;
      }
      setCourse(courseData);

      const foundTopic = getTopicById(courseData, topicId);
      const foundUnitId = getUnitForTopic(courseData, topicId)?.unitId;
      
      if (!foundTopic || !foundUnitId) {
        router.push(`/course/${courseId}`);
        return;
      }
      
      setTopic(foundTopic);
      setUnitId(foundUnitId);
      setIsLoading(false);
    }

    loadData();
  }, [firestore, user, courseId, topicId, router]);
  
  const handleQuizComplete = async (score: number, answers: (string | null)[], timeSpent: number) => {
    if (!topic || !user || !firestore) return;
    
    await updateProgressAfterQuiz(
      firestore,
      user.uid,
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
    
    router.push(`/course/${courseId}`);
  };
  
  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Your progress for this attempt will not be saved.')) {
      router.push(`/course/${courseId}`);
    }
  };
  
  if (isLoading || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📚</div>
          <p className="text-xl">Loading quiz...</p>
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

export default function QuizPageContainer() {
    return <PrivateRoute><QuizPage /></PrivateRoute>;
}
