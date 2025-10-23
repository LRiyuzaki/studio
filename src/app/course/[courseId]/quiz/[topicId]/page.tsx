'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { updateProgressAfterQuiz } from '@/lib/storage';
import { getTopicById, getUnitForTopic } from '@/lib/course-parser';
import { Topic, QuizMode, Course } from '@/lib/types';
import QuizDisplay from '@/components/QuizDisplay';
import { useFirebase, useUser } from '@/firebase';
import PrivateRoute from '@/components/auth/private-route';
import { useCourse } from '@/lib/hooks';
import Spinner from '@/components/Spinner';

function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const topicId = params.topicId as string;
  const { user } = useUser();
  const { firestore } = useFirebase();
  
  const { course, isLoading: isCourseLoading } = useCourse(courseId);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [unitId, setUnitId] = useState<string>('');

  useEffect(() => {
    if (course) {
      const foundTopic = getTopicById(course, topicId);
      const foundUnit = getUnitForTopic(course, topicId);
      
      if (!foundTopic || !foundUnit) {
        router.push(`/course/${courseId}`);
        return;
      }
      
      setTopic(foundTopic);
      setUnitId(foundUnit.unitId);
    }
  }, [course, topicId, courseId, router]);
  
  const handleQuizComplete = async (score: number, answers: (string | null)[], timeSpent: number) => {
    if (!topic || !user || !firestore) return;
    
    await updateProgressAfterQuiz(firestore, {
      userId: user.uid,
      courseId,
      topicId,
      topicTitle: topic.topicTitle,
      unitId,
      score,
      total: topic.mcqs.length,
      answers,
      mode: 'practice', // This page is always practice mode
      timeSpent,
    });
    
    router.push(`/course/${courseId}`);
  };
  
  const handleExit = () => {
    if (confirm('Are you sure you want to exit? Your progress for this attempt will not be saved.')) {
      router.push(`/course/${courseId}`);
    }
  };
  
  if (isCourseLoading || !topic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner />
          <p className="text-xl mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <QuizDisplay
        topic={topic}
        mode={'practice'}
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
