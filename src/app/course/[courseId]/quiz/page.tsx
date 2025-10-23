'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { updateProgressAfterQuiz, resetComprehensiveQuizModeProgress } from '@/lib/storage';
import { QuizMode, QuizResult, Course, CourseProgress } from '@/lib/types';
import { getAllMCQs } from '@/lib/course-parser';
import QuizDisplay from '@/components/QuizDisplay';
import { useFirebase, useUser } from '@/firebase';
import PrivateRoute from '@/components/auth/private-route';
import { QuizModeCard } from '@/components/QuizModeCard';
import { getCourse, getProgress } from '@/lib/storage';

function ComprehensiveQuizPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { firestore } = useFirebase();
  const { user } = useUser();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [mode, setMode] = useState<QuizMode>('practice');
  const [showModeSelector, setShowModeSelector] = useState(true);

  const [modeProgress, setModeProgress] = useState<Record<QuizMode, QuizResult | null>>({
    practice: null,
    exam: null,
  });

  const updateLocalProgress = useCallback(() => {
    if (!progress) return;
    const newModeProgress: Record<QuizMode, QuizResult | null> = { practice: null, exam: null };
    (['practice', 'exam'] as QuizMode[]).forEach(m => {
      const lastResult = progress.quizHistory
        .filter(q => q.topicId === 'all' && q.mode === m)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
      if (lastResult) newModeProgress[m] = lastResult;
    });
    setModeProgress(newModeProgress);
  }, [progress]);

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
        
        const progressData = await getProgress(firestore, user.uid, courseId);
        setProgress(progressData);
        setIsLoading(false);
    }
    
    loadData();
  }, [firestore, user, courseId, router]);

  useEffect(() => {
    if (progress) {
      updateLocalProgress();
    }
  }, [progress, updateLocalProgress]);
  
  const handleQuizComplete = async (score: number, answers: (string | null)[], timeSpent: number) => {
    if (!course || !user || !firestore) return;
    const updatedProgress = await updateProgressAfterQuiz(firestore, user.uid, courseId, 'all', 'Comprehensive Quiz', 'all-units', score, getAllMCQs(course).length, answers, mode, timeSpent);
    setProgress(updatedProgress);
    setShowModeSelector(true);
  };

  const handleExit = () => {
    if (showModeSelector || confirm('Are you sure you want to exit?')) {
        router.push(`/course/${courseId}`);
    }
  };

  const handleResetModeProgress = async (modeToReset: QuizMode) => {
    if (confirm(`Are you sure you want to reset your progress for ${modeToReset} mode?`) && user && firestore) {
        const updatedProgress = await resetComprehensiveQuizModeProgress(firestore, user.uid, courseId, modeToReset);
        setProgress(updatedProgress);
    }
  };
  
  if (isLoading || !course) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <button onClick={() => router.push(`/course/${courseId}`)} className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Course</button>
          <h1 className="text-3xl font-bold mb-2 text-center">{allMCQsTopic.topicTitle}</h1>
          <p className="text-gray-600 text-center mb-8">{allMCQsTopic.topicDescription}</p>
          <div className="space-y-4 mb-8">
            <QuizModeCard title="Practice Mode" description="Instant feedback" icon="💪" progress={modeProgress.practice} course={course} onSelect={() => { setMode('practice'); setShowModeSelector(false); }} onReset={() => handleResetModeProgress('practice')} />
            <QuizModeCard title="Exam Mode" description="Results at the end" icon="📝" progress={modeProgress.exam} course={course} onSelect={() => { setMode('exam'); setShowModeSelector(false); }} onReset={() => handleResetModeProgress('exam')} />
          </div>
          <div className="text-center text-sm text-gray-500">{allMCQsTopic.mcqs.length} questions</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <QuizDisplay topic={allMCQsTopic} mode={mode} unitId="all-units" courseId={courseId} onComplete={handleQuizComplete} onExit={handleExit} />
    </div>
  );
}

export default function ComprehensiveQuizPageContainer() {
    return <PrivateRoute><ComprehensiveQuizPage /></PrivateRoute>;
}
